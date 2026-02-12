import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  fetchFlavorTypes,
  createFlavorType,
  updateFlavorType,
  deleteFlavorType as deleteFlavorTypeApi,
} from '@/lib/api/flavorTypes';

const CACHE_CONFIG = {
  staleTime: 5 * 60 * 1000, // 5 minutes
  gcTime: 10 * 60 * 1000,   // 10 minutes
};

/**
 * Hook to fetch all flavor types
 */
export function useFlavorTypes() {
  return useQuery({
    queryKey: ['flavorTypes'],
    queryFn: fetchFlavorTypes,
    ...CACHE_CONFIG,
    retry: 3,
  });
}

/**
 * Hook to create a new flavor type
 */
export function useCreateFlavorType(onSuccessCallback?: () => void) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createFlavorType,
    onSuccess: () => {
      toast.success('Flavor type created successfully');
      queryClient.invalidateQueries({ queryKey: ['flavorTypes'] });
      onSuccessCallback?.();
    },
    onError: () => {
      toast.error('Failed to create flavor type');
    },
  });
}

/**
 * Hook to update an existing flavor type
 */
export function useUpdateFlavorType(onSuccessCallback?: () => void) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      id: string;
      name: string;
      description: string;
      isActive: boolean;
      hasExtraPrice: boolean;
      extraPricePerUnit?: number;
      extraPricePerKg?: number;
    }) => {
      const { id, ...updateData } = data;
      return updateFlavorType(id, updateData);
    },
    onSuccess: () => {
      toast.success('Flavor type updated successfully');
      queryClient.invalidateQueries({ queryKey: ['flavorTypes'] });
      onSuccessCallback?.();
    },
    onError: () => {
      toast.error('Failed to update flavor type');
    },
  });
}

/**
 * Hook to delete a flavor type
 */
export function useDeleteFlavorType() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteFlavorTypeApi,
    onSuccess: () => {
      toast.success('Flavor type deleted');
      queryClient.invalidateQueries({ queryKey: ['flavorTypes'] });
    },
    onError: () => {
      toast.error('Failed to delete flavor type');
    },
  });
}
