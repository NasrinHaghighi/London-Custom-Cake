import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  deleteCustomer,
  deleteCustomerAddress,
  fetchCustomerById,
  fetchCustomers,
  updateCustomer,
  updateCustomerAddress,
} from '@/lib/api/customers';

// Type definitions
type UpdateCustomerPayload = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  notes?: string;
};

type UpdateAddressPayload = {
  addressId: string;
  data: {
    label?: string;
    line1: string;
    line2?: string;
    city: string;
    state?: string;
    postalCode: string;
    notes?: string;
  };
};

const CACHE_CONFIG = {
  staleTime: 5 * 60 * 1000, // 5 minutes
  gcTime: 10 * 60 * 1000,   // 10 minutes
};

export function useCustomers() {
  return useQuery({
    queryKey: ['customers'],
    queryFn: fetchCustomers,
    ...CACHE_CONFIG,
    retry: 2,
  });
}

export function useCustomerDetail(customerId: string) {
  return useQuery({
    queryKey: ['customer', customerId],
    queryFn: () => fetchCustomerById(customerId),
    enabled: Boolean(customerId),
    ...CACHE_CONFIG,
    retry: 2,
  });
}

export function useUpdateCustomer(customerId: string, onSuccessCallback?: () => void) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateCustomerPayload) =>
      updateCustomer(customerId, payload),
    onSuccess: () => {
      toast.success('Customer updated');
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['customer', customerId] });
      onSuccessCallback?.();
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update customer');
    },
  });
}

export function useDeleteCustomer(onSuccessCallback?: () => void) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (customerId: string) => deleteCustomer(customerId),
    onSuccess: () => {
      toast.success('Customer deleted');
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      onSuccessCallback?.();
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete customer');
    },
  });
}

export function useUpdateCustomerAddress(customerId: string, onSuccessCallback?: () => void) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateAddressPayload) =>
      updateCustomerAddress(customerId, payload.addressId, payload.data),
    onSuccess: () => {
      toast.success('Address updated');
      queryClient.invalidateQueries({ queryKey: ['customer', customerId] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      onSuccessCallback?.();
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update address');
    },
  });
}

export function useDeleteCustomerAddress(customerId: string, onSuccessCallback?: () => void) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (addressId: string) => deleteCustomerAddress(customerId, addressId),
    onSuccess: () => {
      toast.success('Address deleted');
      queryClient.invalidateQueries({ queryKey: ['customer', customerId] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      onSuccessCallback?.();
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete address');
    },
  });
}
