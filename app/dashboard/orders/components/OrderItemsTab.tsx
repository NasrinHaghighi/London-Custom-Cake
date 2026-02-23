'use client';

import { useMemo } from 'react';
import { OrderItem } from '../types';
import { ProductType } from '@/lib/api/productTypes';
import { CakeShape } from '@/lib/api/cakeShapes';

interface OrderItemsTabProps {
  items: OrderItem[];
  setItems: (items: OrderItem[]) => void;
  productTypes: ProductType[];
  cakeShapes: CakeShape[];
  customerId: string;
  deliveryAddressId: string;
}

export default function OrderItemsTab({ items, setItems, productTypes, cakeShapes, customerId, deliveryAddressId }: OrderItemsTabProps) {
  const addItem = () => {
    setItems([
      ...items,
      {
        id: Date.now().toString(),
        productTypeId: '',
        quantity: 1,
        shapeId: '',
        specialInstructions: '',
      },
    ]);
  };

  const removeItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  const updateItem = (id: string, updates: Partial<OrderItem>) => {
    setItems(items.map(item => (item.id === id ? { ...item, ...updates } : item)));
  };

  const getProductShapes = (productTypeId: string) => {
    const product = productTypes.find(p => p._id === productTypeId);
    if (!product || !product.shapeIds || product.shapeIds.length === 0) {
      return [];
    }
    return cakeShapes.filter(shape => product.shapeIds?.includes(shape._id));
  };

  const subtotal = useMemo(() => {
    return items.reduce((sum, item) => {
      const product = productTypes.find(p => p._id === item.productTypeId);
      if (!product) return sum;

      if (product.pricingMethod === 'perunit') {
        return sum + (product.unitPrice || 0) * item.quantity;
      }

      return sum + (product.pricePerKg || 0) * item.quantity;
    }, 0);
  }, [items, productTypes]);

  return (
    <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">Order Information</h2>
          <p className="text-gray-600 text-sm mt-1">Add products, quantities, and shapes</p>
        </div>
        <div className="text-sm font-semibold text-gray-700">
          Subtotal: ₹{subtotal.toFixed(2)}
        </div>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-8 text-gray-500">No items added yet</div>
      ) : (
        <div className="space-y-4">
          {items.map((item, index) => {
            const product = productTypes.find(p => p._id === item.productTypeId);
            const availableShapes = getProductShapes(item.productTypeId);

            return (
              <div key={item.id} className="border border-gray-200 rounded-lg p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <h3 className="font-semibold text-gray-700">Item {index + 1}</h3>
                  <button
                    type="button"
                    onClick={() => removeItem(item.id)}
                    className="text-red-500 hover:text-red-700 text-sm font-medium"
                  >
                    Remove
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Product Type *</label>
                    <select
                      value={item.productTypeId}
                      onChange={(e) => updateItem(item.id, { productTypeId: e.target.value, shapeId: '' })}
                      className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-gray-800 focus:outline-none"
                      required
                    >
                      <option value="">Select a product...</option>
                      {productTypes.map((productType) => (
                        <option key={productType._id} value={productType._id}>
                          {productType.name} - {productType.pricingMethod === 'perunit'
                            ? `₹${productType.unitPrice}/unit`
                            : `₹${productType.pricePerKg}/kg`}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      {product?.pricingMethod === 'perkg' ? 'Weight (kg) *' : 'Quantity *'}
                    </label>
                    <input
                      type="number"
                      step={product?.pricingMethod === 'perkg' ? '0.1' : '1'}
                      min="1"
                      value={item.quantity}
                      onChange={(e) => updateItem(item.id, { quantity: parseFloat(e.target.value) })}
                      className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-gray-800 focus:outline-none"
                      required
                    />
                  </div>

                  {availableShapes.length > 0 && (
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Cake Shape *</label>
                      <select
                        value={item.shapeId}
                        onChange={(e) => updateItem(item.id, { shapeId: e.target.value })}
                        className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-gray-800 focus:outline-none"
                        required
                      >
                        <option value="">Select a shape...</option>
                        {availableShapes.map((shape) => (
                          <option key={shape._id} value={shape._id}>
                            {shape.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Special Instructions</label>
                  <textarea
                    value={item.specialInstructions}
                    onChange={(e) => updateItem(item.id, { specialInstructions: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-gray-800 focus:outline-none"
                    rows={2}
                    placeholder="E.g., No nuts, specific design, etc."
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      <button
        type="button"
        onClick={addItem}
        className="bg-gradient-to-r from-blue-500 to-blue-600 text-white py-2 px-4 rounded-md hover:from-blue-600 hover:to-blue-700 transition-all font-medium text-sm"
      >
        ➕ Add Item
      </button>
    </div>
  );
}
