'use client';

import { FaEdit, FaTrashAlt } from 'react-icons/fa';
import { ProductType } from '@/lib/api/productTypes';
import { CakeShape } from '@/lib/api/cakeShapes';

interface ProductTypeCardProps {
  productType: ProductType;
  onEdit: (productType: ProductType) => void;
  onDelete: (id: string) => void;
  isDeleting: boolean;
  cakeShapes?: CakeShape[];
}

export default function ProductTypeCard({ productType, onEdit, onDelete, isDeleting, cakeShapes = [] }: ProductTypeCardProps) {
  // Get shape names from IDs
  const selectedShapes = (productType.shapeIds || [])
    .map((id) => cakeShapes.find((shape) => shape._id === id))
    .filter(Boolean) as CakeShape[];

  const hasTimingData = productType.measurement_type !== undefined
    || productType.bake_time_minutes !== undefined
    || productType.fill_time_minutes !== undefined
    || productType.decoration_time_minutes !== undefined
    || productType.rest_time_minutes !== undefined;

  const formatDuration = (totalMinutes: number) => {
    const rounded = Math.max(0, Math.round(totalMinutes));
    const hours = Math.floor(rounded / 60);
    const minutes = rounded % 60;

    if (hours === 0) {
      return `${minutes}m`;
    }

    if (minutes === 0) {
      return `${hours}h`;
    }

    return `${hours}h ${minutes}m`;
  };

  const bakeMinutes = productType.bake_time_minutes ?? 0;
  const fillMinutes = productType.fill_time_minutes ?? 0;
  const decorationMinutes = productType.decoration_time_minutes ?? 0;
  const restMinutes = productType.rest_time_minutes ?? 0;
  const baseTotalMinutes = bakeMinutes + fillMinutes + decorationMinutes + restMinutes;

  const measurementType = productType.measurement_type || 'quantity';
  const baseLabel = measurementType === 'weight'
    ? `${productType.base_weight ?? productType.minWeight ?? '-'}kg`
    : `${productType.base_quantity ?? productType.minQuantity ?? '-'} unit`;

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
            <p className="text-gray-500">
              Oversize: +{productType.oversizeQuantityExtraMinutesPerUnit ?? 30}m per extra unit above 2x base qty
            </p>
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
            <p className="text-gray-500">
              Oversize: +{productType.oversizeWeightExtraMinutes ?? 60}m above 2x base weight
            </p>
          </>
        )}
      </div>

      {hasTimingData && (
        <div className="mt-3 pt-3 border-t border-gray-200 space-y-1">
          <p className="text-xs font-semibold text-gray-700">Production Timing</p>
          <p className="text-xs text-gray-600">
            Basis: <span className="font-medium capitalize">{measurementType}</span> ({baseLabel})
          </p>
          <p className="text-xs text-gray-600">
            Bake: {bakeMinutes}m {productType.scale_bake === false ? '(constant)' : '(scaled)'}
          </p>
          <p className="text-xs text-gray-600">
            Fill: {fillMinutes}m {productType.scale_fill === false ? '(constant)' : '(scaled)'}
          </p>
          <p className="text-xs text-gray-600">
            Decoration: {decorationMinutes}m {productType.scale_decoration === false ? '(constant)' : '(scaled)'}
          </p>
          <p className="text-xs text-gray-600">
            Rest: {restMinutes}m {productType.scale_rest === true ? '(scaled)' : '(constant)'}
          </p>
          <p className="text-xs font-semibold text-gray-800">
            Base Total: {formatDuration(baseTotalMinutes)}
          </p>
        </div>
      )}

      {/* Display Cake Shapes */}
      {selectedShapes.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <p className="text-xs font-semibold text-gray-700 mb-2">Available Shapes:</p>
          <div className="flex flex-wrap gap-2">
            {selectedShapes.map((shape) => (
              <span
                key={shape._id}
                className="inline-block bg-blue-100 text-blue-800 text-xs px-2.5 py-1 rounded-full font-medium"
              >
                🎂 {shape.name}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="mt-3">
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
