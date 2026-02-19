'use client';

import { CakeShape } from '@/lib/api/cakeShapes';

interface CakeShapeFormType {
  name: string;
  description: string;
  isActive: boolean;
  sortOrder?: number;
}

interface CakeShapeEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  cakeShape: CakeShape;
  form: CakeShapeFormType;
  setForm: (form: CakeShapeFormType) => void;
  onSubmit: (e: React.FormEvent) => void;
  isPending: boolean;
}

export default function CakeShapeEditModal({
  isOpen,
  onClose,
  cakeShape,
  form,
  setForm,
  onSubmit,
  isPending,
}: CakeShapeEditModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-end z-50">
      <div className="bg-white rounded-lg shadow-lg w-96 h-screen overflow-y-auto p-6 space-y-4 animate-in slide-in-from-right duration-300">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">Edit Cake Shape</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
          >
            ✕
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Shape Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <input
              type="text"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Sort Order */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Sort Order
            </label>
            <input
              type="number"
              value={form.sortOrder || 0}
              onChange={(e) => setForm({ ...form, sortOrder: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Active Status */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isActive"
              checked={form.isActive}
              onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
              className="w-4 h-4 rounded"
            />
            <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
              Active
            </label>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4 sticky bottom-0 bg-white">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-gray-800 to-gray-900 text-white rounded-md hover:from-gray-900 hover:to-black disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium shadow-sm hover:shadow-admin"
            >
              {isPending ? '⏳ Saving...' : '💾 Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
