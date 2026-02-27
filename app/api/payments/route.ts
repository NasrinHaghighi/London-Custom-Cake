import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { z } from 'zod';
import dbConnect from '@/lib/mongodb';
import { authenticateRequest } from '@/lib/auth';
import logger from '@/lib/logger';
import Order from '@/lib/models/order';
import Payment from '@/lib/models/payment';
import Admin from '@/lib/models/admin';
import { createPaymentSchema, paymentQuerySchema } from '@/lib/validators/payment';
import { getPaymentTotals, recalculateOrderPaymentStatus } from '@/lib/services/paymentStatus';

const roundCurrency = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;
const exceedsCurrencyLimit = (value: number, limit: number) => roundCurrency(value) - roundCurrency(limit) > 0.000001;

export async function GET(request: NextRequest) {
  try {
    const auth = authenticateRequest(request);
    if (!auth.authenticated) {
      return auth.response;
    }

    await dbConnect();

    const validatedQuery = paymentQuerySchema.parse({
      orderId: request.nextUrl.searchParams.get('orderId') || undefined,
      page: request.nextUrl.searchParams.get('page') || undefined,
      limit: request.nextUrl.searchParams.get('limit') || undefined,
    });

    const filter: Record<string, unknown> = {};

    if (validatedQuery.orderId) {
      filter.orderId = new mongoose.Types.ObjectId(validatedQuery.orderId);
    }

    const skip = (validatedQuery.page - 1) * validatedQuery.limit;

    const [payments, total] = await Promise.all([
      Payment.find(filter)
        .populate('receivedBy', 'name')
        .sort({ receivedAt: -1, createdAt: -1 })
        .skip(skip)
        .limit(validatedQuery.limit)
        .lean(),
      Payment.countDocuments(filter),
    ]);

    const normalizedPayments = payments.map((payment) => {
      const receivedByValue = payment.receivedBy as unknown;
      const resolvedName = payment.receivedByName
        || (typeof receivedByValue === 'object' && receivedByValue !== null && 'name' in receivedByValue
          ? String((receivedByValue as { name?: string }).name || '')
          : '');

      return {
        ...payment,
        receivedByName: resolvedName,
      };
    });

    return NextResponse.json({
      success: true,
      page: validatedQuery.page,
      limit: validatedQuery.limit,
      total,
      payments: normalizedPayments,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.issues.map((issue: z.ZodIssue) => `${issue.path.join('.')}: ${issue.message}`);
      return NextResponse.json({ success: false, message: 'Validation failed', errors }, { status: 400 });
    }

    logger.error({ error: error instanceof Error ? error.message : 'Unknown error' }, 'Payment fetch failed');

    return NextResponse.json({ success: false, message: 'Failed to fetch payments' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = authenticateRequest(request);
    if (!auth.authenticated) {
      return auth.response;
    }

    await dbConnect();

    const requestBody = await request.json();
    const validated = createPaymentSchema.parse(requestBody);

    const order = await Order.findById(validated.orderId).select('_id totalAmount').lean();
    if (!order) {
      return NextResponse.json({ success: false, message: 'Order not found' }, { status: 404 });
    }

    const totals = await getPaymentTotals(validated.orderId);
    const currentNet = Math.max(totals.payments - totals.refunds, 0);

    const admin = await Admin.findById(auth.user.userId).select('name').lean();
    if (!admin?.name) {
      return NextResponse.json({ success: false, message: 'Authenticated admin not found' }, { status: 401 });
    }

    if (validated.type === 'payment' && exceedsCurrencyLimit(currentNet + validated.amount, order.totalAmount)) {
      return NextResponse.json({
        success: false,
        message: 'Payment amount exceeds remaining balance',
      }, { status: 400 });
    }

    if (validated.type === 'refund' && exceedsCurrencyLimit(validated.amount, currentNet)) {
      return NextResponse.json({
        success: false,
        message: 'Refund amount cannot be greater than paid amount',
      }, { status: 400 });
    }

    const createdPayment = await Payment.create({
      orderId: new mongoose.Types.ObjectId(validated.orderId),
      type: validated.type,
      method: validated.method,
      amount: validated.amount,
      reference: validated.reference || '',
      note: validated.note || '',
      proofImageDataUrl: validated.proofImageDataUrl || '',
      receivedAt: validated.receivedAt || new Date(),
      receivedBy: new mongoose.Types.ObjectId(auth.user.userId),
      receivedByName: admin.name,
    });

    const summary = await recalculateOrderPaymentStatus(validated.orderId);

    logger.info({
      userId: auth.user.userId,
      orderId: validated.orderId,
      paymentId: createdPayment._id,
      type: validated.type,
      method: validated.method,
      amount: validated.amount,
    }, 'Payment created');

    return NextResponse.json({
      success: true,
      payment: createdPayment,
      orderPaymentSummary: summary,
    }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.issues.map((issue: z.ZodIssue) => `${issue.path.join('.')}: ${issue.message}`);
      return NextResponse.json({ success: false, message: 'Validation failed', errors }, { status: 400 });
    }

    logger.error({ error: error instanceof Error ? error.message : 'Unknown error' }, 'Payment creation failed');

    return NextResponse.json({ success: false, message: 'Failed to create payment' }, { status: 500 });
  }
}
