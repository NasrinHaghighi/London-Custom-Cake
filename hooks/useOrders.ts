import { useQuery } from '@tanstack/react-query';
import { fetchOrderById, fetchOrders, OrderListItem } from '@/lib/api/orders';

const CACHE_CONFIG = {
  staleTime: 60 * 1000,
  gcTime: 10 * 60 * 1000,
};

export function useOrders(params: Record<string, unknown> = {}, enabled = true) {
  const key = ['orders', params];

  return useQuery<OrderListItem[]>({
    queryKey: key,
    queryFn: () => fetchOrders(params),
    enabled: enabled,
    ...CACHE_CONFIG,
  });
}

export function useOrder(orderId: string | undefined) {
  return useQuery({
    queryKey: ['order', orderId],
    queryFn: () => (orderId ? fetchOrderById(orderId) : Promise.reject(new Error('Missing id'))),
    enabled: Boolean(orderId),
    ...CACHE_CONFIG,
  });
}
