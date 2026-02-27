import type { DateBadgeMeta, OrderStatus, QuickDateFilter, PaymentStatus } from './types';

const currencyFormatter = new Intl.NumberFormat('en-GB', {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 2,
});

export function formatMoney(value: number) {
  return currencyFormatter.format(value || 0);
}

export function formatDateTimeDisplay(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '-';
  }

  return date.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

export function toDateInputValue(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function computeDateRange(quickDate: QuickDateFilter, customFrom: string, customTo: string): { from?: string; to?: string } {
  const now = new Date();

  if (quickDate === 'today') {
    const value = toDateInputValue(now);
    return { from: value, to: value };
  }

  if (quickDate === 'tomorrow') {
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const value = toDateInputValue(tomorrow);
    return { from: value, to: value };
  }

  if (quickDate === 'this-week') {
    const start = new Date(now);
    const end = new Date(now);
    end.setDate(end.getDate() + 7);
    return {
      from: toDateInputValue(start),
      to: toDateInputValue(end),
    };
  }

  if (quickDate === 'custom') {
    return {
      from: customFrom || undefined,
      to: customTo || undefined,
    };
  }

  return {};
}

export function getDateBadgeMeta(orderDateValue: string, orderStatus: OrderStatus): DateBadgeMeta {
  const orderDate = new Date(orderDateValue);
  if (Number.isNaN(orderDate.getTime())) {
    return { label: '-', className: 'bg-gray-100 text-gray-700' };
  }

  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const orderStart = new Date(orderDate.getFullYear(), orderDate.getMonth(), orderDate.getDate());
  const diffDays = Math.round((orderStart.getTime() - todayStart.getTime()) / (1000 * 60 * 60 * 24));

  const isClosed = orderStatus === 'completed' || orderStatus === 'cancelled';

  if (diffDays < 0 && !isClosed) {
    return { label: 'Overdue', className: 'bg-red-100 text-red-700' };
  }

  if (diffDays === 0) {
    return { label: 'Today', className: 'bg-orange-100 text-orange-700' };
  }

  if (diffDays === 1) {
    return { label: 'Tomorrow', className: 'bg-blue-100 text-blue-700' };
  }

  return { label: 'Later', className: 'bg-gray-100 text-gray-700' };
}

export function getOrderStatusClass(status: OrderStatus) {
  if (status === 'completed' || status === 'ready') return 'bg-green-100 text-green-700';
  if (status === 'cancelled') return 'bg-red-100 text-red-700';
  if (status === 'confirmed' || status === 'in-progress') return 'bg-blue-100 text-blue-700';
  return 'bg-yellow-100 text-yellow-700';
}

export function getPaymentStatusClass(status: PaymentStatus) {
  if (status === 'paid') return 'bg-green-100 text-green-700';
  if (status === 'partial') return 'bg-yellow-100 text-yellow-700';
  return 'bg-gray-100 text-gray-700';
}
