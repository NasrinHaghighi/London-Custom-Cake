export type ComplexityLevel = 'Low' | 'Medium' | 'High';

export interface OrderItem {
  productTypeId: string;
  productTypeName: string;
  flavorId: string;
  flavorName: string;
  cakeShapeId?: string;
  cakeShapeName?: string;
  pricingMethod: 'perunit' | 'perkg';
  quantity?: number;
  weight?: number;
  unitBasePrice: number;
  flavorExtraPrice: number;
  lineTotal: number;
  specialInstructions?: string;
  customDecorations?: string;
  referenceImages?: string[];
  customComplexityAdjustment?: ComplexityLevel;
  estimatedProductionTimeMinutes?: number;
  urgent?: boolean;
}

export interface OrderListItem {
  _id: string;
  orderNumber: string;
  customerName: string;
  customerPhone?: string;
  orderDateTime?: string;
  totalAmount?: number;
  totalProductionTimeMinutes?: number;
  paymentStatus?: 'unpaid' | 'partial' | 'paid';
  status?: string;
  complexity?: ComplexityLevel;
  items?: OrderItem[];
  createdAt?: string;
  updatedAt?: string;
  startedAt?: string;
  startedByName?: string;
  readyAt?: string;
  readyByName?: string;
  completedAt?: string;
  completedByName?: string;
  notes?: string;
}

interface OrdersResponse {
  success: boolean;
  orders?: OrderListItem[];
  page?: number;
  limit?: number;
  total?: number;
  message?: string;
}

interface OrderResponse {
  success: boolean;
  order?: OrderListItem & { notes?: string };
  message?: string;
}

export interface OrderProductionEstimateItemInput {
  productTypeId: string;
  quantity?: number;
  weight?: number;
}

export interface OrderProductionEstimateItem {
  itemIndex: number;
  productTypeId: string;
  productTypeName: string;
  minutes: number;
}

interface OrderProductionEstimateResponse {
  success: boolean;
  itemEstimates?: OrderProductionEstimateItem[];
  totalMinutes?: number;
  totalLabel?: string;
  message?: string;
  errors?: string[];
}

export async function fetchOrders(params: Record<string, unknown> = {}): Promise<OrderListItem[]> {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    query.set(key, String(value));
  });

  const url = `/api/orders${query.toString() ? `?${query.toString()}` : ''}`;
  const res = await fetch(url);

  if (!res.ok) throw new Error(`HTTP error: ${res.status}`);

  const data: OrdersResponse = await res.json();
  if (!data.success || !data.orders) {
    throw new Error(data.message || 'Failed to fetch orders');
  }

  return data.orders;
}

export async function fetchOrderById(id: string) {
  const res = await fetch(`/api/orders/${encodeURIComponent(id)}`);
  if (!res.ok) throw new Error(`HTTP error: ${res.status}`);

  const data: OrderResponse = await res.json();
  if (!data.success || !data.order) {
    throw new Error(data.message || 'Failed to fetch order');
  }

  return data.order;
}

export async function updateOrderStatus(id: string, status: string): Promise<OrderListItem> {
  const res = await fetch(`/api/orders/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ status }),
  });

  if (!res.ok) throw new Error(`HTTP error: ${res.status}`);

  const data: OrderResponse = await res.json();
  if (!data.success || !data.order) {
    throw new Error(data.message || 'Failed to update order status');
  }

  return data.order;
}

export async function updateOrder(
  id: string,
  updates: { status?: string; orderDateTime?: string | Date }
): Promise<OrderListItem> {
  const res = await fetch(`/api/orders/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(updates),
  });

  if (!res.ok) throw new Error(`HTTP error: ${res.status}`);

  const data: OrderResponse = await res.json();
  if (!data.success || !data.order) {
    throw new Error(data.message || 'Failed to update order');
  }

  return data.order;
}

export async function fetchOrderProductionTimeEstimate(payload: { items: OrderProductionEstimateItemInput[] }) {
  const res = await fetch('/api/orders/estimate-time', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const data: OrderProductionEstimateResponse = await res.json();

  if (!res.ok || !data.success || data.totalMinutes === undefined || !data.itemEstimates) {
    if (Array.isArray(data.errors) && data.errors.length > 0) {
      throw new Error(data.errors.join(', '));
    }

    throw new Error(data.message || `HTTP error: ${res.status}`);
  }

  return {
    itemEstimates: data.itemEstimates,
    totalMinutes: data.totalMinutes,
    totalLabel: data.totalLabel || `${data.totalMinutes}m`,
  };
}

