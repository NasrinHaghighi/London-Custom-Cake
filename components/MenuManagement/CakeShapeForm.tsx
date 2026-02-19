'use client';



interface CakeShapeFormType {
  name: string;
  description: string;
  isActive: boolean;
  sortOrder?: number;
}

interface CakeShapeFormProps {
  form: CakeShapeFormType;
  setForm: (form: CakeShapeFormType) => void;
  onSubmit: (e: React.FormEvent) => void;
  isPending: boolean;
}

export default function CakeShapeForm({ form, setForm, onSubmit, isPending }: CakeShapeFormProps) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold mb-4">Add New Cake Shape</h3>
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Shape Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g., Round, Square, Heart"
              className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-admin-primary focus:outline-none"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Description
            </label>
            <input
              type="text"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="e.g., Classic round cake shape"
              className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-admin-primary focus:outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Sort Order */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Sort Order
            </label>
            <input
              type="number"
              value={form.sortOrder || 0}
              onChange={(e) => setForm({ ...form, sortOrder: parseInt(e.target.value) })}
              className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-admin-primary focus:outline-none"
            />
          </div>

          {/* Active Status */}
          <div className="flex items-end">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                className="w-4 h-4 rounded"
              />
              <span className="text-sm font-semibold text-gray-700">Active</span>
            </label>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isPending}
            className="bg-gradient-to-r from-gray-800 to-gray-900 text-white py-2.5 px-6 rounded-md hover:from-gray-900 hover:to-black disabled:opacity-50 transition-all font-medium text-sm shadow-sm hover:shadow-admin"
          >
            {isPending ? '⏳ Adding...' : '➕ Add Cake Shape'}
          </button>
        </div>
      </form>
    </div>
  );
}
