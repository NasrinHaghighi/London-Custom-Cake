import mongoose from 'mongoose';
import Order from '@/lib/models/order';
import Payment from '@/lib/models/payment';
import logger from '@/lib/logger';

const round2 = (value: number) => Math.round(value * 100) / 100;

type PaymentTotals = {
  payments: number;
  refunds: number;
};

export async function getPaymentTotals(orderId: string): Promise<PaymentTotals> {
  const objectId = new mongoose.Types.ObjectId(orderId);

  const [totals] = await Payment.aggregate<PaymentTotals>([
    { $match: { orderId: objectId } },
    {
      $group: {
        _id: null,
        payments: {
          $sum: {
            $cond: [{ $eq: ['$type', 'payment'] }, '$amount', 0],
          },
        },
        refunds: {
          $sum: {
            $cond: [{ $eq: ['$type', 'refund'] }, '$amount', 0],
          },
        },
      },
    },
    {
      $project: {
        _id: 0,
        payments: 1,
        refunds: 1,
      },
    },
  ]);

  return {
    payments: round2(totals?.payments || 0),
    refunds: round2(totals?.refunds || 0),
  };
}

export function resolvePaymentStatus(totalAmount: number, paidAmount: number): 'unpaid' | 'partial' | 'paid' {
  if (paidAmount <= 0) return 'unpaid';
  if (paidAmount >= totalAmount) return 'paid';
  return 'partial';
}

export async function recalculateOrderPaymentStatus(orderId: string) {
  const order = await Order.findById(orderId).select('totalAmount').lean();
  if (!order) {
    return null;
  }

  const totals = await getPaymentTotals(orderId);
  const netPaid = round2(Math.max(totals.payments - totals.refunds, 0));
  const paymentStatus = resolvePaymentStatus(order.totalAmount, netPaid);

  await Order.findByIdAndUpdate(orderId, {
    paidAmount: netPaid,
    paymentStatus,
  });

  logger.info(
    {
      orderId,
      totalAmount: order.totalAmount,
      paidAmount: netPaid,
      paymentStatus,
      paymentsTotal: totals.payments,
      refundsTotal: totals.refunds,
    },
    'Order payment status recalculated'
  );

  return {
    totalAmount: order.totalAmount,
    paidAmount: netPaid,
    paymentStatus,
    paymentsTotal: totals.payments,
    refundsTotal: totals.refunds,
  };
}
