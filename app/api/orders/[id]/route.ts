import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/mongodb';
import { authenticateRequest } from '@/lib/auth';
import logger from '@/lib/logger';
import Order from '@/lib/models/order';
import Admin from '@/lib/models/admin';
import ActivityLog from '@/lib/models/activitylog';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = authenticateRequest(request);
    if (!auth.authenticated) {
      return auth.response;
    }

    await dbConnect();
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, message: 'Invalid order ID' }, { status: 400 });
    }

    const order = await Order.findById(id).lean();
    if (!order) {
      return NextResponse.json({ success: false, message: 'Order not found' }, { status: 404 });
    }

    // derive complexity for single order detail
    const deriveComplexity = (o: any): 'Low' | 'Medium' | 'High' => {
      const levels = ['Low', 'Medium', 'High'] as const;
      let highestIndex = 1;
      if (Array.isArray(o.items)) {
        for (const item of o.items) {
          const lvl = item.customComplexityAdjustment || 'Medium';
          const idx = levels.indexOf(lvl);
          if (idx > highestIndex) {
            highestIndex = idx;
            if (highestIndex === 2) break;
          }
        }
      }
      return levels[highestIndex];
    };

    const orderWithComplexity = {
      ...order,
      complexity: deriveComplexity(order),
    };

    return NextResponse.json({ success: true, order: orderWithComplexity });
  } catch (error) {
    logger.error({ error: error instanceof Error ? error.message : 'Unknown error' }, 'Order detail fetch failed');
    return NextResponse.json({ success: false, message: 'Failed to fetch order detail' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = authenticateRequest(request);
    if (!auth.authenticated) {
      return auth.response;
    }

    await dbConnect();
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, message: 'Invalid order ID' }, { status: 400 });
    }

    const body = await request.json();
    const { status, orderDateTime } = body;

    // Build update data
    const updateData: Record<string, unknown> = {};

    // Handle status update
    if (status) {
      const validStatuses = ['pending', 'in-progress', 'ready', 'completed'];
      if (!validStatuses.includes(status)) {
        return NextResponse.json(
          { success: false, message: 'Invalid status. Must be one of: pending, in-progress, ready, completed' },
          { status: 400 }
        );
      }
      updateData.status = status;
    }

    // Handle orderDateTime update
    if (orderDateTime) {
      const dateTime = new Date(orderDateTime);
      if (isNaN(dateTime.getTime())) {
        return NextResponse.json(
          { success: false, message: 'Invalid orderDateTime format' },
          { status: 400 }
        );
      }
      updateData.orderDateTime = dateTime;
    }

    // If no valid fields to update
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { success: false, message: 'No valid fields to update (status or orderDateTime)' },
        { status: 400 }
      );
    }

    // Get current order to check transition
    const currentOrder = await Order.findById(id);
    if (!currentOrder) {
      return NextResponse.json({ success: false, message: 'Order not found' }, { status: 404 });
    }

    // Set timestamp for status changes
    if (status) {
      const now = new Date();

      // Get current admin info
      const admin = await Admin.findById(auth.user.userId).select('name email');
      const adminName = admin?.name || auth.user.email || 'Unknown';

      if (status === 'in-progress' && !currentOrder.startedAt) {
        updateData.startedAt = now;
        updateData.startedBy = auth.user.userId;
        updateData.startedByName = adminName;
      } else if (status === 'ready' && !currentOrder.readyAt) {
        updateData.readyAt = now;
        updateData.readyBy = auth.user.userId;
        updateData.readyByName = adminName;
      } else if (status === 'completed' && !currentOrder.completedAt) {
        updateData.completedAt = now;
        updateData.completedBy = auth.user.userId;
        updateData.completedByName = adminName;
      }
    }

    const order = await Order.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).lean();

    if (!order) {
      return NextResponse.json({ success: false, message: 'Order not found' }, { status: 404 });
    }

    // Log the status change to activity log
    if (status) {
      const statusMap: Record<string, string> = {
        'pending': 'Not Started',
        'in-progress': 'Started',
        'ready': 'Ready',
        'completed': 'Delivered',
      };
      const statusLabel = statusMap[status] || status;

      try {
        const activityLog = new ActivityLog({
          action: `order_${status}`,
          performedBy: auth.user.email || 'Unknown Admin',
          targetAdmin: null,
          details: `Order #${order.orderNumber} marked as ${statusLabel}`,
          timestamp: new Date(),
        });
        await activityLog.save();
      } catch (logError) {
        logger.warn({ error: logError instanceof Error ? logError.message : 'Unknown error' }, 'Failed to save activity log');
      }
    }

    logger.info({ orderId: id, newStatus: status, timestamps: { startedAt: order.startedAt, readyAt: order.readyAt, completedAt: order.completedAt } }, 'Order status updated');
    return NextResponse.json({ success: true, order });
  } catch (error) {
    logger.error({ error: error instanceof Error ? error.message : 'Unknown error' }, 'Order status update failed');
    return NextResponse.json({ success: false, message: 'Failed to update order status' }, { status: 500 });
  }
}
