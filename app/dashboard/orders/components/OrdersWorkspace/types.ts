import type { CustomerListItem } from '@/lib/api/customers';
import type { ProductType } from '@/lib/api/productTypes';

export type OrderStatus = 'pending' | 'in-progress' | 'ready' | 'completed';
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
  totalProductionTimeMinutes?: number;
  // summary prep complexity for the whole order (highest level among items)
  complexity?: 'Low' | 'Medium' | 'Hard';
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
  orderDateTime: string;
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
