'use client';

import { ProductTypeForm as ProductTypeFormData } from './ProductTypesTab';
import { CakeShape } from '@/lib/api/cakeShapes';
import Checkbox from '../ui/Checkbox';

interface ProductTypeFormProps {
  form: ProductTypeFormData;
  setForm: (form: ProductTypeFormData) => void;
  onSubmit: (e: React.FormEvent) => void;
  isPending: boolean;
  cakeShapes?: CakeShape[];
}

export default function ProductTypeForm({ form, setForm, onSubmit, isPending, cakeShapes = [] }: ProductTypeFormProps) {
  const hasShapes = cakeShapes && cakeShapes.length > 0;
  const isShapeCheckboxDisabled = !hasShapes;

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold mb-4">Add New Product Type</h3>
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Name *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-admin-primary focus:outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Pricing Method *</label>
            <select
              value={form.pricingMethod}
              onChange={(e) => setForm({ ...form, pricingMethod: e.target.value as 'perunit' | 'perkg' })}
              className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-admin-primary focus:outline-none"
            >
              <option value="perunit">Per Unit</option>
              <option value="perkg">Per Kg</option>
            </select>
          </div>
        </div>

        {form.pricingMethod === 'perunit' && (
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Unit Price *</label>
              <input
                type="number"
                step="0.01"
                value={form.unitPrice || ''}
                onChange={(e) => setForm({ ...form, unitPrice: parseFloat(e.target.value) })}
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-admin-primary focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Min Quantity</label>
              <input
                type="number"
                value={form.minQuantity || ''}
                onChange={(e) => setForm({ ...form, minQuantity: parseInt(e.target.value) })}
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-admin-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Max Quantity</label>
              <input
                type="number"
                value={form.maxQuantity || ''}
                onChange={(e) => setForm({ ...form, maxQuantity: parseInt(e.target.value) })}
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-admin-primary focus:outline-none"
              />
            </div>
          </div>
        )}

        {form.pricingMethod === 'perkg' && (
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Price Per Kg *</label>
              <input
                type="number"
                step="0.01"
                value={form.pricePerKg || ''}
                onChange={(e) => setForm({ ...form, pricePerKg: parseFloat(e.target.value) })}
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-admin-primary focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Min Weight (kg)</label>
              <input
                type="number"
                step="0.01"
                value={form.minWeight || ''}
                onChange={(e) => setForm({ ...form, minWeight: parseFloat(e.target.value) })}
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-admin-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Max Weight (kg)</label>
              <input
                type="number"
                step="0.01"
                value={form.maxWeight || ''}
                onChange={(e) => setForm({ ...form, maxWeight: parseFloat(e.target.value) })}
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-admin-primary focus:outline-none"
              />
            </div>
          </div>
        )}

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-admin-primary focus:outline-none"
            rows={2}
          />
        </div>

        <Checkbox
          label="Available in Multiple Cake Shapes"
          checked={form.hasMultipleShapes || false}
          onChange={(checked) => {
            // Only allow checking if shapes exist
            if (checked && !hasShapes) {
              return;
            }
            setForm({ ...form, hasMultipleShapes: checked, shapeIds: checked ? [] : [] });
          }}
          disabled={isShapeCheckboxDisabled}
        />

        {/* Warning message if no shapes exist */}
        {isShapeCheckboxDisabled && (
          <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded">
            <p className="text-sm text-blue-800">
              <span className="font-semibold">📢 No cake shapes available:</span> Please add at least one cake shape first in the Cake Shapes tab before you can assign shapes to products.
            </p>
          </div>
        )}

        {/* Cake Shapes Selection - Only show if checkbox is checked */}
        {form.hasMultipleShapes && cakeShapes && cakeShapes.length > 0 && (
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">Select Available Shapes</label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {cakeShapes.map((shape) => (
                <label key={shape._id} className="flex items-center gap-2 cursor-pointer p-2 hover:bg-gray-50 rounded-lg border border-gray-200">
                  <input
                    type="checkbox"
                    checked={(form.shapeIds || []).includes(shape._id)}
                    onChange={(e) => {
                      const shapeIds = form.shapeIds || [];
                      if (e.target.checked) {
                        setForm({ ...form, shapeIds: [...shapeIds, shape._id] });
                      } else {
                        setForm({ ...form, shapeIds: shapeIds.filter((id) => id !== shape._id) });
                      }
                    }}
                    className="w-4 h-4 rounded"
                  />
                  <span className="text-sm font-medium text-gray-700">{shape.name}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        <Checkbox
          label="Active"
          checked={form.isActive}
          onChange={(checked) => setForm({ ...form, isActive: checked })}
        />

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isPending}
            className="bg-gradient-to-r from-gray-800 to-gray-900 text-white py-2.5 px-6 rounded-md hover:from-gray-900 hover:to-black disabled:opacity-50 transition-all font-medium text-sm shadow-sm hover:shadow-admin"
          >
            {isPending ? '⏳ Creating...' : '➕ Add Product Type'}
          </button>
        </div>
      </form>
    </div>
  );
}
