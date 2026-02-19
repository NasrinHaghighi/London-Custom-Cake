'use client';

import { useState } from 'react';
import { useProductTypes } from '@/hooks/useProductTypes';
import { useCakeShapes } from '@/hooks/useCakeShapes';

interface OrderItem {
  id: string;
  productTypeId: string;
  quantity: number;
  shapeId: string;
  specialInstructions: string;
}

export default function OrdersPage() {
  const { data: productTypes, isLoading: productsLoading } = useProductTypes();
  const { data: cakeShapes, isLoading: shapesLoading } = useCakeShapes();

  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    email: '',
    phone: '',
    deliveryDate: '',
  });

  const addOrderItem = () => {
    setOrderItems([
      ...orderItems,
      {
        id: Date.now().toString(),
        productTypeId: '',
        quantity: 1,
        shapeId: '',
        specialInstructions: '',
      },
    ]);
  };

  const removeOrderItem = (id: string) => {
    setOrderItems(orderItems.filter(item => item.id !== id));
  };

  const updateOrderItem = (id: string, updates: Partial<OrderItem>) => {
    setOrderItems(
      orderItems.map(item =>
        item.id === id ? { ...item, ...updates } : item
      )
    );
  };

  const getProductShapes = (productTypeId: string) => {
    const product = productTypes?.find(p => p._id === productTypeId);
    if (!product || !product.shapeIds || product.shapeIds.length === 0) {
      return [];
    }
    return cakeShapes?.filter(shape => product.shapeIds?.includes(shape._id)) || [];
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement order submission
    console.log('Order data:', { customerInfo, orderItems });
  };

  const isLoading = productsLoading || shapesLoading;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-800">Create New Order</h1>
        <p className="text-gray-600 mt-2">Fill in customer information and select products</p>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center text-blue-700">
          Loading products and shapes...
        </div>
      )}

      {!isLoading && (
        <form onSubmit={handleSubmitOrder} className="space-y-6">
          {/* Customer Information Section */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">Customer Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name *</label>
                <input
                  type="text"
                  value={customerInfo.name}
                  onChange={(e) => setCustomerInfo({ ...customerInfo, name: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-gray-800 focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Email *</label>
                <input
                  type="email"
                  value={customerInfo.email}
                  onChange={(e) => setCustomerInfo({ ...customerInfo, email: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-gray-800 focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Phone *</label>
                <input
                  type="tel"
                  value={customerInfo.phone}
                  onChange={(e) => setCustomerInfo({ ...customerInfo, phone: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-gray-800 focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Delivery Date *</label>
                <input
                  type="date"
                  value={customerInfo.deliveryDate}
                  onChange={(e) => setCustomerInfo({ ...customerInfo, deliveryDate: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-gray-800 focus:outline-none"
                  required
                />
              </div>
            </div>
          </div>

          {/* Order Items Section */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">Order Items</h2>

            {orderItems.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No items added yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {orderItems.map((item, index) => {
                  const selectedProduct = productTypes?.find(p => p._id === item.productTypeId);
                  const availableShapes = getProductShapes(item.productTypeId);

                  return (
                    <div key={item.id} className="border border-gray-200 rounded-lg p-4 space-y-3">
                      <div className="flex justify-between items-center mb-3">
                        <h3 className="font-semibold text-gray-700">Item {index + 1}</h3>
                        <button
                          type="button"
                          onClick={() => removeOrderItem(item.id)}
                          className="text-red-500 hover:text-red-700 text-sm font-medium"
                        >
                          Remove
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Product Type Selection */}
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Product Type *</label>
                          <select
                            value={item.productTypeId}
                            onChange={(e) => updateOrderItem(item.id, { productTypeId: e.target.value, shapeId: '' })}
                            className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-gray-800 focus:outline-none"
                            required
                          >
                            <option value="">Select a product...</option>
                            {productTypes?.map((product) => (
                              <option key={product._id} value={product._id}>
                                {product.name} - {product.pricingMethod === 'perunit' ? `₹${product.unitPrice}/unit` : `₹${product.pricePerKg}/kg`}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Quantity */}
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Quantity/Weight *</label>
                          <input
                            type="number"
                            step={selectedProduct?.pricingMethod === 'perkg' ? '0.1' : '1'}
                            min="1"
                            value={item.quantity}
                            onChange={(e) => updateOrderItem(item.id, { quantity: parseFloat(e.target.value) })}
                            className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-gray-800 focus:outline-none"
                            required
                          />
                        </div>

                        {/* Shape Selection - Only if product has shapes */}
                        {availableShapes.length > 0 && (
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Cake Shape</label>
                            <select
                              value={item.shapeId}
                              onChange={(e) => updateOrderItem(item.id, { shapeId: e.target.value })}
                              className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-gray-800 focus:outline-none"
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

                      {/* Special Instructions */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Special Instructions</label>
                        <textarea
                          value={item.specialInstructions}
                          onChange={(e) => updateOrderItem(item.id, { specialInstructions: e.target.value })}
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

            {/* Add Item Button */}
            <button
              type="button"
              onClick={addOrderItem}
              className="mt-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white py-2 px-4 rounded-md hover:from-blue-600 hover:to-blue-700 transition-all font-medium text-sm"
            >
              ➕ Add Item
            </button>
          </div>

          {/* Submit Button */}
          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={() => {
                setCustomerInfo({ name: '', email: '', phone: '', deliveryDate: '' });
                setOrderItems([]);
              }}
              className="bg-gray-200 text-gray-800 py-2 px-6 rounded-md hover:bg-gray-300 transition-colors font-medium"
            >
              Clear
            </button>
            <button
              type="submit"
              disabled={orderItems.length === 0}
              className="bg-gradient-to-r from-gray-800 to-gray-900 text-white py-2 px-6 rounded-md hover:from-gray-900 hover:to-black disabled:opacity-50 transition-all font-medium shadow-sm hover:shadow-admin"
            >
              📦 Submit Order
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
