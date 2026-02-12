'use client';

import { FaEdit, FaTrashAlt } from 'react-icons/fa';
import { ProductType } from '@/lib/api/productTypes';

interface ProductTypeCardProps {
  productType: ProductType;
  onEdit: (productType: ProductType) => void;
  onDelete: (id: string) => void;
  isDeleting: boolean;
}

export default function ProductTypeCard({ productType, onEdit, onDelete, isDeleting }: ProductTypeCardProps) {
  return (
    <div className="border-2 border-gray-200 rounded-lg p-4 hover:border-gray-400 transition-all">
      <div className="flex justify-between items-start mb-2">
        <h4 className="font-semibold text-gray-800">{productType.name}</h4>
        <div className="flex gap-2">
          <button
            onClick={() => onEdit(productType)}
            className="text-blue-600 hover:text-blue-800 transition-colors"
            title="Edit product type"
          >
            <FaEdit />
          </button>
          <button
            onClick={() => onDelete(productType._id)}
            disabled={isDeleting}
            className="text-red-600 hover:text-red-800 disabled:opacity-50 transition-colors"
            title="Delete product type"
          >
            <FaTrashAlt />
          </button>
        </div>
      </div>

      {productType.description && (
        <p className="text-sm text-gray-600 mb-2">{productType.description}</p>
      )}

      <div className="text-sm space-y-1">
        {productType.pricingMethod === 'perunit' && (
          <>
            <p className="text-purple-600 font-semibold">
              £{productType.unitPrice?.toFixed(2)} per unit
            </p>
            {productType.minQuantity && (
              <p className="text-gray-500">Min: {productType.minQuantity} units</p>
            )}
            {productType.maxQuantity && (
              <p className="text-gray-500">Max: {productType.maxQuantity} units</p>
            )}
          </>
        )}

        {productType.pricingMethod === 'perkg' && (
          <>
            <p className="text-purple-600 font-semibold">
              £{productType.pricePerKg?.toFixed(2)} per kg
            </p>
            {productType.minWeight && (
              <p className="text-gray-500">Min: {productType.minWeight}kg</p>
            )}
            {productType.maxWeight && (
              <p className="text-gray-500">Max: {productType.maxWeight}kg</p>
            )}
          </>
        )}
      </div>

      <div className="mt-2">
        <span
          className={`text-xs px-2 py-1 rounded-full ${
            productType.isActive
              ? 'bg-green-100 text-green-800'
              : 'bg-red-100 text-red-800'
          }`}
        >
          {productType.isActive ? 'Active' : 'Inactive'}
        </span>
      </div>
    </div>
  );
}
