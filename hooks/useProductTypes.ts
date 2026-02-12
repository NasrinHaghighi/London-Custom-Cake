import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  fetchProductTypes,
  createProductType,
  updateProductType,
  deleteProductType as deleteProductTypeApi,
} from '@/lib/api/productTypes';

const CACHE_CONFIG = {
  staleTime: 5 * 60 * 1000, // 5 minutes
  gcTime: 10 * 60 * 1000,   // 10 minutes
};

/**
 * Hook to fetch all product types
 */
export function useProductTypes() {
  return useQuery({
    queryKey: ['productTypes'],
    queryFn: fetchProductTypes,
    ...CACHE_CONFIG,
    retry: 3,
  });
}

/**
 * Hook to create a new product type
 */
export function useCreateProductType(onSuccessCallback?: () => void) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createProductType,
    onSuccess: () => {
      toast.success('Product type created successfully');
      queryClient.invalidateQueries({ queryKey: ['productTypes'] });
      onSuccessCallback?.();
    },
    onError: () => {
      toast.error('Failed to create product type');
    },
  });
}

/**
 * Hook to update an existing product type
 */
export function useUpdateProductType(onSuccessCallback?: () => void) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (formData: {
      id: string;
      name: string;
      description: string;
      isActive: boolean;
      pricingMethod: 'perunit' | 'perkg';
      unitPrice?: number;
      minQuantity?: number;
      maxQuantity?: number;
      pricePerKg?: number;
      minWeight?: number;
      maxWeight?: number;
    }) => {
      const { id, ...updateData } = formData;
      return updateProductType(id, updateData);
    },
    onSuccess: () => {
      toast.success('Product type updated successfully');
      queryClient.invalidateQueries({ queryKey: ['productTypes'] });
      onSuccessCallback?.();
    },
    onError: () => {
      toast.error('Failed to update product type');
    },
  });
}

/**
 * Hook to delete a product type
 */
export function useDeleteProductType() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteProductTypeApi,
    onSuccess: () => {
      toast.success('Product type deleted');
      queryClient.invalidateQueries({ queryKey: ['productTypes'] });
    },
    onError: () => {
      toast.error('Failed to delete product type');
    },
  });
}
