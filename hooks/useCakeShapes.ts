import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  fetchCakeShapes,
  createCakeShape,
  updateCakeShape,
  deleteCakeShape as deleteCakeShapeApi,
} from '@/lib/api/cakeShapes';

const CACHE_CONFIG = {
  staleTime: 5 * 60 * 1000, // 5 minutes
  gcTime: 10 * 60 * 1000,   // 10 minutes
};

/**
 * Hook to fetch all cake shapes
 */
export function useCakeShapes() {
  return useQuery({
    queryKey: ['cakeShapes'],
    queryFn: fetchCakeShapes,
    ...CACHE_CONFIG,
    retry: 3,
  });
}

/**
 * Hook to create a new cake shape
 */
export function useCreateCakeShape(onSuccessCallback?: () => void) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createCakeShape,
    onSuccess: () => {
      toast.success('Cake shape created successfully');
      queryClient.invalidateQueries({ queryKey: ['cakeShapes'] });
      onSuccessCallback?.();
    },
    onError: () => {
      toast.error('Failed to create cake shape');
    },
  });
}

/**
 * Hook to update an existing cake shape
 */
export function useUpdateCakeShape(onSuccessCallback?: () => void) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (formData: {
      id: string;
      name: string;
      description: string;
      isActive: boolean;
      sortOrder?: number;
    }) => {
      const { id, ...data } = formData;
      return updateCakeShape(id, data);
    },
    onSuccess: () => {
      toast.success('Cake shape updated successfully');
      queryClient.invalidateQueries({ queryKey: ['cakeShapes'] });
      onSuccessCallback?.();
    },
    onError: () => {
      toast.error('Failed to update cake shape');
    },
  });
}

/**
 * Hook to delete a cake shape
 */
export function useDeleteCakeShape() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteCakeShapeApi,
    onSuccess: () => {
      toast.success('Cake shape deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['cakeShapes'] });
    },
    onError: () => {
      toast.error('Failed to delete cake shape');
    },
  });
}
