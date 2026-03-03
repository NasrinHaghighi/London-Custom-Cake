'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import type { OrderListItem } from '@/lib/api/orders';






function formatDateLabel(d: Date) {
  return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
}

function isToday(d: Date) {
  const t = new Date();
  return d.toDateString() === t.toDateString();
}

function dayClass(d: Date) {
  const dayStart = new Date(d);
  dayStart.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (dayStart < today) return 'bg-gray-100 border-gray-300';
  if (isToday(d)) return 'bg-blue-100 border-blue-300';
  return 'bg-green-50 border-green-200';
}

function complexityBorder(complexity?: 'Low' | 'Medium' | 'High') {
  if (complexity === 'High') return 'border-2 border-red-500';
  if (complexity === 'Medium') return 'border-2 border-orange-400';
  return 'border border-gray-200';
}

function paymentStatusClass(status?: 'unpaid' | 'partial' | 'paid') {
  if (status === 'paid') return 'bg-green-100 text-green-800';
  if (status === 'partial') return 'bg-amber-100 text-amber-800';
  if (status === 'unpaid') return 'bg-red-100 text-red-800';
  return 'bg-gray-100 text-gray-700';
}

function cardBackgroundColor(complexity?: 'Low' | 'Medium' | 'High') {
  if (complexity === 'High') return 'bg-red-50';
  if (complexity === 'Medium') return 'bg-amber-50';
  if (complexity === 'Low') return 'bg-green-50';
  return 'bg-gray-50';
}

function complexityBadgeClass(complexity?: 'Low' | 'Medium' | 'High') {
  if (complexity === 'High') return 'bg-red-200 text-red-900';
  if (complexity === 'Medium') return 'bg-amber-200 text-amber-900';
  if (complexity === 'Low') return 'bg-green-200 text-green-900';
  return 'bg-gray-200 text-gray-900';
}

function OrderCard({ order }: { order: OrderListItem }) {
  return (
    <Link href={`/dashboard/orders/${order._id}`} className="block">
      <div className={`p-2 mb-2 rounded-md ${complexityBorder(order.complexity)} ${cardBackgroundColor(order.complexity)} shadow-sm hover:shadow-md transition-shadow cursor-pointer`}>
        <div className="flex justify-between items-start gap-2">
          <div className="text-xs font-semibold">{order.orderDateTime ? `${new Date(order.orderDateTime).toLocaleTimeString('en-GB', { hour: '2-digit', hour12: false })}h` : ''}</div>
          <div className="flex items-center gap-1.5">
            <span className={`text-[10px] px-1 py-0.5 rounded-full font-semibold ${complexityBadgeClass(order.complexity)}`} title={`Complexity: ${order.complexity || 'Medium'}`}>
              {(order.complexity || 'Medium').toUpperCase().substring(0, 3)}
            </span>
            <span className={`text-[11px] px-1.5 py-0.5 rounded-full font-medium ${paymentStatusClass(order.paymentStatus)}`}>
              {(order.paymentStatus || 'unpaid').toUpperCase()}
            </span>
            {order.items?.some((i) => (i.urgent)) && <span className="text-xs bg-red-600 text-white px-1 rounded">⚠</span>}
          </div>
        </div>
        <div className="text-sm font-medium truncate">{order.customerName}</div>
        <div className="text-xs text-gray-500 truncate">{order.items && order.items[0]?.productTypeName}</div>
      </div>
    </Link>
  );
}

