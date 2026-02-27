'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { PaymentRecord } from '@/lib/api/payments';

type OrderStatus = 'pending' | 'confirmed' | 'in-progress' | 'ready' | 'completed' | 'cancelled';
type PaymentStatus = 'unpaid' | 'partial' | 'paid';

type OrderItem = {
  productTypeName: string;
  flavorName: string;
  cakeShapeName?: string;
  pricingMethod: 'perunit' | 'perkg';
  quantity?: number;
  weight?: number;
  unitBasePrice: number;
  flavorExtraPrice: number;
  lineTotal: number;
  specialInstructions?: string;
};

type DeliveryAddress = {
  id: string;
  label?: string;
  line1: string;
  line2?: string;
  city: string;
  state?: string;
  postalCode: string;
  notes?: string;
};

type OrderDetail = {
  _id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  deliveryMethod: 'pickup' | 'delivery';
  deliveryAddress?: DeliveryAddress;
  orderDateTime: string;
  items: OrderItem[];
  notes?: string;
  subTotal: number;
  discount: number;
  totalAmount: number;
  paidAmount: number;
  paymentStatus: PaymentStatus;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
};

type OrderDetailResponse = {
  success: boolean;
  order?: OrderDetail;
  message?: string;
};

type PaymentsResponse = {
  success: boolean;
  payments?: PaymentRecord[];
  message?: string;
};

const currencyFormatter = new Intl.NumberFormat('en-GB', {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 2,
});

function formatMoney(value: number) {
  return currencyFormatter.format(value || 0);
}

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleString('en-GB');
}

function getStatusClass(status: OrderStatus) {
  if (status === 'completed' || status === 'ready') return 'bg-green-100 text-green-700';
  if (status === 'cancelled') return 'bg-red-100 text-red-700';
  if (status === 'confirmed' || status === 'in-progress') return 'bg-blue-100 text-blue-700';
  return 'bg-yellow-100 text-yellow-700';
}

function getPaymentStatusClass(status: PaymentStatus) {
  if (status === 'paid') return 'bg-green-100 text-green-700';
  if (status === 'partial') return 'bg-yellow-100 text-yellow-700';
  return 'bg-gray-100 text-gray-700';
}

