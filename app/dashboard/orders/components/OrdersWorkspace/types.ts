import type { CustomerListItem } from '@/lib/api/customers';
import type { ProductType } from '@/lib/api/productTypes';

export type OrderStatus = 'pending' | 'confirmed' | 'in-progress' | 'ready' | 'completed' | 'cancelled';
export type PaymentStatus = 'unpaid' | 'partial' | 'paid';
export type QuickDateFilter = 'all' | 'today' | 'tomorrow' | 'this-week' | 'custom';
export type ActiveView = 'list' | 'create' | 'payment';

export type OrderListItem = {
  _id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  orderDateTime: string;
  createdAt?: string;
  totalAmount: number;
};

export type OrdersResponse = {
  success: boolean;
  orders: OrderListItem[];
  total: number;
  page: number;
  limit: number;
  message?: string;
};

export type SelectedOrder = {
  _id: string;
  orderNumber: string;
  totalAmount: number;
};

export type OrderDetailResponse = {
  success: boolean;
  order?: SelectedOrder;
  message?: string;
};

export type DateBadgeMeta = {
  label: string;
  className: string;
};

export type OrdersWorkspaceFilters = {
  search: string;
  customerId: string;
  paymentStatus: 'all' | PaymentStatus;
  orderStatus: 'all' | OrderStatus;
  productTypeId: string;
  quickDate: QuickDateFilter;
  fromDate: string;
  toDate: string;
};

export type OrdersWorkspaceLookups = {
  customers: CustomerListItem[];
  productTypes: ProductType[];
};
