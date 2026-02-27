import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { z } from 'zod';
import dbConnect from '@/lib/mongodb';
import { authenticateRequest } from '@/lib/auth';
import logger from '@/lib/logger';
import Order from '@/lib/models/order';
import Payment from '@/lib/models/payment';
import { updatePaymentSchema } from '@/lib/validators/payment';
import { getPaymentTotals, recalculateOrderPaymentStatus } from '@/lib/services/paymentStatus';

const roundCurrency = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;
const exceedsCurrencyLimit = (value: number, limit: number) => roundCurrency(value) - roundCurrency(limit) > 0.000001;

function signedAmount(type: 'payment' | 'refund', amount: number) {
  return type === 'payment' ? amount : -amount;
}

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

    const payment = await Payment.findById(id).populate('receivedBy', 'name').lean();

    if (!payment) {
      return NextResponse.json({ success: false, message: 'Payment not found' }, { status: 404 });
    }

    const receivedByValue = payment.receivedBy as unknown;
    const resolvedName = payment.receivedByName
      || (typeof receivedByValue === 'object' && receivedByValue !== null && 'name' in receivedByValue
        ? String((receivedByValue as { name?: string }).name || '')
        : '');

    return NextResponse.json({
      success: true,
      payment: {
        ...payment,
        receivedByName: resolvedName,
      },
    });
  } catch (error) {
    logger.error({ error: error instanceof Error ? error.message : 'Unknown error' }, 'Payment fetch failed');
    return NextResponse.json({ success: false, message: 'Failed to fetch payment' }, { status: 500 });
  }
}

export async function PUT(
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

    const existingPayment = await Payment.findById(id).lean();
    if (!existingPayment) {
      return NextResponse.json({ success: false, message: 'Payment not found' }, { status: 404 });
    }

    const requestBody = await request.json();
    const validated = updatePaymentSchema.parse(requestBody);

    const nextType = (validated.type || existingPayment.type) as 'payment' | 'refund';
    const nextMethod = (validated.method || existingPayment.method) as 'cash' | 'bank_transfer' | 'mbway';
    const nextAmount = validated.amount ?? existingPayment.amount;
    const nextReference = validated.reference ?? existingPayment.reference;
    const nextProofImageDataUrl = validated.proofImageDataUrl ?? existingPayment.proofImageDataUrl;

    if (nextMethod === 'bank_transfer' && !nextReference?.trim()) {
      return NextResponse.json({
        success: false,
        message: 'Reference is required for bank transfer',
      }, { status: 400 });
    }

    const requiresProof = nextType === 'payment' && (nextMethod === 'bank_transfer' || nextMethod === 'mbway');
    if (requiresProof && !nextProofImageDataUrl) {
      return NextResponse.json({
        success: false,
        message: 'Proof image is required for bank transfer or MBWay payment',
      }, { status: 400 });
    }

    const order = await Order.findById(existingPayment.orderId).select('_id totalAmount').lean();
    if (!order) {
      return NextResponse.json({ success: false, message: 'Order not found' }, { status: 404 });
    }

    const totals = await getPaymentTotals(existingPayment.orderId.toString());
    const currentNet = Math.max(totals.payments - totals.refunds, 0);
    const currentContribution = signedAmount(existingPayment.type, existingPayment.amount);
    const nextContribution = signedAmount(nextType, nextAmount);
    const recalculatedNet = currentNet - currentContribution + nextContribution;

    if (recalculatedNet < 0) {
      return NextResponse.json({
        success: false,
        message: 'Refund amount cannot be greater than paid amount',
      }, { status: 400 });
    }

    if (exceedsCurrencyLimit(recalculatedNet, order.totalAmount)) {
      return NextResponse.json({
        success: false,
        message: 'Payment amount exceeds remaining balance',
      }, { status: 400 });
    }

    const dataToUpdate = {
      ...validated,
      ...(validated.receivedAt ? { receivedAt: validated.receivedAt } : {}),
    };

    const updatedPayment = await Payment.findByIdAndUpdate(
      id,
      dataToUpdate,
      { new: true, runValidators: true }
    ).populate('receivedBy', 'name');

    const summary = await recalculateOrderPaymentStatus(existingPayment.orderId.toString());

    logger.info({
      userId: auth.user.userId,
      orderId: existingPayment.orderId,
      paymentId: id,
      updates: Object.keys(validated),
    }, 'Payment updated');

    return NextResponse.json({
      success: true,
      payment: updatedPayment,
      orderPaymentSummary: summary,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.issues.map((issue: z.ZodIssue) => `${issue.path.join('.')}: ${issue.message}`);
      return NextResponse.json({ success: false, message: 'Validation failed', errors }, { status: 400 });
    }

    logger.error({ error: error instanceof Error ? error.message : 'Unknown error' }, 'Payment update failed');
    return NextResponse.json({ success: false, message: 'Failed to update payment' }, { status: 500 });
  }
}

export async function DELETE(
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
      return NextResponse.json({ success: false, message: 'Invalid payment ID' }, { status: 400 });
    }

    const deletedPayment = await Payment.findByIdAndDelete(id).lean();
    if (!deletedPayment) {
      return NextResponse.json({ success: false, message: 'Payment not found' }, { status: 404 });
    }

    const summary = await recalculateOrderPaymentStatus(deletedPayment.orderId.toString());

    logger.info({
      userId: auth.user.userId,
      orderId: deletedPayment.orderId,
      paymentId: id,
    }, 'Payment deleted');

    return NextResponse.json({
      success: true,
      message: 'Payment deleted successfully',
      orderPaymentSummary: summary,
    });
  } catch (error) {
    logger.error({ error: error instanceof Error ? error.message : 'Unknown error' }, 'Payment deletion failed');
    return NextResponse.json({ success: false, message: 'Failed to delete payment' }, { status: 500 });
  }
}
