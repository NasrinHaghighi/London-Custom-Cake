'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter, useSearchParams } from 'next/navigation';
import MakeOrder from './MakeOrder';
import PaymentTab from './components/PaymentTab';
import OrdersWorkspaceHeader from './components/OrdersWorkspace/OrdersWorkspaceHeader';
import OrdersWorkspaceFilters from './components/OrdersWorkspace/OrdersWorkspaceFilters';
import OrdersWorkspaceTable from './components/OrdersWorkspace/OrdersWorkspaceTable';
import OrdersWorkspacePagination from './components/OrdersWorkspace/OrdersWorkspacePagination';
import type {
  ActiveView,
  OrderDetailResponse,
  OrderStatus,
  OrdersResponse,
  PaymentStatus,
  QuickDateFilter,
  SelectedOrder,
} from './components/OrdersWorkspace/types';
import { computeDateRange } from './components/OrdersWorkspace/utils';
import { useCustomers } from '@/hooks/useCustomers';
import { useProductTypes } from '@/hooks/useProductTypes';

export default function OrdersWorkspace() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [view, setView] = useState<ActiveView>('list');
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [customerId, setCustomerId] = useState('all');
  const [paymentStatus, setPaymentStatus] = useState<'all' | PaymentStatus>('all');
  const [orderStatus, setOrderStatus] = useState<'all' | OrderStatus>('all');
  const [productTypeId, setProductTypeId] = useState('all');
  const [quickDate, setQuickDate] = useState<QuickDateFilter>('all');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<SelectedOrder | null>(null);

  const { data: customers = [] } = useCustomers();
  const { data: productTypes = [] } = useProductTypes();

  const requestedView = searchParams.get('view');
  const requestedOrderId = searchParams.get('orderId');
  const isCreateFromQuery = requestedView === 'create';
  const isPaymentFromQuery = requestedView === 'payment' && Boolean(requestedOrderId);
  const activeView: ActiveView = isCreateFromQuery
    ? 'create'
    : isPaymentFromQuery
      ? 'payment'
      : view;

  const dateRange = useMemo(
    () => computeDateRange(quickDate, fromDate, toDate),
    [quickDate, fromDate, toDate]
  );

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    params.set('page', String(page));
    params.set('limit', '20');

    if (customerId !== 'all') params.set('customerId', customerId);
    if (paymentStatus !== 'all') params.set('paymentStatus', paymentStatus);
    if (orderStatus !== 'all') params.set('status', orderStatus);
    if (productTypeId !== 'all') params.set('productTypeId', productTypeId);
    if (search.trim()) params.set('search', search.trim());
    if (dateRange.from) params.set('from', dateRange.from);
    if (dateRange.to) params.set('to', dateRange.to);

    return params.toString();
  }, [customerId, dateRange.from, dateRange.to, orderStatus, page, paymentStatus, productTypeId, search]);

  const { data, isLoading, isFetching } = useQuery<OrdersResponse>({
    queryKey: ['orders-list', queryString],
    queryFn: async () => {
      const response = await fetch(`/api/orders?${queryString}`);
      if (!response.ok) {
        throw new Error('Failed to fetch orders');
      }
      return response.json();
    },
    staleTime: 60 * 1000,
  });

  const { data: selectedOrderQueryData, isLoading: isSelectedOrderLoading } = useQuery<OrderDetailResponse>({
    queryKey: ['orders-workspace-selected-order', requestedOrderId],
    enabled: isPaymentFromQuery && Boolean(requestedOrderId),
    queryFn: async () => {
      const response = await fetch(`/api/orders/${requestedOrderId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch selected order');
      }
      return response.json();
    },
    staleTime: 60 * 1000,
  });

  const orders = data?.orders || [];
  const total = data?.total || 0;
  const totalPages = Math.max(1, Math.ceil(total / 20));

  const resetFilters = () => {
    setSearch('');
    setCustomerId('all');
    setPaymentStatus('all');
    setOrderStatus('all');
    setProductTypeId('all');
    setQuickDate('all');
    setFromDate('');
    setToDate('');
    setPage(1);
  };

  if (activeView === 'create') {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-800">Create Order</h1>
          <button
            type="button"
            onClick={() => {
              setView('list');
              router.replace('/dashboard/orders');
            }}
            className="border border-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-50"
          >
            Back to Orders List
          </button>
        </div>
        <MakeOrder />
      </div>
    );
  }

  const paymentOrder = isPaymentFromQuery
    ? selectedOrderQueryData?.order || null
    : selectedOrder;

  if (activeView === 'payment' && isPaymentFromQuery && isSelectedOrderLoading) {
    return <div className="p-6 text-gray-600">Loading order payment tab...</div>;
  }

  if (activeView === 'payment' && paymentOrder) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-800">Manage Payment</h1>
          <button
            type="button"
            onClick={() => {
              setView('list');
              setSelectedOrder(null);
              if (isPaymentFromQuery) {
                router.replace('/dashboard/orders');
              }
            }}
            className="border border-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-50"
          >
            Back to Orders List
          </button>
        </div>

        <PaymentTab
          orderId={paymentOrder._id}
          orderNumber={paymentOrder.orderNumber}
          totalAmount={paymentOrder.totalAmount}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <OrdersWorkspaceHeader onCreateOrder={() => setView('create')} />

      <OrdersWorkspaceFilters
        search={search}
        customerId={customerId}
        paymentStatus={paymentStatus}
        orderStatus={orderStatus}
        productTypeId={productTypeId}
        quickDate={quickDate}
        fromDate={fromDate}
        toDate={toDate}
        customers={customers}
        productTypes={productTypes}
        onSearchChange={(value) => {
          setSearch(value);
          setPage(1);
        }}
        onCustomerChange={(value) => {
          setCustomerId(value);
          setPage(1);
        }}
        onPaymentStatusChange={(value) => {
          setPaymentStatus(value);
          setPage(1);
        }}
        onOrderStatusChange={(value) => {
          setOrderStatus(value);
          setPage(1);
        }}
        onProductTypeChange={(value) => {
          setProductTypeId(value);
          setPage(1);
        }}
        onQuickDateChange={(value) => {
          setQuickDate(value);
          setPage(1);
        }}
        onFromDateChange={(value) => {
          setFromDate(value);
          setPage(1);
        }}
        onToDateChange={(value) => {
          setToDate(value);
          setPage(1);
        }}
        onReset={resetFilters}
      />

      <OrdersWorkspaceTable
        orders={orders}
        isLoading={isLoading}
        onManagePayment={(order) => {
          setSelectedOrder(order);
          setView('payment');
        }}
      />

      <OrdersWorkspacePagination
        ordersCount={orders.length}
        total={total}
        isFetching={isFetching}
        page={page}
        totalPages={totalPages}
        onPrevious={() => setPage((prev) => Math.max(prev - 1, 1))}
        onNext={() => setPage((prev) => Math.min(prev + 1, totalPages))}
      />
    </div>
  );
}
