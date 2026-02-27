'use client';

import { useMemo, useRef, useState } from 'react';
import { useCreatePayment, useDeletePayment, usePayments } from '@/hooks/usePayments';
import { PaymentMethod, PaymentType } from '@/lib/api/payments';

type PaymentStatus = 'unpaid' | 'partial' | 'paid';

interface PaymentTabProps {
  orderId: string;
  orderNumber: string;
  totalAmount: number;
}

const euroFormatter = new Intl.NumberFormat('en-GB', {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 2,
});

function formatMoney(value: number) {
  return euroFormatter.format(value || 0);
}

function formatDateTime(dateValue: string) {
  const parsed = new Date(dateValue);
  if (Number.isNaN(parsed.getTime())) return '-';
  return parsed.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function roundCurrency(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function exceedsCurrencyLimit(value: number, limit: number) {
  return roundCurrency(value) - roundCurrency(limit) > 0.000001;
}

function resolveStatus(totalAmount: number, paidAmount: number): PaymentStatus {
  if (paidAmount <= 0) return 'unpaid';
  if (paidAmount >= totalAmount) return 'paid';
  return 'partial';
}

export default function PaymentTab({ orderId, orderNumber, totalAmount }: PaymentTabProps) {
  const proofImageInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedProofImage, setSelectedProofImage] = useState<string | null>(null);
  const [type, setType] = useState<PaymentType>('payment');
  const [method, setMethod] = useState<PaymentMethod>('cash');
  const [amount, setAmount] = useState<number>(0);
  const [reference, setReference] = useState('');
  const [note, setNote] = useState('');
  const [proofImageDataUrl, setProofImageDataUrl] = useState('');
  const [proofImageError, setProofImageError] = useState('');

  const { data: payments = [], isLoading, error } = usePayments(orderId);
  const createPaymentMutation = useCreatePayment(orderId);
  const deletePaymentMutation = useDeletePayment(orderId);

  const totals = useMemo(() => {
    const paymentsTotal = payments
      .filter((payment) => payment.type === 'payment')
      .reduce((sum, payment) => sum + payment.amount, 0);

    const refundsTotal = payments
      .filter((payment) => payment.type === 'refund')
      .reduce((sum, payment) => sum + payment.amount, 0);

    const paidAmount = Math.max(Math.round((paymentsTotal - refundsTotal) * 100) / 100, 0);
    const balance = Math.max(Math.round((totalAmount - paidAmount) * 100) / 100, 0);
    const status = resolveStatus(totalAmount, paidAmount);

    return {
      paymentsTotal: Math.round(paymentsTotal * 100) / 100,
      refundsTotal: Math.round(refundsTotal * 100) / 100,
      paidAmount,
      balance,
      status,
    };
  }, [payments, totalAmount]);

  const referenceIsRequired = method === 'bank_transfer';
  const proofIsRequired = type === 'payment' && (method === 'bank_transfer' || method === 'mbway');
  const exceedsBalance = type === 'payment' && exceedsCurrencyLimit(amount, totals.balance);
  const exceedsPaidAmount = type === 'refund' && exceedsCurrencyLimit(amount, totals.paidAmount);

  const isSubmitDisabled =
    createPaymentMutation.isPending ||
    amount <= 0 ||
    (referenceIsRequired && !reference.trim()) ||
    (proofIsRequired && !proofImageDataUrl) ||
    exceedsBalance ||
    exceedsPaidAmount;

  const statusBadgeClass =
    totals.status === 'paid'
      ? 'bg-green-100 text-green-700'
      : totals.status === 'partial'
        ? 'bg-yellow-100 text-yellow-700'
        : 'bg-gray-100 text-gray-700';

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isSubmitDisabled) {
      return;
    }

    await createPaymentMutation.mutateAsync({
      type,
      method,
      amount,
      reference: reference.trim() || undefined,
      note: note.trim() || undefined,
      proofImageDataUrl: proofImageDataUrl || undefined,
    });

    setType('payment');
    setMethod('cash');
    setAmount(0);
    setReference('');
    setNote('');
    setProofImageDataUrl('');
    setProofImageError('');
    if (proofImageInputRef.current) {
      proofImageInputRef.current.value = '';
    }
  };

  const handleProofImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    setProofImageError('');

    if (!file) {
      setProofImageDataUrl('');
      return;
    }

    if (!file.type.startsWith('image/')) {
      setProofImageDataUrl('');
      setProofImageError('Only image files are allowed.');
      return;
    }

    const maxBytes = 2 * 1024 * 1024;
    if (file.size > maxBytes) {
      setProofImageDataUrl('');
      setProofImageError('Image must be 2MB or less.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      setProofImageDataUrl(result);
    };
    reader.onerror = () => {
      setProofImageDataUrl('');
      setProofImageError('Failed to read image file.');
    };
    reader.readAsDataURL(file);
  };

  const handleDelete = async (paymentId: string) => {
    await deletePaymentMutation.mutateAsync(paymentId);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">Payment</h2>
          <p className="text-sm text-gray-600">Order {orderNumber}</p>
        </div>
        <span className={`inline-flex w-fit items-center rounded-full px-3 py-1 text-xs font-semibold capitalize ${statusBadgeClass}`}>
          {totals.status}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
        <div className="rounded-lg border border-gray-200 p-3">
          <p className="text-xs text-gray-500 uppercase">Order Total</p>
          <p className="text-lg font-semibold text-gray-900">{formatMoney(totalAmount)}</p>
        </div>
        <div className="rounded-lg border border-gray-200 p-3">
          <p className="text-xs text-gray-500 uppercase">Paid</p>
          <p className="text-lg font-semibold text-green-700">{formatMoney(totals.paidAmount)}</p>
        </div>
        <div className="rounded-lg border border-gray-200 p-3">
          <p className="text-xs text-gray-500 uppercase">Refunded</p>
          <p className="text-lg font-semibold text-red-700">{formatMoney(totals.refundsTotal)}</p>
        </div>
        <div className="rounded-lg border border-gray-200 p-3">
          <p className="text-xs text-gray-500 uppercase">Remaining</p>
          <p className="text-lg font-semibold text-gray-900">{formatMoney(totals.balance)}</p>
        </div>
      </div>

      {totals.status !== 'paid' ? (
      <form onSubmit={handleSubmit} className="rounded-lg border border-gray-200 p-4 space-y-4">
        <h3 className="font-semibold text-gray-800">Add transaction</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select
              value={type}
              onChange={(event) => setType(event.target.value as PaymentType)}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            >
              <option value="payment">Payment</option>
              <option value="refund">Refund</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Method</label>
            <select
              value={method}
              onChange={(event) => setMethod(event.target.value as PaymentMethod)}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            >
              <option value="cash">Cash</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="mbway">MBWay</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
            <input
              type="number"
              min={0}
              step="0.01"
              value={amount || ''}
              onChange={(event) => setAmount(Number(event.target.value || 0))}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
              placeholder="0.00"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Reference {referenceIsRequired ? '(required)' : '(optional)'}
            </label>
            <input
              type="text"
              value={reference}
              onChange={(event) => setReference(event.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
              placeholder="Transaction reference"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Note (optional)</label>
          <textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            rows={2}
            className="w-full border border-gray-300 rounded-md px-3 py-2"
            placeholder="Add note"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Payment proof image {proofIsRequired ? '(required)' : '(optional)'}
          </label>
          <input
            ref={proofImageInputRef}
            type="file"
            accept="image/png,image/jpeg,image/jpg,image/webp"
            onChange={handleProofImageChange}
            className="w-full border border-gray-300 rounded-md px-3 py-2"
          />
          <p className="text-xs text-gray-500 mt-1">Upload bank transfer receipt or MBWay SMS screenshot (max 2MB).</p>
          {proofImageError && <p className="text-sm text-red-600 mt-1">{proofImageError}</p>}
          {proofImageDataUrl && (
            <div className="mt-2">
              <img src={proofImageDataUrl} alt="Payment proof preview" className="h-24 w-auto rounded border border-gray-200" />
            </div>
          )}
        </div>

        {exceedsBalance && (
          <p className="text-sm text-red-600">Amount cannot exceed remaining balance.</p>
        )}
        {exceedsPaidAmount && (
          <p className="text-sm text-red-600">Refund cannot exceed paid amount.</p>
        )}
        {(proofIsRequired && !proofImageDataUrl) && (
          <p className="text-sm text-red-600">Proof image is required for bank transfer and MBWay payments.</p>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSubmitDisabled}
            className="bg-linear-to-r from-gray-800 to-gray-900 text-white py-2 px-6 rounded-md hover:from-gray-900 hover:to-black disabled:opacity-50 transition-all font-medium shadow-sm"
          >
            {createPaymentMutation.isPending ? 'Saving...' : 'Save transaction'}
          </button>
        </div>
      </form>
      ) : (
        <div className="rounded-lg border border-green-200 bg-green-50 p-4">
          <p className="text-sm font-medium text-green-800">Order is fully paid. New payment transactions are disabled.</p>
        </div>
      )}

      <div className="rounded-lg border border-gray-200 p-4 space-y-3">
        <h3 className="font-semibold text-gray-800">Transactions</h3>

        {isLoading && <p className="text-sm text-gray-500">Loading transactions...</p>}
        {error && <p className="text-sm text-red-600">Failed to load transactions.</p>}

        {!isLoading && !error && payments.length === 0 && (
          <p className="text-sm text-gray-500">No transactions recorded yet.</p>
        )}

        {!isLoading && !error && payments.length > 0 && (
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
                  <th className="py-2 pr-3">Note</th>
                  <th className="py-2 pr-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment) => (
                  <tr key={payment._id} className="border-b last:border-b-0 text-gray-700">
                    <td className="py-2 pr-3 whitespace-nowrap">{formatDateTime(payment.receivedAt)}</td>
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
                    <td className="py-2 pr-3">{payment.note || '-'}</td>
                    <td className="py-2 pr-3">
                      <button
                        type="button"
                        onClick={() => handleDelete(payment._id)}
                        disabled={deletePaymentMutation.isPending}
                        className="text-red-600 hover:text-red-700 disabled:opacity-50"
                      >
                        Delete
                      </button>
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
