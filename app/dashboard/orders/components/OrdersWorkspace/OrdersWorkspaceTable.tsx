import Link from 'next/link';
import type { OrderListItem, SelectedOrder } from './types';
import {
  formatDateTimeDisplay,
  formatMoney,
  getDateBadgeMeta,
  getOrderStatusClass,
  getPaymentStatusClass,
} from './utils';

type OrdersWorkspaceTableProps = {
  orders: OrderListItem[];
  isLoading: boolean;
  onManagePayment: (order: SelectedOrder) => void;
};

export default function OrdersWorkspaceTable({ orders, isLoading, onManagePayment }: OrdersWorkspaceTableProps) {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      {isLoading ? (
        <div className="p-6 text-gray-600">Loading orders...</div>
      ) : orders.length === 0 ? (
        <div className="p-6 text-gray-600">No orders found for selected filters.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left text-gray-600 border-b">
                <th className="px-4 py-3">Order</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Due / Received</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3">Payment</th>
                <th className="px-4 py-3">Order Status</th>
                <th className="px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => {
                const dueDateLabel = formatDateTimeDisplay(order.orderDateTime);
                const receivedDateLabel = order.createdAt
                  ? formatDateTimeDisplay(order.createdAt)
                  : '-';
                const dateBadge = getDateBadgeMeta(order.orderDateTime, order.status);
                const isUrgentOverdue = dateBadge.label === 'Overdue';
                const isUrgentToday = dateBadge.label === 'Today';
                const isUrgentTomorrow = dateBadge.label === 'Tomorrow';
                const rowClass = isUrgentOverdue
                  ? 'border-b last:border-b-0 hover:bg-red-50 bg-red-50/40'
                  : isUrgentToday
                    ? 'border-b last:border-b-0 hover:bg-orange-50 bg-orange-50/30'
                    : isUrgentTomorrow
                      ? 'border-b last:border-b-0 hover:bg-blue-50 bg-blue-50/25'
                      : 'border-b last:border-b-0 hover:bg-gray-50';
                const orderCellBorderClass = isUrgentOverdue
                  ? 'border-l-4 border-red-500'
                  : isUrgentToday
                    ? 'border-l-4 border-orange-500'
                    : isUrgentTomorrow
                      ? 'border-l-4 border-blue-500'
                      : '';

                return (
                  <tr key={order._id} className={rowClass}>
                    <td className={`px-4 py-3 font-medium text-gray-800 ${orderCellBorderClass}`}>{order.orderNumber}</td>
                    <td className="px-4 py-3">
                      <div className="text-gray-800">{order.customerName}</div>
                      <div className="text-xs text-gray-500">{order.customerPhone}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-800">Due: {dueDateLabel}</div>
                      <div className="text-xs text-gray-500 mt-0.5">Received: {receivedDateLabel}</div>
                      <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-semibold ${dateBadge.className}`}>
                        {dateBadge.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-semibold text-gray-800">{formatMoney(order.totalAmount)}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${getPaymentStatusClass(order.paymentStatus)}`}>
                        {order.paymentStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${getOrderStatusClass(order.status)}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Link
                          href={`/dashboard/orders/${order._id}`}
                          className="text-gray-700 hover:text-gray-900 font-medium"
                        >
                          View Details
                        </Link>
                        <button
                          type="button"
                          onClick={() => {
                            onManagePayment({
                              _id: order._id,
                              orderNumber: order.orderNumber,
                              totalAmount: order.totalAmount,
                            });
                          }}
                          className="text-blue-600 hover:text-blue-700 font-medium"
                        >
                          Manage Payment
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
