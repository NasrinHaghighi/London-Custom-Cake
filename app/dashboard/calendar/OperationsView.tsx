'use client';

import React from 'react';
import type { OrderListItem } from '@/lib/api/orders';

export default function OperationsView({
  orders,
  isLoading,
  error,
}: {
  orders: OrderListItem[];
  isLoading: boolean;
  error: any;
}) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-3">Operations view</h2>

      {isLoading && <p className="text-sm text-gray-500">Loading orders...</p>}
      {error && <p className="text-sm text-red-600">Failed to load orders.</p>}

      {!isLoading && orders.length === 0 && (
        <p className="text-sm text-gray-500">No orders found for the selected range.</p>
      )}

      {!isLoading && orders.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-600 border-b">
                <th className="py-2 pr-3">Order</th>
                <th className="py-2 pr-3">Customer</th>
                <th className="py-2 pr-3">When</th>
                <th className="py-2 pr-3">Total</th>
                <th className="py-2 pr-3">Payment</th>
                <th className="py-2 pr-3">Complexity</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o._id} className="border-b last:border-b-0 text-gray-700">
                  <td className="py-2 pr-3">{o.orderNumber}</td>
                  <td className="py-2 pr-3">{o.customerName}</td>
                  <td className="py-2 pr-3">{o.orderDateTime ? new Date(o.orderDateTime).toLocaleString() : '-'}</td>
                  <td className="py-2 pr-3">{o.totalAmount ? `€${o.totalAmount.toFixed(2)}` : '-'}</td>
                  <td className="py-2 pr-3">{o.paymentStatus || '-'}</td>
                  <td className="py-2 pr-3">{o.complexity || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
