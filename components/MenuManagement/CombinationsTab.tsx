'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { fetchProductTypes } from '@/lib/api/productTypes';
import { fetchFlavorTypes } from '@/lib/api/flavorTypes';
import Checkbox from '../ui/Checkbox';

// TypeScript interfaces
interface ProductType {
  _id: string;
  name: string;
  pricingMethod?: string;
  unitPrice?: number;
  pricePerKg?: number;
  isActive?: boolean;
}

interface FlavorType {
  _id: string;
  name: string;
  description?: string;
  hasExtraPrice?: boolean;
  extraPricePerUnit?: number;
  extraPricePerKg?: number;
  isActive?: boolean;
}

type RefIdValue = string | { _id?: string | { toString: () => string } } | { toString: () => string };

interface ProductFlavorCombination {
  _id: string;
  productTypeId: RefIdValue;
  flavorId: RefIdValue;
  isAvailable: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface CombinationsResponse {
  success: boolean;
  combinations: ProductFlavorCombination[];
}

interface ProductTypesResponse {
  success: boolean;
  types: ProductType[];
}

interface FlavorsResponse {
  success: boolean;
  flavors: FlavorType[];
}

const extractRefId = (value: RefIdValue | null | undefined): string => {
  if (!value) {
    return '';
  }

  if (typeof value === 'string') {
    return value;
  }

  if ('_id' in value && value._id) {
    return typeof value._id === 'string' ? value._id : value._id.toString();
  }

  return value.toString();
};

// Fetch functions
const fetchCombinations = async (): Promise<CombinationsResponse> => {
  const res = await fetch('/api/product-flavor');
  if (!res.ok) throw new Error('Failed to fetch combinations');
  return res.json();
};

const deleteCombination = async (id: string) => {
  const res = await fetch(`/api/product-flavor/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete combination');
  return res.json();
};

export default function CombinationsTab() {
  const queryClient = useQueryClient();
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [selectedFlavor, setSelectedFlavor] = useState('');
  const [isAvailable, setIsAvailable] = useState(true);
  const [notes, setNotes] = useState('');
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Queries
  const { data: combinationsData, isLoading: isLoadingCombinations } = useQuery({
    queryKey: ['product-flavors'],
    queryFn: fetchCombinations,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const { data: productTypesData } = useQuery({
    queryKey: ['productTypes'],
    queryFn: fetchProductTypes,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const { data: flavorTypesData } = useQuery({
    queryKey: ['flavorTypes'],
    queryFn: fetchFlavorTypes,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: async (data: { productTypeId: string; flavorId: string; isAvailable: boolean; notes: string }) => {
      const response = await fetch('/api/product-flavor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const errorData = await response.json();
        if (errorData.errors && Array.isArray(errorData.errors)) {
          setValidationErrors(errorData.errors);
          throw new Error('Validation failed');
        }
        throw new Error(errorData.message || 'Failed to create combination');
      }
      return response.json();
    },
    onSuccess: () => {
      setValidationErrors([]);
      toast.success('Combination created successfully');
      queryClient.invalidateQueries({ queryKey: ['product-flavors'] });
      setShowAddModal(false);
      resetForm();
    },
    onError: (error) => {
      if (error.message !== 'Validation failed') {
        setValidationErrors([]);
        toast.error(error.message);
      }
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteCombination,
    onSuccess: () => {
      toast.success('Combination deleted');
      queryClient.invalidateQueries({ queryKey: ['product-flavors'] });
    },
    onError: () => {
      toast.error('Failed to delete combination');
    },
  });

  const resetForm = () => {
    setSelectedProduct('');
    setSelectedFlavor('');
    setIsAvailable(true);
    setNotes('');
    setValidationErrors([]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      productTypeId: selectedProduct,
      flavorId: selectedFlavor,
      isAvailable,
      notes,
    });
  };

  // Handle both response formats - direct array or object with combinations property
  const combinations: ProductFlavorCombination[] = Array.isArray(combinationsData)
    ? combinationsData
    : (combinationsData?.combinations || []);
  const productTypes: ProductType[] = productTypesData || [];
  const flavorTypes: FlavorType[] = flavorTypesData || [];

  // Helper function to check if a combination exists
  const getCombination = (productId: string, flavorId: string) => {
    return combinations.find(
      (c) => extractRefId(c.productTypeId) === productId && extractRefId(c.flavorId) === flavorId
    );
  };

  // Toggle combination
  const toggleCombination = async (productId: string, flavorId: string, isChecked: boolean) => {
    const existing = getCombination(productId, flavorId);

    if (isChecked && !existing) {
      // Create new combination
      try {
        await createMutation.mutateAsync({
          productTypeId: productId,
          flavorId: flavorId,
          isAvailable: true,
          notes: '',
        });
      } catch (error) {
        // Error already handled by mutation
      }
    } else if (!isChecked && existing) {
      // Delete existing combination
      deleteMutation.mutate(existing._id);
    }
  };

  // Calculate final price for a product-flavor combo
  const calculateFinalPrice = (product: ProductType, flavor: FlavorType): string => {
    const basePrice = product.pricingMethod === 'perunit' ? product.unitPrice : product.pricePerKg;
    let extraPrice = 0;

    if (flavor.hasExtraPrice && product.pricingMethod) {
      if (product.pricingMethod === 'perunit' && flavor.extraPricePerUnit !== undefined) {
        extraPrice = flavor.extraPricePerUnit;
      } else if (product.pricingMethod === 'perkg' && flavor.extraPricePerKg !== undefined) {
        extraPrice = flavor.extraPricePerKg;
      }
    }

    const total = (basePrice || 0) + extraPrice;
    const unit = product.pricingMethod === 'perunit' ? '/unit' : '/kg';
    return `£${total.toFixed(2)}${unit}`;
  };

  return (
    <div>
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">Product-Flavor Matrix</h3>
        <p className="text-gray-600">Check boxes to make flavors available for products. Final prices calculated automatically.</p>
      </div>

      {/* Matrix Grid */}
      <div className="bg-white rounded-lg shadow-md overflow-x-auto">
        {isLoadingCombinations || !productTypes.length || !flavorTypes.length ? (
          <div className="p-8 text-center text-gray-500">
            {isLoadingCombinations ? 'Loading...' : 'Please add products and flavors first'}
          </div>
        ) : (
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-3 text-left font-semibold text-gray-700 border-b-2 border-r-2 border-gray-300 sticky left-0 bg-gray-50 z-10">
                  Product Type
                </th>
                {flavorTypes.map((flavor) => (
                  <th key={flavor._id} className="px-4 py-3 text-center border-b-2 border-gray-300 min-w-35">
                    <div className={`font-semibold ${
                      flavor.isActive === false ? 'text-gray-400 line-through' : 'text-gray-700'
                    }`}>
                      {flavor.name}
                      {flavor.isActive === false && <span className="text-xs ml-1">(Inactive)</span>}
                    </div>
                    <div className="text-xs text-purple-600 font-normal mt-1">
                      {flavor.hasExtraPrice ? (
                        <>
                          {flavor.extraPricePerUnit !== undefined && `+£${flavor.extraPricePerUnit}/unit`}
                          {flavor.extraPricePerUnit !== undefined && flavor.extraPricePerKg !== undefined && ' | '}
                          {flavor.extraPricePerKg !== undefined && `+£${flavor.extraPricePerKg}/kg`}
                        </>
                      ) : (
                        'Free'
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {productTypes.map((product) => {
                const basePrice = product.pricingMethod === 'perunit' ? product.unitPrice : product.pricePerKg;
                const priceUnit = product.pricingMethod === 'perunit' ? '/unit' : '/kg';

                return (
                  <tr key={product._id} className="hover:bg-gray-50">
                    <td className="px-4 py-4 font-medium border-r-2 border-gray-200 sticky left-0 bg-white z-10">
                      <div className={product.isActive === false ? 'text-gray-400 line-through' : 'text-gray-900'}>
                        {product.name}
                        {product.isActive === false && <span className="text-xs ml-1">(Inactive)</span>}
                      </div>
                      <div className="text-sm text-gray-500 font-normal">
                        Base: £{basePrice?.toFixed(2) || '0.00'}{priceUnit}
                      </div>
                    </td>
                    {flavorTypes.map((flavor) => {
                      const combo = getCombination(product._id, flavor._id);
                      const isChecked = !!combo;
                      const isDisabled = product.isActive === false || flavor.isActive === false;

                      return (
                        <td key={flavor._id} className={`px-4 py-4 text-center border-l border-gray-200 ${
                          isDisabled ? 'bg-gray-50' : ''
                        }`}>
                          <div className="flex flex-col items-center gap-2">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => toggleCombination(product._id, flavor._id, e.target.checked)}
                              disabled={isDisabled || createMutation.isPending || deleteMutation.isPending}
                              title={isDisabled ? 'Cannot select - Product or Flavor is inactive' : ''}
                              className="w-5 h-5 accent-gray-800 rounded focus:ring-2 focus:ring-gray-800 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                            />
                            {isChecked && (
                              <div className={`text-sm font-semibold text-green-600 ${
                                isDisabled ? 'opacity-30' : ''
                              }`}>
                                {calculateFinalPrice(product, flavor)}
                              </div>
                            )}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Legend */}
      <div className="mt-4 p-4 bg-blue-50 rounded-lg">
        <h4 className="font-semibold text-blue-900 mb-2">How it works:</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>✅ <strong>Check box</strong> = Flavor available for this product</li>
          <li>💰 <strong>Green price below</strong> = Final calculated price (base + flavor extra)</li>
          <li>📝 Extra prices shown in column headers apply based on product s pricing method</li>
        </ul>
      </div>

      {/* Keep modal for backwards compatibility but hide the button */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold mb-4">Add Product-Flavor Combination</h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Product Type *</label>
                <select
                  value={selectedProduct}
                  onChange={(e) => setSelectedProduct(e.target.value)}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none"
                  required
                >
                  <option value="">Select Product...</option>
                  {productTypes.map((product) => (
                    <option
                      key={product._id}
                      value={product._id}
                      disabled={product.isActive === false}
                    >
                      {product.name} {product.isActive === false ? '(Inactive)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Flavor *</label>
                <select
                  value={selectedFlavor}
                  onChange={(e) => setSelectedFlavor(e.target.value)}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none"
                  required
                >
                  <option value="">Select Flavor...</option>
                  {flavorTypes.map((flavor) => (
                    <option
                      key={flavor._id}
                      value={flavor._id}
                      disabled={flavor.isActive === false}
                    >
                      {flavor.name}
                      {flavor.isActive === false && ' (Inactive)'}
                      {flavor.hasExtraPrice && (
                        flavor.extraPricePerUnit !== undefined || flavor.extraPricePerKg !== undefined
                          ? ` (+£${flavor.extraPricePerUnit || 0}/unit, +£${flavor.extraPricePerKg || 0}/kg)`
                          : ' (has extra price)'
                      )}
                    </option>
                  ))}
                </select>
              </div>

              <Checkbox
                label="Available"
                checked={isAvailable}
                onChange={setIsAvailable}
              />

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Notes (optional)</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none"
                  rows={2}
                  placeholder="Additional notes..."
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="flex-1 bg-linear-to-r from-purple-500 to-pink-500 text-white py-2 rounded-lg hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 transition-all font-semibold"
                >
                  {createMutation.isPending ? 'Creating...' : 'Create Combination'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    resetForm();
                  }}
                  className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 transition-all font-semibold"
                >
                  Cancel
                </button>
              </div>

              {validationErrors.length > 0 && (
                <div className="mt-2 space-y-1">
                  {validationErrors.map((error, index) => (
                    <p key={index} className="text-red-500 text-sm">{error}</p>
                  ))}
                </div>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
