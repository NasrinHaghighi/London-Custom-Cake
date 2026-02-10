import React from 'react'


export interface ProductTypeForm {
  name: string;
  description: string;
  isActive: boolean;
  pricingMethod: 'perunit' | 'perkg';
  unitPrice?: number;
  minQuantity?: number;
  maxQuantity?: number;
  pricePerKg?: number;
  minWeight?: number;
  maxWeight?: number;
}

interface ProductTypeFormProps {
  productTypeForm: ProductTypeForm;
  setProductTypeForm: React.Dispatch<React.SetStateAction<ProductTypeForm>>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  mutation: any;
  onSubmit: (e: React.FormEvent) => void;
}

function ProductTypeFormCo({ productTypeForm, setProductTypeForm, mutation, onSubmit }: ProductTypeFormProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-4 mb-6">
                 <div>
                   <label className="block text-sm font-semibold text-gray-700 mb-2">
                     Name *
                   </label>
                   <input
                     type="text"
                     required
                     value={productTypeForm.name}
                     onChange={(e) => setProductTypeForm({ ...productTypeForm, name: e.target.value })}
                     className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none transition"
                     placeholder="e.g., Wedding Cake"
                   />
                 </div>

                 <div>
                   <label className="block text-sm font-semibold text-gray-700 mb-2">
                     Description
                   </label>
                   <textarea
                     value={productTypeForm.description}
                     onChange={(e) => setProductTypeForm({ ...productTypeForm, description: e.target.value })}
                     className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none transition"
                     rows={3}
                     placeholder="Brief description..."
                   />
                 </div>

                 {/* Pricing Method */}
                 <div>
                   <label className="block text-sm font-semibold text-gray-700 mb-2">
                     Pricing Method *
                   </label>
                   <div className="flex gap-4">
                     <label className="flex items-center gap-2 cursor-pointer">
                       <input
                         type="radio"
                         value="perunit"
                         checked={productTypeForm.pricingMethod === 'perunit'}
                         onChange={(e) => setProductTypeForm({ ...productTypeForm, pricingMethod: 'perunit' })}
                         className="w-4 h-4 text-purple-500"
                       />
                       <span className="text-sm font-medium text-gray-700">Price per Unit</span>
                     </label>
                     <label className="flex items-center gap-2 cursor-pointer">
                       <input
                         type="radio"
                         value="perkg"
                         checked={productTypeForm.pricingMethod === 'perkg'}
                         onChange={(e) => setProductTypeForm({ ...productTypeForm, pricingMethod: 'perkg' })}
                         className="w-4 h-4 text-purple-500"
                       />
                       <span className="text-sm font-medium text-gray-700">Price per Kilogram</span>
                     </label>
                   </div>
                 </div>

                 {/* Per Unit Pricing Fields */}
                 {productTypeForm.pricingMethod === 'perunit' && (
                   <div className="bg-purple-50 p-4 rounded-lg space-y-3">
                     <div>
                       <label className="block text-sm font-semibold text-gray-700 mb-2">
                         Unit Price *
                       </label>
                       <input
                         type="number"
                         step="0.01"
                         required
                         value={productTypeForm.unitPrice || ''}
                         onChange={(e) => setProductTypeForm({ ...productTypeForm, unitPrice: parseFloat(e.target.value) })}
                         className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none transition"
                         placeholder="e.g., 50.00"
                       />
                     </div>
                     <div className="grid grid-cols-2 gap-3">
                       <div>
                         <label className="block text-sm font-semibold text-gray-700 mb-2">
                           Min Quantity
                         </label>
                         <input
                           type="number"
                           value={productTypeForm.minQuantity || ''}
                           onChange={(e) => setProductTypeForm({ ...productTypeForm, minQuantity: parseInt(e.target.value) })}
                           className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none transition"
                           placeholder="e.g., 1"
                         />
                       </div>
                       <div>
                         <label className="block text-sm font-semibold text-gray-700 mb-2">
                           Max Quantity
                         </label>
                         <input
                           type="number"
                           value={productTypeForm.maxQuantity || ''}
                           onChange={(e) => setProductTypeForm({ ...productTypeForm, maxQuantity: parseInt(e.target.value) })}
                           className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none transition"
                           placeholder="e.g., 10"
                         />
                       </div>
                     </div>
                   </div>
                 )}

                 {/* Per Kilogram Pricing Fields */}
                 {productTypeForm.pricingMethod === 'perkg' && (
                   <div className="bg-purple-50 p-4 rounded-lg space-y-3">
                     <div>
                       <label className="block text-sm font-semibold text-gray-700 mb-2">
                         Price per Kilogram *
                       </label>
                       <input
                         type="number"
                         step="0.01"
                         required
                         value={productTypeForm.pricePerKg || ''}
                         onChange={(e) => setProductTypeForm({ ...productTypeForm, pricePerKg: parseFloat(e.target.value) })}
                         className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none transition"
                         placeholder="e.g., 25.00"
                       />
                     </div>
                     <div className="grid grid-cols-2 gap-3">
                       <div>
                         <label className="block text-sm font-semibold text-gray-700 mb-2">
                           Min Weight (kg)
                         </label>
                         <input
                           type="number"
                           step="0.1"
                           value={productTypeForm.minWeight || ''}
                           onChange={(e) => setProductTypeForm({ ...productTypeForm, minWeight: parseFloat(e.target.value) })}
                           className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none transition"
                           placeholder="e.g., 0.5"
                         />
                       </div>
                       <div>
                         <label className="block text-sm font-semibold text-gray-700 mb-2">
                           Max Weight (kg)
                         </label>
                         <input
                           type="number"
                           step="0.1"
                           value={productTypeForm.maxWeight || ''}
                           onChange={(e) => setProductTypeForm({ ...productTypeForm, maxWeight: parseFloat(e.target.value) })}
                           className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none transition"
                           placeholder="e.g., 5.0"
                         />
                       </div>
                     </div>
                   </div>
                 )}

                 <div className="flex items-center gap-2">
                   <input
                     type="checkbox"
                     checked={productTypeForm.isActive}
                     onChange={(e) => setProductTypeForm({ ...productTypeForm, isActive: e.target.checked })}
                     className="w-5 h-5 text-purple-500 rounded focus:ring-2 focus:ring-purple-500"
                   />
                   <label className="text-sm font-semibold text-gray-700">Active</label>
                 </div>

                 <button
                   type="submit"
                   disabled={mutation.isPending}
                   className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold py-3 rounded-lg hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 transition-all shadow-md hover:shadow-lg"
                 >
                   {mutation.isPending ? 'Adding...' : 'Add Product Type'}
                 </button>
                 {mutation.isError && (
                   <p className="text-red-500 text-sm">Error: {mutation.error.message}</p>
                 )}
               </form>
  )
}

export default ProductTypeFormCo