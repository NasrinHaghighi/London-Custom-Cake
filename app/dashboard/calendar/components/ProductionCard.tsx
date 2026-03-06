'use client';

import { useState } from 'react';
import type { OrderListItem, OrderItem } from '@/lib/api/orders';
import Link from 'next/link';

// Enhanced order type with calculated fields
export type OrderEnhanced = OrderListItem & {
  estimatedPrepTime?: number; // in hours
  orderStatus?: 'Not Started' | 'In Progress' | 'Ready' | 'Delivered';
  productName?: string;
  flavor?: string;
  shape?: string;
  quantity?: number;
  weight?: number;
  pricingMethod?: 'perunit' | 'perkg';
  decoration?: string;
  notes?: string;
  startedByName?: string;
  readyByName?: string;
  completedByName?: string;
};

// Helper: format time as HH:mm
function formatTime(date: Date) {
  return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

// Helper: calculate delay in minutes
function getDelayMinutes(shouldStartAt: Date, now: Date): number {
  return Math.floor((now.getTime() - shouldStartAt.getTime()) / (1000 * 60));
}

// Helper: calculate progress percentage
function getProgressPercentage(shouldStartAt: Date, deliveryTime: Date, now: Date, actualStartedAt?: Date): number {
  // If order has actually started, calculate progress from actual start time
  const startTime = actualStartedAt || shouldStartAt;
  const total = deliveryTime.getTime() - startTime.getTime();
  const elapsed = now.getTime() - startTime.getTime();
  return Math.min(100, Math.max(0, (elapsed / total) * 100));
}

type ProductionCardProps = {
  order: OrderEnhanced;
  onStatusChange?: (orderId: string, newStatus: string) => void;
  compact?: boolean;
};

export function ProductionCard({ order, onStatusChange, compact = false }: ProductionCardProps) {
  const [selectedReferenceImage, setSelectedReferenceImage] = useState<string | null>(null);

  const deliveryTime = new Date(order.orderDateTime || new Date());
  const shouldStartAt = new Date(deliveryTime.getTime() - (order.estimatedPrepTime || 2) * 60 * 60 * 1000);
  const actualStartedAt = order.startedAt ? new Date(order.startedAt) : undefined;
  const now = new Date();
  const showActionButtons = order.orderStatus !== 'Delivered' && Boolean(onStatusChange);

  // Collect all reference images from order items
  const allReferenceImages: string[] = [];
  if (order.items) {
    order.items.forEach((item: OrderItem) => {
      if (item.referenceImages && item.referenceImages.length > 0) {
        allReferenceImages.push(...item.referenceImages);
      }
    });
  }
  const uniqueImages = [...new Set(allReferenceImages)]; // Remove duplicates

  const isDelayed = now > shouldStartAt && order.orderStatus === 'Not Started';
  const delayMinutes = isDelayed ? getDelayMinutes(shouldStartAt, now) : 0;
  const isOverdue = now > deliveryTime && order.orderStatus !== 'Ready' && order.orderStatus !== 'Delivered';
  const progress = getProgressPercentage(shouldStartAt, deliveryTime, now, actualStartedAt);

  // Determine card border style
  let borderClass = 'border-l-4 border-l-gray-300';
  let bgClass = 'bg-white';

  if (compact) {
    bgClass = 'bg-indigo-50';
  } else if (isOverdue) {
    borderClass = 'border-l-4 border-l-red-700';
    bgClass = 'bg-red-50';
  } else if (isDelayed) {
    borderClass = 'border-l-4 border-l-red-600';
    bgClass = 'bg-red-50';
  } else if (order.orderStatus === 'Ready') {
    borderClass = 'border-l-4 border-l-green-600';
    bgClass = 'bg-green-50';
  } else if (order.orderStatus === 'Delivered') {
    borderClass = 'border-l-4 border-l-gray-400';
    bgClass = 'bg-gray-100';
  } else if (order.orderStatus === 'In Progress') {
    borderClass = 'border-l-4 border-l-gray-700';
    bgClass = 'bg-gray-50';
  }

  return (
    <div
      className={`rounded-lg shadow-sm text-xs ${borderClass} ${bgClass} hover:shadow-md transition-all relative ${
        compact ? 'p-2 mb-2' : 'p-3 mb-3'
      } ${showActionButtons ? (compact ? 'pr-24' : 'pr-28') : ''}`}>
      {/* Quick Actions */}
      {showActionButtons && (
        <div className={`absolute flex gap-1 ${compact ? 'top-1.5 right-1.5' : 'top-2 right-2'}`}>
          {order.orderStatus === 'Not Started' && (
            <button
              onClick={() => onStatusChange?.(order._id, 'In Progress')}
              className="px-2 py-1 bg-orange-500 text-white rounded text-xs hover:bg-orange-600">
              Start
            </button>
          )}
          {(order.orderStatus === 'In Progress' || order.orderStatus === 'Not Started') && (
            <button
              onClick={() => onStatusChange?.(order._id, 'Ready')}
              className="px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700">
              Ready
            </button>
          )}
          {order.orderStatus === 'Ready' && (
            <button
              onClick={() => onStatusChange?.(order._id, 'Delivered')}
              className="px-2 py-1 bg-gray-600 text-white rounded text-xs hover:bg-gray-700">
              Delivered
            </button>
          )}
        </div>
      )}

      {/* Delayed Warning */}
      {isDelayed && (
        <div className={`inline-block bg-red-600 text-white rounded text-xs font-bold ${
          compact ? 'px-1.5 py-0.5 mb-1' : 'px-2 py-1 mb-2'
        }`}>
          DELAYED by {delayMinutes} min
        </div>
      )}

      {/* Overdue Warning */}
      {isOverdue && (
        <div className={`inline-block bg-red-700 text-white rounded text-xs font-bold ${
          compact ? 'px-1.5 py-0.5 mb-1' : 'px-2 py-1 mb-2'
        }`}>
          OVERDUE
        </div>
      )}

      {/* PRIMARY INFO */}
      <div className={compact ? 'mb-1' : 'mb-2'}>
        {compact ? (
          <div>
            <div className={`font-bold text-gray-900 truncate ${compact ? 'text-xs' : 'text-sm'} mb-1`}>
              {order.productName || `Order #${order.orderNumber}`}
            </div>
            <div className="flex gap-1.5 mb-1">
              {order.pricingMethod === 'perkg' && order.weight ? (
                <div className="bg-blue-100 border border-blue-300 rounded px-2 py-1 text-[11px] text-blue-900 font-semibold">
                  {order.weight}kg
                </div>
              ) : (
                <div className="bg-blue-100 border border-blue-300 rounded px-2 py-1 text-[11px] text-blue-900 font-semibold">
                  {order.quantity || 1}x
                </div>
              )}
            </div>
            <div className="flex gap-1.5">
              <div className="bg-emerald-100 border border-emerald-300 rounded px-2 py-1 text-[11px] text-emerald-900 font-semibold flex-1">
                Delivery: {formatTime(deliveryTime)}
              </div>
              <div className="bg-purple-100 border border-purple-300 rounded px-2 py-1 text-[11px] text-purple-900 font-semibold flex-1">
                Start: {formatTime(shouldStartAt)}
              </div>
            </div>

            {/* Status info with who did what (compact mode) - show all history */}
            {order.startedAt && (
              <div className="mt-1">
                <div className="bg-blue-50 border border-blue-200 rounded px-2 py-0.5 text-[10px] text-blue-800">
                  Started: {formatTime(typeof order.startedAt === 'string' ? new Date(order.startedAt) : order.startedAt)}
                  {order.startedByName && <span className="font-semibold"> by {order.startedByName}</span>}
                </div>
              </div>
            )}
            {order.readyAt && (
              <div className="mt-1">
                <div className="bg-green-50 border border-green-200 rounded px-2 py-0.5 text-[10px] text-green-800">
                  Ready: {formatTime(typeof order.readyAt === 'string' ? new Date(order.readyAt) : order.readyAt)}
                  {order.readyByName && <span className="font-semibold"> by {order.readyByName}</span>}
                </div>
              </div>
            )}
            {order.completedAt && (
              <div className="mt-1">
                <div className="bg-gray-50 border border-gray-300 rounded px-2 py-0.5 text-[10px] text-gray-700">
                  Delivered: {formatTime(typeof order.completedAt === 'string' ? new Date(order.completedAt) : order.completedAt)}
                  {order.completedByName && <span className="font-semibold"> by {order.completedByName}</span>}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2 min-w-0">
            <div className={`font-bold text-gray-900 truncate min-w-0 flex-1 ${compact ? 'text-xs' : 'text-sm'}`}>
              {order.productName || `Order #${order.orderNumber}`}
            </div>
            {order.pricingMethod === 'perkg' && order.weight ? (
              <div className="bg-blue-100 border border-blue-300 rounded px-2 py-1 text-xs text-blue-900 font-semibold shrink-0">
                {order.weight}kg
              </div>
            ) : (
              <div className="bg-blue-100 border border-blue-300 rounded px-2 py-1 text-xs text-blue-900 font-semibold shrink-0">
                {order.quantity || 1}x
              </div>
            )}
            <span
              className={`bg-emerald-100 border border-emerald-300 text-emerald-900 rounded font-bold shrink-0 ${
                compact ? 'px-1.5 py-0.5 text-[11px]' : 'px-2 py-0.5 text-xs'
              }`}>
              Delivery: {formatTime(deliveryTime)}
            </span>
          </div>
        )}
      </div>

      {/* Start Time (for non-compact view) */}
      {!compact && (
        <div className="mb-1.5">
          <div className="bg-purple-100 border border-purple-300 rounded px-2 py-1 text-[11px] text-purple-900 font-semibold inline-block">
            Start: {formatTime(shouldStartAt)}
          </div>
        </div>
      )}

      {/* Actually Started Time (for non-compact view when In Progress) */}
      {!compact && order.orderStatus === 'In Progress' && (
        <>
          {order.startedAt && (
            <div className="mb-1.5">
              <div className="bg-blue-100 border border-blue-300 rounded px-2 py-1 text-[11px] text-blue-900 font-semibold inline-block">
                Started at: {formatTime(typeof order.startedAt === 'string' ? new Date(order.startedAt) : order.startedAt)}
                {order.startedByName && <span className="ml-1">by {order.startedByName}</span>}
              </div>
            </div>
          )}
          {!order.startedAt && (
            <div className="mb-1.5 text-xs text-gray-500">
              (No startedAt timestamp found)
            </div>
          )}
        </>
      )}

      {/* Ready Time (for non-compact view when Ready) */}
      {!compact && order.orderStatus === 'Ready' && (
        <>
          {order.readyAt && (
            <div className="mb-1.5">
              <div className="bg-green-100 border border-green-300 rounded px-2 py-1 text-[11px] text-green-900 font-semibold inline-block">
                Ready at: {formatTime(typeof order.readyAt === 'string' ? new Date(order.readyAt) : order.readyAt)}
                {order.readyByName && <span className="ml-1">by {order.readyByName}</span>}
              </div>
            </div>
          )}
          {!order.readyAt && (
            <div className="mb-1.5 text-xs text-gray-500">
              (No readyAt timestamp found)
            </div>
          )}
        </>
      )}

      {/* Delivered Time (for non-compact view when Delivered) */}
      {!compact && order.orderStatus === 'Delivered' && (
        <>
          {order.completedAt && (
            <div className="mb-1.5">
              <div className="bg-gray-100 border border-gray-400 rounded px-2 py-1 text-[11px] text-gray-700 font-semibold inline-block">
                Delivered at: {formatTime(typeof order.completedAt === 'string' ? new Date(order.completedAt) : order.completedAt)}
                {order.completedByName && <span className="ml-1">by {order.completedByName}</span>}
              </div>
            </div>
          )}
          {!order.completedAt && (
            <div className="mb-1.5 text-xs text-gray-500">
              (No completedAt timestamp found)
            </div>
          )}
        </>
      )}

      {/* Progress Bar */}
      <div className={compact ? 'mb-1.5' : 'mb-2'}>
        <div className="flex justify-center">
          <div className={`relative ${compact ? 'h-6 w-32' : 'h-7 w-40'} bg-gray-200 rounded-full overflow-hidden shadow-inner`}>
            <div
              className={`h-full transition-all duration-500 ease-out ${isOverdue ? 'bg-red-600' : isDelayed ? 'bg-orange-500' : progress > 80 ? 'bg-amber-500' : order.orderStatus === 'In Progress' ? 'bg-blue-500' : 'bg-admin-primary'}`}
              style={{ width: `${progress}%` }}
            />
            <div className={`absolute inset-0 flex items-center justify-center ${compact ? 'text-[10px]' : 'text-xs'} font-bold ${progress > 50 ? 'text-white' : 'text-gray-700'}`}>
              {Math.round(progress)}%
            </div>
          </div>
        </div>
      </div>

      {/* PRODUCTION INFO */}
      <div
        className={`bg-gray-50 rounded ${compact ? 'p-1.5 mb-1.5 grid grid-cols-2 gap-x-3 gap-y-0.5' : 'p-2 mb-2 space-y-1'}`}>
        <div className="text-gray-700 truncate">
          <span className="font-semibold">Flavor:</span> {order.flavor || 'Standard'}
        </div>
        <div className="text-gray-700 truncate">
          <span className="font-semibold">Shape:</span> {order.shape || 'Round'}
        </div>
        {order.decoration && (
          <div className={`text-gray-700 truncate ${compact ? 'col-span-2' : ''}`}>
            <span className="font-semibold">Decoration:</span> {order.decoration}
          </div>
        )}
      </div>

      {/* REFERENCE IMAGES - Only for Today (non-compact) */}
      {!compact && uniqueImages.length > 0 && (
        <div className="mb-2">
          <div className="text-xs font-bold text-gray-700 mb-1">Reference Images</div>
          <div className="flex gap-1.5 flex-wrap">
            {uniqueImages.map((imageUrl, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedReferenceImage(imageUrl)}
                className="relative group h-16 w-16 rounded border border-gray-300 overflow-hidden hover:border-blue-500 hover:shadow-md transition-all bg-gray-100 shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imageUrl}
                  alt={`Reference ${idx + 1}`}
                  className="w-full h-full object-cover cursor-pointer"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center">
                  <span className="text-white text-lg font-bold opacity-0 group-hover:opacity-100">🔍</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* REFERENCE IMAGE LIGHTBOX MODAL */}
      {selectedReferenceImage && (
        <div
          className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedReferenceImage(null)}>
          <div
            className="bg-white rounded-lg shadow-2xl max-w-2xl max-h-[90vh] overflow-auto flex flex-col"
            onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="sticky top-0 bg-gray-100 border-b border-gray-300 px-4 py-3 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">Reference Image - Order #{order.orderNumber}</h3>
              <button
                onClick={() => setSelectedReferenceImage(null)}
                className="text-gray-600 hover:text-gray-900 text-2xl font-bold">
                ✕
              </button>
            </div>

            {/* Modal Body - Image */}
            <div className="flex-1 flex items-center justify-center bg-gray-50 p-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={selectedReferenceImage}
                alt="Order reference"
                className="max-w-full max-h-[70vh] object-contain rounded"
              />
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-gray-100 border-t border-gray-300 px-4 py-3 flex items-center justify-between">
              <a
                href={selectedReferenceImage}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 text-sm font-semibold">
                Open in New Tab ↗
              </a>
              <button
                onClick={() => setSelectedReferenceImage(null)}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 text-sm font-semibold">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* NOTES & SPECIAL INSTRUCTIONS WITH IMAGES - Always visible (even compact) because staff needs to see decorations */}
      {(order.notes || (order.items && order.items.length > 0)) && (
        <div className={`${compact ? 'bg-yellow-100' : 'bg-yellow-50'} border-l-4 border-yellow-400 rounded ${compact ? 'p-2 mb-2 text-xs' : 'p-3 mb-3 text-sm'}`}>
          <div className={`flex gap-3 ${compact ? 'flex-col' : ''}`}>
            {/* LEFT SIDE: Notes & Instructions */}
            <div className="flex-1 min-w-0">
              <div className={`font-bold text-yellow-900 ${compact ? 'text-xs' : 'text-sm'} mb-1.5`}>Notes & Instructions</div>
              {order.notes && (
                <div className={`text-gray-800 ${compact ? 'mb-1' : 'mb-2 pb-2 border-b border-yellow-200'}`}>
                  <span className="font-semibold text-yellow-900">Order Notes:</span>
                  <div className="mt-1 text-gray-700 leading-snug">{order.notes}</div>
                </div>
              )}
              {order.items && order.items.length > 0 && (
                <div>
                  {order.items.map((item: OrderItem, idx: number) => {
                    const hasItemNotes = item.specialInstructions || item.customDecorations;
                    if (!hasItemNotes) return null;
                    return (
                      <div key={idx} className={`${compact ? 'mb-1 pb-1' : 'mb-2 pb-2'} border-b border-yellow-200 last:border-b-0 last:mb-0 last:pb-0`}>
                        <div className={`${compact ? 'text-xs' : 'text-sm'} font-semibold text-yellow-900 mb-1`}>
                          Item {idx + 1}: {item.productTypeName}
                        </div>
                        {item.specialInstructions && (
                          <div className="text-gray-800 mb-1">
                            <span className="font-semibold">Special Instructions:</span>
                            <div className={`mt-1 text-gray-700 leading-snug ${compact ? '' : 'ml-4'}`}>{item.specialInstructions}</div>
                          </div>
                        )}
                        {item.customDecorations && (
                          <div className="text-gray-800">
                            <span className="font-semibold">Decoration Details:</span>
                            <div className={`mt-1 text-gray-700 leading-snug ${compact ? '' : 'ml-4'}`}>{item.customDecorations}</div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* RIGHT SIDE: Reference Images */}
            {uniqueImages.length > 0 && (
              <div className={`flex gap-1 flex-wrap ${compact ? 'justify-start' : 'justify-end'} shrink-0`}>
                {uniqueImages.slice(0, compact ? 2 : 3).map((imageUrl, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedReferenceImage(imageUrl)}
                    className={`relative group rounded border border-yellow-300 overflow-hidden hover:border-yellow-600 hover:shadow-md transition-all bg-gray-200 ${
                      compact ? 'h-10 w-10' : 'h-14 w-14'
                    } shrink-0`}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={imageUrl}
                      alt={`Reference ${idx + 1}`}
                      className="w-full h-full object-cover cursor-pointer"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all"></div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* MANAGER INFO - Badges */}
      <div className={`flex flex-wrap gap-1 ${compact ? 'mb-0.5' : 'mb-1'}`}>
        {order.complexity && (
          <span
            className={`${compact ? 'px-1.5 text-[11px]' : 'px-2 text-xs'} py-0.5 rounded font-semibold ${
              order.complexity === 'High'
                ? 'bg-red-200 text-red-900'
                : order.complexity === 'Medium'
                  ? 'bg-amber-200 text-amber-900'
                  : 'bg-green-200 text-green-900'
            }`}>
            {order.complexity}
          </span>
        )}

        {order.paymentStatus && (
          <span
            className={`${compact ? 'px-1.5 text-[11px]' : 'px-2 text-xs'} py-0.5 rounded font-semibold ${
              order.paymentStatus === 'paid'
                ? 'bg-green-100 text-green-900'
                : order.paymentStatus === 'partial'
                  ? 'bg-amber-100 text-amber-900'
                  : 'bg-red-100 text-red-900'
            }`}>
            {order.paymentStatus === 'paid' ? 'Paid' : order.paymentStatus === 'partial' ? 'Partial' : 'Unpaid'}
          </span>
        )}

        <span className={`${compact ? 'px-1.5 text-[11px]' : 'px-2 text-xs'} py-0.5 rounded font-semibold bg-gray-200 text-gray-900`}>
          {order.orderStatus || 'Not Started'}
        </span>
      </div>

      {/* Customer Name & Details Link */}
      <div className="flex items-center justify-between text-xs mt-1">
        <div className="text-gray-500">{order.customerName || 'Walk-in Customer'}</div>
        <Link
          href={`/dashboard/orders/${order._id}`}
          className="text-blue-600 hover:text-blue-800 font-semibold hover:underline">
          View Details →
        </Link>
      </div>
    </div>
  );
}
