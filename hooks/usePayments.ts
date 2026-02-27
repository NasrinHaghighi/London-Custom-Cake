import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  createPayment,
  CreatePaymentPayload,
  deletePayment,
  fetchPayments,
  PaymentRecord,
} from '@/lib/api/payments';

const CACHE_CONFIG = {
  staleTime: 60 * 1000,
  gcTime: 10 * 60 * 1000,
};

export function usePayments(orderId: string) {
  return useQuery<PaymentRecord[]>({
    queryKey: ['payments', orderId],
    queryFn: () => fetchPayments(orderId),
    enabled: Boolean(orderId),
    ...CACHE_CONFIG,
  });
}

export function useCreatePayment(orderId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: Omit<CreatePaymentPayload, 'orderId'>) =>
      createPayment({ ...payload, orderId }),
    onSuccess: () => {
      toast.success('Payment saved');
      queryClient.invalidateQueries({ queryKey: ['payments', orderId] });
      queryClient.invalidateQueries({ queryKey: ['orders-by-customer'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to save payment');
    },
  });
}

export function useDeletePayment(orderId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (paymentId: string) => deletePayment(paymentId),
    onSuccess: () => {
      toast.success('Payment deleted');
      queryClient.invalidateQueries({ queryKey: ['payments', orderId] });
      queryClient.invalidateQueries({ queryKey: ['orders-by-customer'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete payment');
    },
  });
}
