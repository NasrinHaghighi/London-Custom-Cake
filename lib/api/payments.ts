export type PaymentMethod = 'cash' | 'bank_transfer' | 'mbway';
export type PaymentType = 'payment' | 'refund';

export interface PaymentRecord {
  _id: string;
  orderId: string;
  type: PaymentType;
  method: PaymentMethod;
  amount: number;
  reference?: string;
  note?: string;
  proofImageDataUrl?: string;
  receivedBy: string;
  receivedByName?: string;
  receivedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrderPaymentSummary {
  totalAmount: number;
  paidAmount: number;
  paymentStatus: 'unpaid' | 'partial' | 'paid';
  paymentsTotal: number;
  refundsTotal: number;
}

interface PaymentsResponse {
  success: boolean;
  payments?: PaymentRecord[];
  message?: string;
}

interface PaymentMutationResponse {
  success: boolean;
  payment?: PaymentRecord;
  orderPaymentSummary?: OrderPaymentSummary | null;
  message?: string;
  errors?: string[];
}

export interface CreatePaymentPayload {
  orderId: string;
  type: PaymentType;
  method: PaymentMethod;
  amount: number;
  reference?: string;
  note?: string;
  proofImageDataUrl?: string;
  receivedAt?: string;
}

export interface UpdatePaymentPayload {
  type?: PaymentType;
  method?: PaymentMethod;
  amount?: number;
  reference?: string;
  note?: string;
  proofImageDataUrl?: string;
  receivedAt?: string;
}

export async function fetchPayments(orderId: string): Promise<PaymentRecord[]> {
  const response = await fetch(`/api/payments?orderId=${encodeURIComponent(orderId)}`);

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data: PaymentsResponse = await response.json();

  if (!data.success || !data.payments) {
    throw new Error(data.message || 'Failed to fetch payments');
  }

  return data.payments;
}

export async function createPayment(payload: CreatePaymentPayload): Promise<PaymentMutationResponse> {
  const response = await fetch('/api/payments', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const data: PaymentMutationResponse = await response.json();

  if (!response.ok || !data.success) {
    if (data.errors?.length) {
      throw new Error(data.errors.join(', '));
    }
    throw new Error(data.message || `HTTP error! status: ${response.status}`);
  }

  return data;
}

export async function updatePayment(id: string, payload: UpdatePaymentPayload): Promise<PaymentMutationResponse> {
  const response = await fetch(`/api/payments/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const data: PaymentMutationResponse = await response.json();

  if (!response.ok || !data.success) {
    if (data.errors?.length) {
      throw new Error(data.errors.join(', '));
    }
    throw new Error(data.message || `HTTP error! status: ${response.status}`);
  }

  return data;
}

export async function deletePayment(id: string): Promise<PaymentMutationResponse> {
  const response = await fetch(`/api/payments/${id}`, {
    method: 'DELETE',
  });

  const data: PaymentMutationResponse = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.message || `HTTP error! status: ${response.status}`);
  }

  return data;
}
