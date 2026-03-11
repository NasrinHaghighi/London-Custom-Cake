'use client';

import { useState, useCallback, useMemo } from 'react';
import { type ProductType } from '@/lib/api/productTypes';
import { useProductTypes, useCreateProductType, useUpdateProductType, useDeleteProductType } from '@/hooks/useProductTypes';
import { useCakeShapes } from '@/hooks/useCakeShapes';
import ProductTypeForm from './ProductTypeForm';
import ProductTypeCard from './ProductTypeCard';
import ProductTypeEditModal from './ProductTypeEditModal';

// Type definition
export interface ProductTypeForm {
  name: string;
  description: string;
  isActive: boolean;
  pricingMethod: 'perunit' | 'perkg';
  measurement_type: 'weight' | 'quantity';
  base_weight?: number;
  base_quantity?: number;
  bake_time_minutes: number;
  fill_time_minutes: number;
  decoration_time_minutes: number;
  rest_time_minutes: number;
  scale_bake: boolean;
  scale_fill: boolean;
  scale_decoration: boolean;
  scale_rest: boolean;
  unitPrice?: number;
  minQuantity?: number;
  maxQuantity?: number;
  oversizeQuantityExtraMinutesPerUnit?: number;
  pricePerKg?: number;
  minWeight?: number;
  maxWeight?: number;
  oversizeWeightExtraMinutes?: number;
  hasMultipleShapes?: boolean;
  shapeIds?: string[];
}

