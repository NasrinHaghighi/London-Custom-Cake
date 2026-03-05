'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateOrderStatus, type OrderListItem } from '@/lib/api/orders';
import { type OrderEnhanced } from './components/ProductionCard';
import { SmartHeader } from './components/SmartHeader';
import { TimeSection } from './components/TimeSection';
import { isToday, isTomorrow, TIME_SECTIONS } from './utils/dateHelpers';
import { toast } from 'react-hot-toast';

// Helper: Map API order status to card status
function mapApiStatusToCardStatus(apiStatus?: string): OrderEnhanced['orderStatus'] {
  switch (apiStatus) {
    case 'pending':
      return 'Not Started';
    case 'in-progress':
      return 'In Progress';
    case 'ready':
      return 'Ready';
    case 'completed':
      return 'Delivered';
    default:
      return 'Not Started';
  }
}

// Main Component
export default function OperationsView({
  orders,
  isLoading,
  error,
}: {
  orders: OrderListItem[];
  isLoading: boolean;
  error: Error | null | unknown;
}) {
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  // Enhance orders with real data from order items
  const enhancedOrders: OrderEnhanced[] = useMemo(
    () =>
      orders.map((o) => {
        const oAny = o as Partial<OrderEnhanced>;
        const itemProductNames = Array.isArray(o.items)
          ? o.items
              .map((item) => (item && typeof item.productTypeName === 'string' ? item.productTypeName.trim() : ''))
              .filter((name) => Boolean(name))
          : [];
        const derivedProductName = itemProductNames.length > 0 ? [...new Set(itemProductNames)].join(' + ') : undefined;

        // Extract real data from first item
        let quantity: number | undefined;
        let weight: number | undefined;
        let pricingMethod: 'perunit' | 'perkg' | undefined;
        let flavor: string | undefined;
        let shape: string | undefined;

        if (Array.isArray(o.items) && o.items.length > 0) {
          const firstItem = o.items[0];
          if (firstItem) {
            pricingMethod = firstItem.pricingMethod as 'perunit' | 'perkg';
            quantity = firstItem.quantity;
            weight = firstItem.weight;
            flavor = firstItem.flavorName;
            shape = firstItem.cakeShapeName;
          }
        }

        return {
          ...oAny,
          estimatedPrepTime: oAny.estimatedPrepTime || 2,
          orderStatus: oAny.orderStatus || mapApiStatusToCardStatus(o.status),
          productName: oAny.productName || derivedProductName || `Order #${o.orderNumber}`,
          flavor: flavor || 'Standard',
          shape: shape || 'Round',
          decoration: '',
          quantity: quantity || 1,
          weight: weight,
          pricingMethod: pricingMethod || 'perunit',
          // Explicitly include timestamp fields from database
          startedAt: o.startedAt,
          readyAt: o.readyAt,
          completedAt: o.completedAt,
        } as OrderEnhanced;
      }),
    [orders],
  );

  // Group orders by day
  const { todayOrders, tomorrowOrders } = useMemo(() => {
    const today: OrderEnhanced[] = [];
    const tomorrow: OrderEnhanced[] = [];

    enhancedOrders.forEach((order) => {
      const orderDate = new Date(order.orderDateTime || new Date());
      if (isToday(orderDate)) {
        today.push(order);
      } else if (isTomorrow(orderDate)) {
        tomorrow.push(order);
      }
    });

    return { todayOrders: today, tomorrowOrders: tomorrow };
  }, [enhancedOrders]);

  // Sort and group orders by time section
  const groupOrdersByTimeSection = useCallback((dayOrders: OrderEnhanced[]) => {
    const sections: Record<string, OrderEnhanced[]> = {
      Morning: [],
      Noon: [],
      Afternoon: [],
      Evening: [],
    };

    dayOrders.forEach((order) => {
      const deliveryTime = new Date(order.orderDateTime || new Date());
      const hour = deliveryTime.getHours();

      const section = TIME_SECTIONS.find((s) => hour >= s.start && hour < s.end);
      if (section) {
        sections[section.label].push(order);
      }
    });

    // Sort within each section
    Object.values(sections).forEach((sectionOrders) => {
      sectionOrders.sort((a, b) => {
        const aDelivery = new Date(a.orderDateTime || new Date());
        const bDelivery = new Date(b.orderDateTime || new Date());
        const aStart = new Date(aDelivery.getTime() - (a.estimatedPrepTime || 2) * 60 * 60 * 1000);
        const bStart = new Date(bDelivery.getTime() - (b.estimatedPrepTime || 2) * 60 * 60 * 1000);

        // 1. Delayed orders first
        const aDelayed = currentTime > aStart && a.orderStatus === 'Not Started' ? 1 : 0;
        const bDelayed = currentTime > bStart && b.orderStatus === 'Not Started' ? 1 : 0;
        if (aDelayed !== bDelayed) return bDelayed - aDelayed;

        // 2. Closest delivery time
        if (aDelivery.getTime() !== bDelivery.getTime()) {
          return aDelivery.getTime() - bDelivery.getTime();
        }

        // 3. Higher complexity
        const complexityOrder = { High: 3, Medium: 2, Low: 1 };
        const aComplexity = complexityOrder[a.complexity as keyof typeof complexityOrder] || 0;
        const bComplexity = complexityOrder[b.complexity as keyof typeof complexityOrder] || 0;
        return bComplexity - aComplexity;
      });
    });

    return sections;
  }, [currentTime]);

  const todayBySection = useMemo(() => groupOrdersByTimeSection(todayOrders), [todayOrders, groupOrdersByTimeSection]);
  const tomorrowBySection = useMemo(() => groupOrdersByTimeSection(tomorrowOrders), [tomorrowOrders, groupOrdersByTimeSection]);

  // Calculate workload and stats
  const todayStats = useMemo(() => {
    const total = todayOrders.length;
    const delayed = todayOrders.filter((o) => {
      const deliveryTime = new Date(o.orderDateTime || new Date());
      const shouldStartAt = new Date(deliveryTime.getTime() - (o.estimatedPrepTime || 2) * 60 * 60 * 1000);
      return currentTime > shouldStartAt && o.orderStatus === 'Not Started';
    }).length;

    const totalPrepTime = todayOrders.reduce((sum, o) => sum + (o.estimatedPrepTime || 2), 0);
    const workingHours = 8;
    const workloadPercentage = (totalPrepTime / workingHours) * 100;

    let workloadLevel: 'Light' | 'Normal' | 'Heavy';
    if (workloadPercentage < 70) workloadLevel = 'Light';
    else if (workloadPercentage < 100) workloadLevel = 'Normal';
    else workloadLevel = 'Heavy';

    return { total, delayed, totalPrepTime, workloadLevel, workloadPercentage };
  }, [todayOrders, currentTime]);

  // Tomorrow alerts
  const tomorrowAlerts = useMemo(() => {
    const earlyMorning = tomorrowOrders.filter((o) => {
      const deliveryTime = new Date(o.orderDateTime || new Date());
      return deliveryTime.getHours() < 10 && o.complexity === 'High';
    });

    const mustStartToday = tomorrowOrders.filter((o) => {
      const deliveryTime = new Date(o.orderDateTime || new Date());
      const shouldStartAt = new Date(deliveryTime.getTime() - (o.estimatedPrepTime || 2) * 60 * 60 * 1000);
      return isToday(shouldStartAt);
    });

    return { earlyMorning, mustStartToday };
  }, [tomorrowOrders]);

  // Calculate NOW indicator position (percentage from midnight)
  const nowPosition = useMemo(() => {
    const midnight = new Date(currentTime);
    midnight.setHours(0, 0, 0, 0);
    const minutesSinceMidnight = (currentTime.getTime() - midnight.getTime()) / (1000 * 60);
    const totalMinutesInDay = 24 * 60;
    return (minutesSinceMidnight / totalMinutesInDay) * 100;
  }, [currentTime]);

  // React Query mutation for updating order status
  const queryClient = useQueryClient();
  const statusMutation = useMutation({
    mutationFn: ({ orderId, newStatus }: { orderId: string; newStatus: string }) => {
      console.log('🔄 Updating order:', orderId, 'to status:', newStatus);
      return updateOrderStatus(orderId, newStatus);
    },
    onSuccess: async (data) => {
      console.log('✅ Update successful, received:', data);
      // Refetch all orders queries by finding them dynamically
      const queries = queryClient.getQueryCache().findAll();
      const ordersQueries = queries.filter(
        (query) => Array.isArray(query.queryKey) && query.queryKey[0] === 'orders'
      );
      console.log('📋 Found', ordersQueries.length, 'orders queries to refetch');
      for (const query of ordersQueries) {
        await queryClient.refetchQueries({ queryKey: query.queryKey });
      }
      console.log('✨ All orders queries refetched');
      toast.success('Order status updated successfully');
    },
    onError: (error: Error) => {
      console.error('❌ Update failed:', error);
      toast.error(`Failed to update order status: ${error.message}`);
    },
  });

  const handleStatusChange = (orderId: string, newStatus: string) => {
    // Map UI status to API status
    const statusMap: Record<string, string> = {
      'Not Started': 'pending',
      'In Progress': 'in-progress',
      'Ready': 'ready',
      'Delivered': 'completed',
    };

    const apiStatus = statusMap[newStatus] || newStatus;
    statusMutation.mutate({ orderId, newStatus: apiStatus });
  };

  if (isLoading) return <p className="text-sm text-gray-500">Loading orders...</p>;
  if (error) return <p className="text-sm text-red-600">Failed to load orders.</p>;

  return (
    <div className="space-y-4">
      {/* Smart Header */}
      <SmartHeader currentTime={currentTime} todayStats={todayStats} tomorrowAlerts={tomorrowAlerts} />

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-12 gap-4">
        {/* TODAY Column - 70% */}
        <div className="col-span-8 bg-white rounded-lg shadow-lg p-4 relative">
          <div className="flex items-center justify-between mb-4 pb-3 border-b">
            <h2 className="text-xl font-bold text-gray-800">Today</h2>
            <div className="text-sm text-gray-500">{todayOrders.length} orders</div>
          </div>

          {/* NOW Indicator */}
          <div
            className="absolute left-0 right-0 z-10 pointer-events-none"
            style={{ top: `${20 + nowPosition * 0.8}%` }}>
            <div className="flex items-center">
              <div className="bg-red-600 text-white px-2 py-0.5 rounded-l text-xs font-bold">NOW</div>
              <div className="flex-1 h-0.5 bg-red-600"></div>
            </div>
          </div>

          {/* Time Sections */}
          <div className="space-y-4">
            {TIME_SECTIONS.map((section) => {
              const sectionOrders = todayBySection[section.label];
              return (
                <TimeSection
                  key={section.label}
                  label={section.label}
                  orders={sectionOrders}
                  onStatusChange={handleStatusChange}
                  compact
                />
              );
            })}
          </div>
        </div>

        {/* TOMORROW Column - 30% */}
        <div className="col-span-4 bg-white rounded-lg shadow-lg p-4">
          <div className="flex items-center justify-between mb-4 pb-3 border-b">
            <h2 className="text-lg font-bold text-gray-800">Tomorrow</h2>
            <div className="text-sm text-gray-500">{tomorrowOrders.length} orders</div>
          </div>

          {/* Time Sections */}
          <div className="space-y-4">
            {TIME_SECTIONS.map((section) => {
              const sectionOrders = tomorrowBySection[section.label];
              if (sectionOrders.length === 0) return null;

              return (
                <TimeSection
                  key={section.label}
                  label={section.label}
                  orders={sectionOrders}
                  onStatusChange={handleStatusChange}
                  compact
                />
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