export default function CalendarView({
  monthDate,
  weeks,
  orders,
  isLoading,
  error,
  expandedWeekId,
  onToggleWeek,
  onPrevMonth,
  onNextMonth,
}: {
  monthDate: Date;
  weeks: { id: string; start: Date; end: Date }[];
  orders: OrderListItem[];
  isLoading: boolean;
  error: unknown;
  expandedWeekId: string | null;
  onToggleWeek: (id: string) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
}) {
  const monthLabel = monthDate.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });

  const ordersByDay = useMemo(() => {
    const map: Record<string, OrderListItem[]> = {};
    for (const o of orders) {
      if (!o.orderDateTime) continue;
      const d = new Date(o.orderDateTime);
      const key = d.toDateString();
      map[key] ||= [];
      map[key].push(o);
    }

    Object.values(map).forEach((dayOrders) => {
      dayOrders.sort((a, b) => {
        const timeA = a.orderDateTime ? new Date(a.orderDateTime).getTime() : 0;
        const timeB = b.orderDateTime ? new Date(b.orderDateTime).getTime() : 0;
        return timeA - timeB;
      });
    });

    return map;
  }, [orders]);

  if (isLoading) return <p className="text-sm text-gray-500">Loading orders...</p>;
  if (error) return <p className="text-sm text-red-600">Failed to load orders.</p>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-800">Order Calendar</h1>
        <p className="text-sm text-gray-600 mt-1">Plan and manage cake orders by delivery date</p>
      </div>

      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center justify-between mb-6 pb-4 border-b">
          <button onClick={onPrevMonth} className="px-4 py-2 border rounded-md bg-white hover:bg-gray-50 text-sm font-medium transition-colors">
            ← Previous Month
          </button>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-800">{monthLabel}</div>
          </div>
          <button onClick={onNextMonth} className="px-4 py-2 border rounded-md bg-white hover:bg-gray-50 text-sm font-medium transition-colors">
            Next Month →
          </button>
        </div>

        <div className="mb-4 rounded-lg border border-gray-200 bg-gray-50 p-3 text-xs text-gray-700">
        <div className="mb-2 font-medium text-gray-800">Legend</div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-sm border border-gray-300 bg-gray-100" />
            <span>Past Day</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-sm border border-blue-300 bg-blue-100" />
            <span>Today</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-sm border border-green-200 bg-green-50" />
            <span>Upcoming Day</span>
          </div>
        </div>
        <div className="mt-2 h-px w-full bg-gray-200" />
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2">
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-4 rounded-sm border border-gray-200 bg-green-50" />
            <span>Low Complexity Card</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-4 rounded-sm border-2 border-orange-400 bg-amber-50" />
            <span>Medium Complexity Card</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-4 rounded-sm border-2 border-red-500 bg-red-50" />
            <span>High Complexity Card</span>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        {weeks.map((w) => {
          const isExpanded = expandedWeekId === w.id;
          // build days for this week (Mon-Sun)
          const days: Date[] = [];
          for (let i = 0; i < 7; i++) {
            const d = new Date(w.start);
            d.setDate(d.getDate() + i);
            days.push(d);
          }

          const totalOrdersForWeek = days.reduce((sum, d) => {
            const key = d.toDateString();
            return sum + (ordersByDay[key]?.length || 0);
          }, 0);

          const paidOrdersCount = days.reduce((sum, d) => {
            const key = d.toDateString();
            return sum + (ordersByDay[key]?.filter(o => o.paymentStatus === 'paid').length || 0);
          }, 0);

          const unpaidOrdersCount = days.reduce((sum, d) => {
            const key = d.toDateString();
            return sum + (ordersByDay[key]?.filter(o => o.paymentStatus === 'unpaid').length || 0);
          }, 0);

          const weekEnd = new Date(w.start);
          weekEnd.setDate(weekEnd.getDate() + 6);
          const weekDateRange = `${w.start.toLocaleDateString('en-GB', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-GB', { month: 'short', day: 'numeric' })}`;

          return (
            <div key={w.id} className="border rounded">
              <button
                onClick={() => onToggleWeek(w.id)}
                aria-expanded={isExpanded}
                className="w-full text-left px-4 py-3 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors">
                <div className="flex flex-col gap-0.5">
                  <div className="font-semibold text-gray-800">Week of {weekDateRange}</div>
                  <div className="text-xs text-gray-500">{isExpanded ? '▼' : '▶'} Click to collapse/expand</div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <span className="inline-block px-2.5 py-1 rounded-full bg-blue-100 text-blue-800">{totalOrdersForWeek}</span>
                    <span className="text-gray-600">orders</span>
                    {paidOrdersCount > 0 && <span className="inline-block px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-semibold">{paidOrdersCount} paid</span>}
                    {unpaidOrdersCount > 0 && <span className="inline-block px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-xs font-semibold">{unpaidOrdersCount} unpaid</span>}
                  </div>
                </div>
              </button>

              {/* collapsed summary row: always rendered, minimal info */}
              {!isExpanded && (
                <div className="p-2 grid grid-cols-7 gap-1">
                  {days.map((d) => {
                    const key = d.toDateString();
                    const dayOrders = ordersByDay[key] || [];
                    return (
                      <div
                        key={key}
                        className={`p-1 text-center rounded border ${dayClass(d)}`}
                      >
                        <div className="text-xs font-semibold truncate">
                          {formatDateLabel(d)}
                        </div>
                        <div className="text-xs text-gray-600">{dayOrders.length} orders</div>
                      </div>
                    );
                  })}
                </div>
              )}

              {isExpanded && (
                <div className="p-3 grid grid-cols-7 gap-2">
                  {days.map((d) => {
                    const key = d.toDateString();
                    const dayOrders = ordersByDay[key] || [];
                    return (
                      <div key={key} className={`p-2 rounded border ${dayClass(d)}`}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="text-xs font-semibold">{formatDateLabel(d)}</div>
                          <div className="text-xs text-gray-600">{dayOrders.length} / 8</div>
                        </div>
                        <div className="space-y-1">
                          {dayOrders.map((o) => (
                            <OrderCard key={o._id} order={o} />
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
      </div>
    </div>
  );
}
