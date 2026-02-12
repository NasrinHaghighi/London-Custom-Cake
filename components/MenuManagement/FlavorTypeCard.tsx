'use client';

import { FaEdit, FaTrashAlt } from 'react-icons/fa';
import { FlavorType } from '@/lib/api/flavorTypes';

interface FlavorTypeCardProps {
  flavor: FlavorType;
  onEdit: (flavor: FlavorType) => void;
  onDelete: (id: string) => void;
  isDeleting: boolean;
}

export default function FlavorTypeCard({ flavor, onEdit, onDelete, isDeleting }: FlavorTypeCardProps) {
  return (
    <div className="bg-gray-50 border-2 border-gray-200 rounded-lg p-4 hover:border-gray-400 transition-all">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="font-semibold text-gray-800">{flavor.name}</h4>
            <span
              className={`px-2 py-1 text-xs rounded-full ${
                flavor.isActive
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              {flavor.isActive ? 'Active' : 'Inactive'}
            </span>
            {flavor.hasExtraPrice ? (
              <span className="px-2 py-1 text-xs rounded-full bg-purple-100 text-purple-700 font-semibold">
                💰 Extra Cost
              </span>
            ) : (
              <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-600">
                Free
              </span>
            )}
          </div>

          {flavor.description && (
            <p className="text-sm text-gray-600 mt-1">{flavor.description}</p>
          )}

          {flavor.hasExtraPrice && (
            <div className="mt-2 space-y-1 text-sm bg-purple-50 p-2 rounded">
              {flavor.extraPricePerUnit !== undefined && flavor.extraPricePerUnit > 0 && (
                <div className="text-purple-700">
                  <span className="font-semibold">+£{flavor.extraPricePerUnit.toFixed(2)}</span> per unit
                </div>
              )}
              {flavor.extraPricePerKg !== undefined && flavor.extraPricePerKg > 0 && (
                <div className="text-purple-700">
                  <span className="font-semibold">+£{flavor.extraPricePerKg.toFixed(2)}</span> per kg
                </div>
              )}
              {(!flavor.extraPricePerUnit && !flavor.extraPricePerKg) && (
                <div className="text-gray-500 text-xs italic">
                  Extra price enabled but no amounts set
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => onEdit(flavor)}
            className="text-blue-600 hover:text-blue-800 p-2 hover:bg-blue-50 rounded-lg transition"
            title="Edit flavor"
          >
            <FaEdit size={18} />
          </button>
          <button
            onClick={() => onDelete(flavor._id)}
            disabled={isDeleting}
            className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded-lg transition disabled:opacity-50"
            title="Delete flavor"
          >
            <FaTrashAlt size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
