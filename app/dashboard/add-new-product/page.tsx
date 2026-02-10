'use client';

import { useState, useCallback, useMemo } from 'react';
import { FaPlus } from "react-icons/fa";
import { FaTrashAlt } from "react-icons/fa";
import ProductTypeFormCo, { ProductTypeForm } from '@/components/AddNewProduct/ProductTypeFormCo';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import ProductList from '@/components/AddNewProduct/ProductList';
import ProductTypeModal from '@/components/AddNewProduct/ProductTypeModal';
import {
  fetchProductTypes,
  createProductType,
  updateProductType,
  deleteProductType as deleteProductTypeApi,
  type ProductType
} from '@/lib/api/productTypes';
import {
  fetchFlavorTypes,
  createFlavorType,
  deleteFlavorType as deleteFlavorTypeApi,
  type FlavorType
} from '@/lib/api/flavorTypes';

export default function AddNewProductPage() {
  const queryClient = useQueryClient();

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

  // Flavor Type State
  const [flavorTypeForm, setFlavorTypeForm] = useState({
    name: '',
    description: '',
    isActive: true,
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

  // Fetch Product Types with React Query
  const { data: productTypesData, isLoading: productTypesLoading } = useQuery({
    queryKey: ['productTypes'],
    queryFn: fetchProductTypes,
    staleTime: 5 * 60 * 1000, // 5 minutes - data stays fresh
    gcTime: 10 * 60 * 1000, // 10 minutes - cache time
    retry: 3, // Retry failed requests 3 times
  });

  // Fetch Flavor Types with React Query
  const { data: flavorTypesData, isLoading: flavorTypesLoading } = useQuery({
    queryKey: ['flavorTypes'],
    queryFn: fetchFlavorTypes,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 3,
  });

  // Create Product Type Mutation
  const createProductTypeMutation = useMutation({
    mutationFn: createProductType,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productTypes'] });
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
    },
  });

  // Delete Product Type Mutation
  const deleteProductTypeMutation = useMutation({
    mutationFn: deleteProductTypeApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productTypes'] });
    },
  });

  // Update Product Type Mutation
  const updateProductTypeMutation = useMutation({
    mutationFn: async (formData: ProductTypeForm & { id: string }) => {
      const { id, ...updateData } = formData;
      return updateProductType(id, updateData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productTypes'] });
      setIsEditModalOpen(false);
      setEditingProductType(null);
    },
  });

  // Create Flavor Type Mutation
  const createFlavorTypeMutation = useMutation({
    mutationFn: createFlavorType,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flavorTypes'] });
      setFlavorTypeForm({ name: '', description: '', isActive: true });
    },
  });

  // Delete Flavor Type Mutation
  const deleteFlavorTypeMutation = useMutation({
    mutationFn: deleteFlavorTypeApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flavorTypes'] });
    },
  });

  // Handlers
  const handleProductTypeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createProductTypeMutation.mutate(productTypeForm);
  };

  const handleFlavorTypeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createFlavorTypeMutation.mutate(flavorTypeForm);
  };

  const deleteProductType = useCallback((id: string) => {
    if (confirm('Are you sure you want to delete this product type?')) {
      deleteProductTypeMutation.mutate(id);
    }
  }, [deleteProductTypeMutation]);

  const deleteFlavorType = useCallback((id: string) => {
    if (confirm('Are you sure you want to delete this flavor type?')) {
      deleteFlavorTypeMutation.mutate(id);
    }
  }, [deleteFlavorTypeMutation]);

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

  // Memoize sorted arrays to prevent creating new references on every render
  const productTypes = useMemo(
    () => (productTypesData || []).sort((a, b) => a.name.localeCompare(b.name)),
    [productTypesData]
  );

  const flavorTypes = useMemo(
    () => (flavorTypesData || []).sort((a, b) => a.name.localeCompare(b.name)),
    [flavorTypesData]
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-800 mb-8 text-center">
          Manage Product Types & Flavors
        </h1>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Product Types Section */}
          <div className="bg-white rounded-2xl shadow-xl p-6 border border-purple-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
                <FaPlus className="text-white" size={24} />
              </div>
              <h2 className="text-2xl font-bold text-gray-800">Product Types</h2>
            </div>

            {/* Product Type Form */}
            <ProductTypeFormCo
              productTypeForm={productTypeForm}
              setProductTypeForm={setProductTypeForm}
              mutation={createProductTypeMutation}
              onSubmit={handleProductTypeSubmit}
            />

            {/* Product Types List */}
            <ProductList
              productTypes={productTypes}
              loading={productTypesLoading}
              deleteProductType={deleteProductType}
              isDeleting={deleteProductTypeMutation.isPending}
              onEdit={handleEditProductType}
            />

          </div>

          {/* Edit Modal */}
          <ProductTypeModal
            isOpen={isEditModalOpen}
            onClose={handleCloseEditModal}
            productTypeForm={editForm}
            setProductTypeForm={setEditForm}
            mutation={updateProductTypeMutation}
            onSubmit={handleUpdateSubmit}
            title="Edit Product Type"
          />

          {/* Flavor Types Section */}
          <div className="bg-white rounded-2xl shadow-xl p-6 border border-blue-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                <FaPlus className="text-white" size={24} />
              </div>
              <h2 className="text-2xl font-bold text-gray-800">Flavor Types</h2>
            </div>

            {/* Flavor Type Form */}
            <form onSubmit={handleFlavorTypeSubmit} className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Name *
                </label>
                <input
                  type="text"
                  required
                  value={flavorTypeForm.name}
                  onChange={(e) => setFlavorTypeForm({ ...flavorTypeForm, name: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none transition"
                  placeholder="e.g., Chocolate"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={flavorTypeForm.description}
                  onChange={(e) => setFlavorTypeForm({ ...flavorTypeForm, description: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none transition"
                  rows={3}
                  placeholder="Brief description..."
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={flavorTypeForm.isActive}
                  onChange={(e) => setFlavorTypeForm({ ...flavorTypeForm, isActive: e.target.checked })}
                  className="w-5 h-5 text-blue-500 rounded focus:ring-2 focus:ring-blue-500"
                />
                <label className="text-sm font-semibold text-gray-700">Active</label>
              </div>

              <button
                type="submit"
                disabled={createFlavorTypeMutation.isPending}
                className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold py-3 rounded-lg hover:from-blue-600 hover:to-cyan-600 disabled:opacity-50 transition-all shadow-md hover:shadow-lg"
              >
                {createFlavorTypeMutation.isPending ? 'Adding...' : 'Add Flavor Type'}
              </button>
              {createFlavorTypeMutation.isError && (
                <p className="text-red-500 text-sm">Error: {createFlavorTypeMutation.error.message}</p>
              )}
            </form>

            {/* Flavor Types List */}
            <div className="space-y-3 max-h-96 overflow-y-auto">
              <h3 className="font-semibold text-gray-700 mb-3 sticky top-0 bg-white py-2">
                Existing Flavor Types ({flavorTypes.length})
              </h3>
              {flavorTypesLoading ? (
                <p className="text-center text-gray-400 py-8">Loading...</p>
              ) : flavorTypes.length === 0 ? (
                <p className="text-center text-gray-400 py-8">No flavor types added yet</p>
              ) : (
                flavorTypes.map((flavor) => (
                  <div
                    key={flavor._id}
                    className="bg-blue-50 border-2 border-blue-100 rounded-lg p-4 hover:border-blue-300 transition-all"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-gray-800">{flavor.name}</h4>
                          <span className={`px-2 py-1 text-xs rounded-full ${flavor.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                            {flavor.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                        {flavor.description && (
                          <p className="text-sm text-gray-600 mt-1">{flavor.description}</p>
                        )}
                      </div>
                      <button
                        onClick={() => deleteFlavorType(flavor._id)}
                        disabled={deleteFlavorTypeMutation.isPending}
                        className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded-lg transition disabled:opacity-50"
                      >
                        <FaTrashAlt
                         size={18} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
