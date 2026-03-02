import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/mongodb';
import { authenticateRequest } from '@/lib/auth';
import logger from '@/lib/logger';
import Order from '@/lib/models/order';

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
