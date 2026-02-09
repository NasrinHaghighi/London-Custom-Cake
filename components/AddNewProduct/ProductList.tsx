import React from 'react'
import { FaTrashAlt, FaEdit } from "react-icons/fa";
import { UseMutationResult } from '@tanstack/react-query';

interface ProductType {
  _id: string;
  name: string;
  description: string;
  isActive: boolean;
  sortOrder: number;
  pricingMethod: 'perunit' | 'perkg';
  unitPrice?: number;
  minQuantity?: number;
  maxQuantity?: number;
  pricePerKg?: number;
  minWeight?: number;
  maxWeight?: number;
}

interface ProductListProps {
  productTypes: ProductType[];
  loading: boolean;
  deleteProductType: (id: string) => void;
  deleteMutation: UseMutationResult<unknown, Error, string, unknown>;
  onEdit: (productType: ProductType) => void;
}

function ProductList({ productTypes, loading: productTypesLoading, deleteProductType, deleteMutation, onEdit }: ProductListProps) {
  return (
    <div className="space-y-3 max-h-96 overflow-y-auto">
                 <h3 className="font-semibold text-gray-700 mb-3 sticky top-0 bg-white py-2">
                   Existing Product Types ({productTypes.length})
                 </h3>
                 {productTypesLoading ? (
                   <p className="text-center text-gray-400 py-8">Loading...</p>
                 ) : productTypes.length === 0 ? (
                   <p className="text-center text-gray-400 py-8">No product types added yet</p>
                 ) : (
                   productTypes.map((type) => (
                     <div
                       key={type._id}
                       className="bg-purple-50 border-2 border-purple-100 rounded-lg p-4 hover:border-purple-300 transition-all"
                     >
                       <div className="flex items-start justify-between">
                         <div className="flex-1">
                           <div className="flex items-center gap-2">
                             <h4 className="font-semibold text-gray-800">{type.name}</h4>
                             <span className={`px-2 py-1 text-xs rounded-full ${type.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                               {type.isActive ? 'Active' : 'Inactive'}
                             </span>
                           </div>
                           {type.description && (
                             <p className="text-sm text-gray-600 mt-1">{type.description}</p>
                           )}

                           {/* Pricing Details */}
                           <div className="mt-2 space-y-1">
                             {type.pricingMethod === 'perunit' ? (
                               <div className="text-sm">
                                 <span className="font-semibold text-purple-700">£{type.unitPrice?.toFixed(2) || '0.00'}</span>
                                 <span className="text-gray-500"> per unit</span>
                                 {(type.minQuantity || type.maxQuantity) && (
                                   <div className="text-xs text-gray-500 mt-1">
                                     Quantity: {type.minQuantity || 0} - {type.maxQuantity || '∞'}
                                   </div>
                                 )}
                               </div>
                             ) : type.pricingMethod === 'perkg' ? (
                               <div className="text-sm">
                                 <span className="font-semibold text-purple-700">£{type.pricePerKg?.toFixed(2) || '0.00'}</span>
                                 <span className="text-gray-500"> per kg</span>
                                 {(type.minWeight || type.maxWeight) && (
                                   <div className="text-xs text-gray-500 mt-1">
                                     Weight: {type.minWeight || 0}kg - {type.maxWeight || '∞'}kg
                                   </div>
                                 )}
                               </div>
                             ) : (
                               <div className="text-xs text-gray-400 italic">
                                 No pricing configured
                               </div>
                             )}
                           </div>
                         </div>
                         <div className="flex gap-2">
                           <button
                             onClick={() => onEdit(type)}
                             className="text-blue-500 hover:text-blue-700 p-2 hover:bg-blue-50 rounded-lg transition"
                           >
                             <FaEdit size={18} />
                           </button>
                           <button
                             onClick={() => deleteProductType(type._id)}
                             disabled={deleteMutation.isPending}
                             className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded-lg transition disabled:opacity-50"
                           >
                             <FaTrashAlt size={18} />
                           </button>
                         </div>
                       </div>
                     </div>
                   ))
                 )}
               </div>
  )
}

export default ProductList