'use client';

import Checkbox from '../ui/Checkbox';
import { FlavorTypeFormData } from './FlavorTypeForm';

interface FlavorTypeEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  form: FlavorTypeFormData;
  setForm: (form: FlavorTypeFormData) => void;
  onSubmit: (e: React.FormEvent) => void;
  isPending: boolean;
  isError: boolean;
  error: Error | null;
}

export default function FlavorTypeEditModal({
  isOpen,
  onClose,
  form,
  setForm,
  onSubmit,
  isPending,
  isError,
  error,
}: FlavorTypeEditModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h3 className="text-xl font-bold mb-4">Edit Flavor Type</h3>

          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Name *
              </label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-admin-primary focus:outline-none transition"
                placeholder="e.g., Chocolate"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-admin-primary focus:outline-none transition"
                rows={3}
                placeholder="Brief description..."
              />
            </div>

            <Checkbox
              label="Active"
              checked={form.isActive}
              onChange={(checked) => setForm({ ...form, isActive: checked })}
            />

            <div className="border-t pt-4">
              <Checkbox
                label="Has Extra Price"
                checked={form.hasExtraPrice}
                onChange={(checked) => setForm({
                  ...form,
                  hasExtraPrice: checked,
                  extraPricePerUnit: checked ? form.extraPricePerUnit : undefined,
                  extraPricePerKg: checked ? form.extraPricePerKg : undefined,
                })}
                className="mb-4"
              />

              {form.hasExtraPrice && (
                <div className="ml-7 space-y-3 bg-gray-50 p-4 rounded-lg">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Extra Price Per Unit (£)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={form.extraPricePerUnit || ''}
                      onChange={(e) => setForm({
                        ...form,
                        extraPricePerUnit: e.target.value ? parseFloat(e.target.value) : undefined
                      })}
                      className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-admin-primary focus:outline-none transition"
                      placeholder="e.g., 2.50"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Extra Price Per Kg (£)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={form.extraPricePerKg || ''}
                      onChange={(e) => setForm({
                        ...form,
                        extraPricePerKg: e.target.value ? parseFloat(e.target.value) : undefined
                      })}
                      className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-admin-primary focus:outline-none transition"
                      placeholder="e.g., 5.00"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-4">
              <button
                type="submit"
                disabled={isPending}
                className="flex-1 bg-gradient-to-r from-gray-800 to-gray-900 text-white font-semibold py-3 rounded-lg hover:from-gray-900 hover:to-black disabled:opacity-50 transition-all"
              >
                {isPending ? 'Updating...' : 'Update Flavor'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 bg-gray-200 text-gray-700 font-semibold py-3 rounded-lg hover:bg-gray-300 transition-all"
              >
                Cancel
              </button>
            </div>

            {isError && error && (
              <p className="text-red-500 text-sm">Error: {error.message}</p>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
