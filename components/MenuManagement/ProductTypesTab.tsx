'use client';

import { useState, useCallback, useMemo } from 'react';
import { type ProductType } from '@/lib/api/productTypes';
import { useProductTypes, useCreateProductType, useUpdateProductType, useDeleteProductType } from '@/hooks/useProductTypes';
import ProductTypeForm from './ProductTypeForm';
import ProductTypeCard from './ProductTypeCard';
import ProductTypeEditModal from './ProductTypeEditModal';

// Type definition
export interface ProductTypeForm {
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
}

export default function ProductTypesTab() {
  // Product Type State
  const [productTypeForm, setProductTypeForm] = useState<ProductTypeForm>({
    name: '',
    description: '',
    isActive: true,
    pricingMethod: 'perunit',
    unitPrice: undefined,
    minQuantity: undefined,
    maxQuantity: undefined,
    pricePerKg: undefined,
    minWeight: undefined,
    maxWeight: undefined,
  });

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingProductType, setEditingProductType] = useState<ProductType | null>(null);
  const [editForm, setEditForm] = useState<ProductTypeForm>({
    name: '',
    description: '',
    isActive: true,
    pricingMethod: 'perunit',
    unitPrice: undefined,
    minQuantity: undefined,
    maxQuantity: undefined,
    pricePerKg: undefined,
    minWeight: undefined,
    maxWeight: undefined,
  });

  // Custom Hooks
  const { data: productTypesData, isLoading: productTypesLoading, error } = useProductTypes();

  const resetForm = useCallback(() => {
    setProductTypeForm({
      name: '',
      description: '',
      isActive: true,
      pricingMethod: 'perunit',
      unitPrice: undefined,
      minQuantity: undefined,
      maxQuantity: undefined,
      pricePerKg: undefined,
      minWeight: undefined,
      maxWeight: undefined,
    });
  }, []);

  const closeModal = useCallback(() => {
    setIsEditModalOpen(false);
    setEditingProductType(null);
  }, []);

  const createProductTypeMutation = useCreateProductType(resetForm);
  const deleteProductTypeMutation = useDeleteProductType();
  const updateProductTypeMutation = useUpdateProductType(closeModal);

  // Handlers
  const handleProductTypeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createProductTypeMutation.mutate(productTypeForm);
  };

  const deleteProductType = useCallback((id: string) => {
    if (confirm('Are you sure you want to delete this product type?')) {
      deleteProductTypeMutation.mutate(id);
    }
  }, [deleteProductTypeMutation]);

  const handleEditProductType = useCallback((productType: ProductType) => {
    setEditingProductType(productType);
    setEditForm({
      name: productType.name,
      description: productType.description,
      isActive: productType.isActive,
      pricingMethod: productType.pricingMethod,
      unitPrice: productType.unitPrice,
      minQuantity: productType.minQuantity,
      maxQuantity: productType.maxQuantity,
      pricePerKg: productType.pricePerKg,
      minWeight: productType.minWeight,
      maxWeight: productType.maxWeight,
    });
    setIsEditModalOpen(true);
  }, []);

  const handleUpdateSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (editingProductType) {
      updateProductTypeMutation.mutate({ ...editForm, id: editingProductType._id });
    }
  }, [editingProductType, editForm, updateProductTypeMutation]);

  const handleCloseEditModal = useCallback(() => {
    setIsEditModalOpen(false);
  }, []);

  // Memoize sorted arrays
  const productTypes = useMemo(
    () => {
      if (!productTypesData || !Array.isArray(productTypesData)) return [];
      return [...productTypesData].sort((a, b) => a.name.localeCompare(b.name));
    },
    [productTypesData]
  );

  return (
    <div className="space-y-6">
      {/* Add Product Type Form */}
      <ProductTypeForm
        form={productTypeForm}
        setForm={setProductTypeForm}
        onSubmit={handleProductTypeSubmit}
        isPending={createProductTypeMutation.isPending}
      />

      {/* Product Types List */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <h3 className="text-lg font-semibold p-6 border-b">Product Types</h3>
        {productTypesLoading ? (
          <div className="p-8 text-center text-gray-500">Loading...</div>
        ) : productTypes.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No product types yet</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
            {productTypes.map((type) => (
              <ProductTypeCard
                key={type._id}
                productType={type}
                onEdit={handleEditProductType}
                onDelete={deleteProductType}
                isDeleting={deleteProductTypeMutation.isPending}
              />
            ))}
          </div>
        )}
      </div>

      {/* Edit Modal */}
      <ProductTypeEditModal
        isOpen={isEditModalOpen}
        onClose={handleCloseEditModal}
        form={editForm}
        setForm={setEditForm}
        onSubmit={handleUpdateSubmit}
        isPending={updateProductTypeMutation.isPending}
      />
    </div>
  );
}
