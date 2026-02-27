import type { CustomerListItem } from '@/lib/api/customers';
import type { ProductType } from '@/lib/api/productTypes';
import type { OrderStatus, PaymentStatus, QuickDateFilter } from './types';

type OrdersWorkspaceFiltersProps = {
  search: string;
  customerId: string;
  paymentStatus: 'all' | PaymentStatus;
  orderStatus: 'all' | OrderStatus;
  productTypeId: string;
  quickDate: QuickDateFilter;
  fromDate: string;
  toDate: string;
  customers: CustomerListItem[];
  productTypes: ProductType[];
  onSearchChange: (value: string) => void;
  onCustomerChange: (value: string) => void;
  onPaymentStatusChange: (value: 'all' | PaymentStatus) => void;
  onOrderStatusChange: (value: 'all' | OrderStatus) => void;
  onProductTypeChange: (value: string) => void;
  onQuickDateChange: (value: QuickDateFilter) => void;
  onFromDateChange: (value: string) => void;
  onToDateChange: (value: string) => void;
  onReset: () => void;
};

export default function OrdersWorkspaceFilters({
  search,
  customerId,
  paymentStatus,
  orderStatus,
  productTypeId,
  quickDate,
  fromDate,
  toDate,
  customers,
  productTypes,
  onSearchChange,
  onCustomerChange,
  onPaymentStatusChange,
  onOrderStatusChange,
  onProductTypeChange,
  onQuickDateChange,
  onFromDateChange,
  onToDateChange,
  onReset,
}: OrdersWorkspaceFiltersProps) {
  return (
    <div className="bg-white rounded-lg shadow-md p-4 space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <input
          type="text"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Search order #, customer, phone"
          className="border border-gray-300 rounded-md px-3 py-2"
        />

        <select
          value={customerId}
          onChange={(event) => onCustomerChange(event.target.value)}
          className="border border-gray-300 rounded-md px-3 py-2"
        >
          <option value="all">All Customers</option>
          {customers.map((customer) => (
            <option key={customer._id} value={customer._id}>
              {customer.firstName} {customer.lastName} ({customer.phone})
            </option>
          ))}
        </select>

        <select
          value={paymentStatus}
          onChange={(event) => onPaymentStatusChange(event.target.value as 'all' | PaymentStatus)}
          className="border border-gray-300 rounded-md px-3 py-2"
        >
          <option value="all">All Payment Status</option>
          <option value="unpaid">Unpaid</option>
          <option value="partial">Partial</option>
          <option value="paid">Paid</option>
        </select>

        <select
          value={orderStatus}
          onChange={(event) => onOrderStatusChange(event.target.value as 'all' | OrderStatus)}
          className="border border-gray-300 rounded-md px-3 py-2"
        >
          <option value="all">All Order Status</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="in-progress">In Progress</option>
          <option value="ready">Ready</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>

        <select
          value={productTypeId}
          onChange={(event) => onProductTypeChange(event.target.value)}
          className="border border-gray-300 rounded-md px-3 py-2"
        >
          <option value="all">All Product Types</option>
          {productTypes.map((productType) => (
            <option key={productType._id} value={productType._id}>
              {productType.name}
            </option>
          ))}
        </select>

        <select
          value={quickDate}
          onChange={(event) => onQuickDateChange(event.target.value as QuickDateFilter)}
          className="border border-gray-300 rounded-md px-3 py-2"
        >
          <option value="all">All Dates</option>
          <option value="today">Today</option>
          <option value="tomorrow">Tomorrow</option>
          <option value="this-week">This Week</option>
          <option value="custom">Custom Range</option>
        </select>

        {quickDate === 'custom' && (
          <>
            <input
              type="date"
              value={fromDate}
              onChange={(event) => onFromDateChange(event.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2"
            />
            <input
              type="date"
              value={toDate}
              onChange={(event) => onToDateChange(event.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2"
            />
          </>
        )}
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={onReset}
          className="border border-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-50"
        >
          Reset Filters
        </button>
      </div>
    </div>
  );
}