export default function ProductTypesTab() {
  // Product Type State
  const [productTypeForm, setProductTypeForm] = useState<ProductTypeForm>({
    name: '',
    description: '',
    isActive: true,
    pricingMethod: 'perunit',
    measurement_type: 'quantity',
    base_weight: undefined,
    base_quantity: 1,
    bake_time_minutes: 0,
    fill_time_minutes: 0,
    decoration_time_minutes: 0,
    rest_time_minutes: 0,
    scale_bake: true,
    scale_fill: true,
    scale_decoration: true,
    scale_rest: false,
    unitPrice: undefined,
    minQuantity: 1,
    maxQuantity: undefined,
    oversizeQuantityExtraMinutesPerUnit: 30,
    pricePerKg: undefined,
    minWeight: undefined,
    maxWeight: undefined,
    oversizeWeightExtraMinutes: 60,
    hasMultipleShapes: false,
    shapeIds: [],
  });

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingProductType, setEditingProductType] = useState<ProductType | null>(null);
  const [editForm, setEditForm] = useState<ProductTypeForm>({
    name: '',
    description: '',
    isActive: true,
    pricingMethod: 'perunit',
    measurement_type: 'quantity',
    base_weight: undefined,
    base_quantity: 1,
    bake_time_minutes: 0,
    fill_time_minutes: 0,
    decoration_time_minutes: 0,
    rest_time_minutes: 0,
    scale_bake: true,
    scale_fill: true,
    scale_decoration: true,
    scale_rest: false,
    unitPrice: undefined,
    minQuantity: 1,
    maxQuantity: undefined,
    oversizeQuantityExtraMinutesPerUnit: 30,
    pricePerKg: undefined,
    minWeight: undefined,
    maxWeight: undefined,
    oversizeWeightExtraMinutes: 60,
    hasMultipleShapes: false,
    shapeIds: [],
  });

  // Custom Hooks
  const { data: productTypesData, isLoading: productTypesLoading, error } = useProductTypes();
  const { data: cakeShapesData } = useCakeShapes();

  const normalizePositiveInteger = useCallback((value: number | undefined, fallback = 1) => {
    if (value === undefined || !Number.isFinite(value)) {
      return fallback;
    }

    return Math.max(1, Math.floor(value));
  }, []);

  const normalizePositiveNumber = useCallback((value: number | undefined, fallback = 1) => {
    if (value === undefined || !Number.isFinite(value)) {
      return fallback;
    }

    return value > 0 ? value : fallback;
  }, []);

  const resetForm = useCallback(() => {
    setProductTypeForm({
      name: '',
      description: '',
      isActive: true,
      pricingMethod: 'perunit',
      measurement_type: 'quantity',
      base_weight: undefined,
      base_quantity: 1,
      bake_time_minutes: 0,
      fill_time_minutes: 0,
      decoration_time_minutes: 0,
      rest_time_minutes: 0,
      scale_bake: true,
      scale_fill: true,
      scale_decoration: true,
      scale_rest: false,
      unitPrice: undefined,
      minQuantity: 1,
      maxQuantity: undefined,
      oversizeQuantityExtraMinutesPerUnit: 30,
      pricePerKg: undefined,
      minWeight: undefined,
      maxWeight: undefined,
      oversizeWeightExtraMinutes: 60,
      hasMultipleShapes: false,
      shapeIds: [],
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
    const measurement_type = productTypeForm.pricingMethod === 'perkg' ? 'weight' : 'quantity';
    const syncedBaseQuantity = measurement_type === 'quantity'
      ? normalizePositiveInteger(productTypeForm.minQuantity ?? productTypeForm.base_quantity)
      : undefined;
    const syncedBaseWeight = measurement_type === 'weight'
      ? normalizePositiveNumber(productTypeForm.minWeight ?? productTypeForm.base_weight)
      : undefined;

    createProductTypeMutation.mutate({
      ...productTypeForm,
      measurement_type,
      base_quantity: syncedBaseQuantity,
      minQuantity: syncedBaseQuantity ?? productTypeForm.minQuantity,
      base_weight: syncedBaseWeight,
      minWeight: syncedBaseWeight ?? productTypeForm.minWeight,
    });
  };

  const deleteProductType = useCallback((id: string) => {
    if (confirm('Are you sure you want to delete this product type?')) {
      deleteProductTypeMutation.mutate(id);
    }
  }, [deleteProductTypeMutation]);

  const handleEditProductType = useCallback((productType: ProductType) => {
    const normalizedQuantityBase = normalizePositiveInteger(
      productType.base_quantity ?? productType.minQuantity,
      1
    );
    const normalizedWeightBase = normalizePositiveNumber(
      productType.base_weight ?? productType.minWeight,
      1
    );

    setEditingProductType(productType);
    setEditForm({
      name: productType.name,
      description: productType.description,
      isActive: productType.isActive,
      pricingMethod: productType.pricingMethod,
      measurement_type: productType.pricingMethod === 'perkg' ? 'weight' : 'quantity',
      base_weight: productType.pricingMethod === 'perkg' ? normalizedWeightBase : productType.base_weight,
      base_quantity: productType.pricingMethod === 'perunit' ? normalizedQuantityBase : productType.base_quantity,
      bake_time_minutes: productType.bake_time_minutes || 0,
      fill_time_minutes: productType.fill_time_minutes || 0,
      decoration_time_minutes: productType.decoration_time_minutes || 0,
      rest_time_minutes: productType.rest_time_minutes || 0,
      scale_bake: productType.scale_bake ?? true,
      scale_fill: productType.scale_fill ?? true,
      scale_decoration: productType.scale_decoration ?? true,
      scale_rest: productType.scale_rest ?? false,
      unitPrice: productType.unitPrice,
      minQuantity: productType.pricingMethod === 'perunit'
        ? normalizedQuantityBase
        : productType.minQuantity,
      maxQuantity: productType.maxQuantity,
      oversizeQuantityExtraMinutesPerUnit: productType.oversizeQuantityExtraMinutesPerUnit ?? 30,
      pricePerKg: productType.pricePerKg,
      minWeight: productType.pricingMethod === 'perkg' ? normalizedWeightBase : productType.minWeight,
      maxWeight: productType.maxWeight,
      oversizeWeightExtraMinutes: productType.oversizeWeightExtraMinutes ?? 60,
      hasMultipleShapes: (productType.shapeIds && productType.shapeIds.length > 0) ? true : false,
      shapeIds: productType.shapeIds || [],
    });
    setIsEditModalOpen(true);
  }, [normalizePositiveInteger, normalizePositiveNumber]);

  const handleUpdateSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (editingProductType) {
      const measurement_type = editForm.pricingMethod === 'perkg' ? 'weight' : 'quantity';
      const syncedBaseQuantity = measurement_type === 'quantity'
        ? normalizePositiveInteger(editForm.minQuantity ?? editForm.base_quantity)
        : undefined;
      const syncedBaseWeight = measurement_type === 'weight'
        ? normalizePositiveNumber(editForm.minWeight ?? editForm.base_weight)
        : undefined;

      updateProductTypeMutation.mutate({
        ...editForm,
        measurement_type,
        base_quantity: syncedBaseQuantity,
        minQuantity: syncedBaseQuantity ?? editForm.minQuantity,
        base_weight: syncedBaseWeight,
        minWeight: syncedBaseWeight ?? editForm.minWeight,
        id: editingProductType._id,
      });
    }
  }, [editingProductType, editForm, normalizePositiveInteger, normalizePositiveNumber, updateProductTypeMutation]);

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
        cakeShapes={cakeShapesData || []}
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
                cakeShapes={cakeShapesData || []}
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
        cakeShapes={cakeShapesData || []}
      />
    </div>
  );
}
