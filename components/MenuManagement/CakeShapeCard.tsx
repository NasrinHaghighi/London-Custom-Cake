'use client';

import { FaEdit, FaTrashAlt } from 'react-icons/fa';
import { CakeShape } from '@/lib/api/cakeShapes';

interface CakeShapeCardProps {
  cakeShape: CakeShape;
  onEdit: (cakeShape: CakeShape) => void;
  onDelete: (id: string) => void;
  isDeleting: boolean;
}

export default function CakeShapeCard({ cakeShape, onEdit, onDelete, isDeleting }: CakeShapeCardProps) {
  return (
    <div className="border-2 border-gray-200 rounded-lg p-4 hover:border-gray-400 transition-all">
      <div className="flex justify-between items-start mb-2">
        <h4 className="font-semibold text-gray-800">{cakeShape.name}</h4>
        <div className="flex gap-2">
          <button
            onClick={() => onEdit(cakeShape)}
            className="text-blue-600 hover:text-blue-800 transition-colors"
            title="Edit cake shape"
          >
            <FaEdit />
          </button>
          <button
            onClick={() => onDelete(cakeShape._id)}
            disabled={isDeleting}
            className="text-red-600 hover:text-red-800 disabled:opacity-50 transition-colors"
            title="Delete cake shape"
          >
            <FaTrashAlt />
          </button>
        </div>
      </div>

      {cakeShape.description && (
        <p className="text-sm text-gray-600 mb-3">{cakeShape.description}</p>
      )}

      <div className="mt-3">
        <span
          className={`text-xs px-2 py-1 rounded-full ${
            cakeShape.isActive
              ? 'bg-green-100 text-green-800'
              : 'bg-red-100 text-red-800'
          }`}
        >
          {cakeShape.isActive ? 'Active' : 'Inactive'}
        </span>
      </div>
    </div>
  );
}
