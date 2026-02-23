'use client';

import { PaymentForm, OrderItem } from '../types';
import { ProductType } from '@/lib/api/productTypes';
import { CakeShape } from '@/lib/api/cakeShapes';

interface PaymentTabProps {
  payment: PaymentForm;
  setPayment: (payment: PaymentForm) => void;
  items: OrderItem[];
  productTypes: ProductType[];
  cakeShapes: CakeShape[];
}

export default function PaymentTab({ payment, setPayment, items, productTypes, cakeShapes }: PaymentTabProps) {
  const total = items.reduce((sum, item) => {
    const product = productTypes.find(p => p._id === item.productTypeId);
    if (!product) return sum;

    if (product.pricingMethod === 'perunit') {
      return sum + (product.unitPrice || 0) * item.quantity;
    }

    return sum + (product.pricePerKg || 0) * item.quantity;
  }, 0);

  const resolveShapeName = (shapeId: string) => {
    return cakeShapes.find(shape => shape._id === shapeId)?.name || 'N/A';
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-800">Payment & Confirmation</h2>
        <p className="text-gray-600 text-sm mt-1">Review the order and collect payment</p>
      </div>

      <div className="border border-gray-200 rounded-lg p-4 space-y-3">
        <h3 className="font-semibold text-gray-800">Order Summary</h3>
        {items.length === 0 ? (
          <p className="text-sm text-gray-500">No items added.</p>
        ) : (
          <div className="space-y-2">
            {items.map((item, index) => {
              const product = productTypes.find(p => p._id === item.productTypeId);
              return (
                <div key={item.id} className="flex justify-between text-sm text-gray-700">
                  <div>
                    <p className="font-medium">{index + 1}. {product?.name || 'Unknown Product'}</p>
                    <p className="text-xs text-gray-500">
                      {product?.pricingMethod === 'perkg' ? `Weight: ${item.quantity} kg` : `Qty: ${item.quantity}`} •
                      Shape: {item.shapeId ? resolveShapeName(item.shapeId) : 'N/A'}
                    </p>
                  </div>
                  {/* <div className="font-semibold">
                    ₹{product?.pricingMethod === 'perunit'
                      ? ((product.unitPrice || 0) * item.quantity).toFixed(2)
                      : ((product.pricePerKg || 0) * item.quantity).toFixed(2)
                    }
                  </div> */}
                </div>
              );
            })}
          </div>
        )}

        <div className="flex justify-between items-center border-t pt-3 mt-3">
          <span className="text-gray-700 font-semibold">Total</span>
          <span className="text-gray-900 font-bold text-lg">₹{total.toFixed(2)}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Payment Method *</label>
          <select
            value={payment.method}
            onChange={(e) => setPayment({ ...payment, method: e.target.value as PaymentForm['method'] })}
            className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-gray-800 focus:outline-none"
          >
            <option value="cash">Cash</option>
            <option value="card">Card</option>
            <option value="upi">UPI</option>
            <option value="bank-transfer">Bank Transfer</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Amount Paid</label>
          <input
            type="number"
            min="0"
            value={payment.amountPaid}
            onChange={(e) => setPayment({ ...payment, amountPaid: parseFloat(e.target.value) || 0 })}
            className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-gray-800 focus:outline-none"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={payment.markAsPaid}
          onChange={(e) => setPayment({ ...payment, markAsPaid: e.target.checked })}
          className="w-4 h-4"
        />
        <label className="text-sm text-gray-700">Mark order as paid</label>
      </div>
    </div>
  );
}