export default function OrderDetailPage() {
  const params = useParams<{ id: string }>();
  const orderId = params?.id;
  const [selectedProofImage, setSelectedProofImage] = useState<string | null>(null);

  const { data: orderData, isLoading: isOrderLoading } = useQuery<OrderDetailResponse>({
    queryKey: ['order-detail', orderId],
    enabled: Boolean(orderId),
    queryFn: async () => {
      const response = await fetch(`/api/orders/${orderId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch order');
      }
      return response.json();
    },
  });

  const { data: paymentsData, isLoading: isPaymentsLoading } = useQuery<PaymentsResponse>({
    queryKey: ['order-detail-payments', orderId],
    enabled: Boolean(orderId),
    queryFn: async () => {
      const response = await fetch(`/api/payments?orderId=${orderId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch payments');
      }
      return response.json();
    },
  });

  const order = orderData?.order;
  const payments = paymentsData?.payments || [];

  const paymentTotals = useMemo(() => {
    const paymentEntries = payments.filter((payment) => payment.type === 'payment');
    const refundEntries = payments.filter((payment) => payment.type === 'refund');

    const paymentsTotal = paymentEntries
      .reduce((sum, payment) => sum + payment.amount, 0);

    const refundsTotal = refundEntries
      .reduce((sum, payment) => sum + payment.amount, 0);

    const cashPaidTotal = paymentEntries
      .filter((payment) => payment.method === 'cash')
      .reduce((sum, payment) => sum + payment.amount, 0);

    const nonCashPaidTotal = paymentEntries
      .filter((payment) => payment.method !== 'cash')
      .reduce((sum, payment) => sum + payment.amount, 0);

    const partsPaidCount = paymentEntries.length;
    const proofCount = paymentEntries.filter((payment) => Boolean(payment.proofImageDataUrl)).length;

    return {
      paymentsTotal,
      refundsTotal,
      netPaid: Math.max(paymentsTotal - refundsTotal, 0),
      cashPaidTotal,
      nonCashPaidTotal,
      partsPaidCount,
      proofCount,
    };
  }, [payments]);

  if (isOrderLoading) {
    return <div className="p-6 text-gray-600">Loading order details...</div>;
  }

  if (!order) {
    return (
      <div className="space-y-4">
        <Link href="/dashboard/orders" className="text-blue-600 hover:text-blue-700 font-medium">
          ← Back to Orders
        </Link>
        <div className="bg-white rounded-lg shadow-md p-6 text-gray-700">Order not found.</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Order Details</h1>
          <p className="text-gray-600 mt-1">{order.orderNumber}</p>
        </div>
        <Link href="/dashboard/orders" className="border border-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-50">
          Back to Orders
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p className="text-xs uppercase text-gray-500">Order Status</p>
            <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${getStatusClass(order.status)}`}>
              {order.status}
            </span>
          </div>
          <div>
            <p className="text-xs uppercase text-gray-500">Payment Status</p>
            <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${getPaymentStatusClass(order.paymentStatus)}`}>
              {order.paymentStatus}
            </span>
          </div>
          <div>
            <p className="text-xs uppercase text-gray-500">Order Date</p>
            <p className="font-medium text-gray-800 mt-1">{formatDateTime(order.orderDateTime)}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-gray-100 pt-4">
          <div>
            <p className="text-xs uppercase text-gray-500">Customer</p>
            <p className="font-medium text-gray-800 mt-1">{order.customerName}</p>
            <p className="text-sm text-gray-600">{order.customerPhone}</p>
            <p className="text-sm text-gray-600">{order.customerEmail}</p>
          </div>
          <div>
            <p className="text-xs uppercase text-gray-500">Delivery</p>
            <p className="font-medium text-gray-800 mt-1 capitalize">{order.deliveryMethod}</p>
            {order.deliveryMethod === 'delivery' && order.deliveryAddress && (
              <p className="text-sm text-gray-600 mt-1">
                {order.deliveryAddress.line1}
                {order.deliveryAddress.line2 ? `, ${order.deliveryAddress.line2}` : ''}, {order.deliveryAddress.city}
                {order.deliveryAddress.state ? `, ${order.deliveryAddress.state}` : ''} {order.deliveryAddress.postalCode}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Order Items</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-600 border-b">
                <th className="py-2 pr-3">Product</th>
                <th className="py-2 pr-3">Flavor</th>
                <th className="py-2 pr-3">Qty/Weight</th>
                <th className="py-2 pr-3">Base</th>
                <th className="py-2 pr-3">Extra</th>
                <th className="py-2 pr-3">Total</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item, index) => (
                <tr key={`${order._id}-item-${index}`} className="border-b last:border-b-0">
                  <td className="py-2 pr-3">
                    <div className="font-medium text-gray-800">{item.productTypeName}</div>
                    {item.cakeShapeName ? <div className="text-xs text-gray-500">{item.cakeShapeName}</div> : null}
                  </td>
                  <td className="py-2 pr-3 text-gray-700">{item.flavorName}</td>
                  <td className="py-2 pr-3 text-gray-700">
                    {item.pricingMethod === 'perunit' ? `${item.quantity || 0} unit` : `${item.weight || 0} kg`}
                  </td>
                  <td className="py-2 pr-3 text-gray-700">{formatMoney(item.unitBasePrice)}</td>
                  <td className="py-2 pr-3 text-gray-700">{formatMoney(item.flavorExtraPrice)}</td>
                  <td className="py-2 pr-3 font-medium text-gray-800">{formatMoney(item.lineTotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-800">Payment Summary</h2>
          <Link
            href={`/dashboard/orders?view=payment&orderId=${order._id}`}
            className="text-blue-600 hover:text-blue-700 font-medium text-sm"
          >
            Open Payment Tab
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <p className="text-xs uppercase text-gray-500">Subtotal</p>
            <p className="font-semibold text-gray-800">{formatMoney(order.subTotal)}</p>
          </div>
          <div>
            <p className="text-xs uppercase text-gray-500">Discount</p>
            <p className="font-semibold text-gray-800">{formatMoney(order.discount)}</p>
          </div>
          <div>
            <p className="text-xs uppercase text-gray-500">Total</p>
            <p className="font-semibold text-gray-800">{formatMoney(order.totalAmount)}</p>
          </div>
          <div>
            <p className="text-xs uppercase text-gray-500">Net Paid</p>
            <p className="font-semibold text-green-700">{formatMoney(paymentTotals.netPaid)}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 border-t border-gray-100 pt-3">
          <div>
            <p className="text-xs uppercase text-gray-500">Cash Paid</p>
            <p className="font-semibold text-gray-800">{formatMoney(paymentTotals.cashPaidTotal)}</p>
          </div>
          <div>
            <p className="text-xs uppercase text-gray-500">Non-Cash Paid</p>
            <p className="font-semibold text-gray-800">{formatMoney(paymentTotals.nonCashPaidTotal)}</p>
          </div>
          <div>
            <p className="text-xs uppercase text-gray-500">Paid in Parts</p>
            <p className="font-semibold text-gray-800">{paymentTotals.partsPaidCount} part(s)</p>
          </div>
          <div>
            <p className="text-xs uppercase text-gray-500">Proof Files</p>
            <p className="font-semibold text-gray-800">{paymentTotals.proofCount}</p>
            {paymentTotals.proofCount > 0 && (
              <a href="#payment-transactions" className="text-xs text-blue-600 hover:text-blue-700 font-medium">
                View Proofs
              </a>
            )}
          </div>
        </div>
      </div>

      <div id="payment-transactions" className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Payment Transactions</h2>
        {isPaymentsLoading ? (
          <p className="text-sm text-gray-600">Loading payments...</p>
        ) : payments.length === 0 ? (
          <p className="text-sm text-gray-600">No payment transactions yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-600 border-b">
                  <th className="py-2 pr-3">Date</th>
                  <th className="py-2 pr-3">Type</th>
                  <th className="py-2 pr-3">Method</th>
                  <th className="py-2 pr-3">Amount</th>
                  <th className="py-2 pr-3">Received By</th>
                  <th className="py-2 pr-3">Reference</th>
                  <th className="py-2 pr-3">Proof</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment) => (
                  <tr key={payment._id} className="border-b last:border-b-0">
                    <td className="py-2 pr-3">{formatDateTime(payment.receivedAt)}</td>
                    <td className="py-2 pr-3 capitalize">{payment.type}</td>
                    <td className="py-2 pr-3 capitalize">{payment.method.replace('_', ' ')}</td>
                    <td className="py-2 pr-3 font-medium">{formatMoney(payment.amount)}</td>
                    <td className="py-2 pr-3">{payment.receivedByName || '-'}</td>
                    <td className="py-2 pr-3">{payment.reference || '-'}</td>
                    <td className="py-2 pr-3">
                      {payment.proofImageDataUrl ? (
                        <button
                          type="button"
                          onClick={() => setSelectedProofImage(payment.proofImageDataUrl || null)}
                          className="text-blue-600 hover:text-blue-700"
                        >
                          View
                        </button>
                      ) : (
                        '-'
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedProofImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-lg p-4 max-w-3xl w-full space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-gray-800">Payment Proof</h4>
              <button
                type="button"
                onClick={() => setSelectedProofImage(null)}
                className="text-gray-600 hover:text-gray-800"
              >
                Close
              </button>
            </div>

            <div className="max-h-[70vh] overflow-auto rounded border border-gray-200 bg-gray-50 p-2">
              <img src={selectedProofImage} alt="Payment proof" className="w-full h-auto rounded" />
            </div>

            <div className="flex justify-end gap-2">
              <a
                href={selectedProofImage}
                target="_blank"
                rel="noreferrer"
                className="border border-gray-300 text-gray-700 py-1.5 px-3 rounded-md hover:bg-gray-50"
              >
                Open in New Tab
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
