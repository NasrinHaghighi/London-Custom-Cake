'use client';

import { useState, useCallback, useMemo } from 'react';
import { type CakeShape } from '@/lib/api/cakeShapes';
import { useCakeShapes, useCreateCakeShape, useUpdateCakeShape, useDeleteCakeShape } from '@/hooks/useCakeShapes';
import CakeShapeForm from './CakeShapeForm';
import CakeShapeCard from './CakeShapeCard';
import CakeShapeEditModal from './CakeShapeEditModal';

export interface CakeShapeForm {
  name: string;
  description: string;
  isActive: boolean;
  sortOrder?: number;
}

export default function CakeShapesTab() {
  // Form State
  const [cakeShapeForm, setCakeShapeForm] = useState<CakeShapeForm>({
    name: '',
    description: '',
    isActive: true,
    sortOrder: 0,
  });

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingCakeShape, setEditingCakeShape] = useState<CakeShape | null>(null);
  const [editForm, setEditForm] = useState<CakeShapeForm>({
    name: '',
    description: '',
    isActive: true,
    sortOrder: 0,
  });

  // Custom Hooks
  const { data: cakeShapesData, isLoading: cakeShapesLoading, error } = useCakeShapes();

  const resetForm = useCallback(() => {
    setCakeShapeForm({
      name: '',
      description: '',
      isActive: true,
      sortOrder: 0,
    });
  }, []);

  const closeModal = useCallback(() => {
    setIsEditModalOpen(false);
    setEditingCakeShape(null);
  }, []);

  const createCakeShapeMutation = useCreateCakeShape(resetForm);
  const deleteCakeShapeMutation = useDeleteCakeShape();
  const updateCakeShapeMutation = useUpdateCakeShape(closeModal);

  // Handlers
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createCakeShapeMutation.mutate(cakeShapeForm);
  };

  const deleteCakeShape = useCallback((id: string) => {
    if (confirm('Are you sure you want to delete this cake shape?')) {
      deleteCakeShapeMutation.mutate(id);
    }
  }, [deleteCakeShapeMutation]);

  const handleEditCakeShape = useCallback((cakeShape: CakeShape) => {
    setEditingCakeShape(cakeShape);
    setEditForm({
      name: cakeShape.name,
      description: cakeShape.description,
      isActive: cakeShape.isActive,
      sortOrder: cakeShape.sortOrder,
    });
    setIsEditModalOpen(true);
  }, []);

  const handleUpdateSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (editingCakeShape) {
      updateCakeShapeMutation.mutate({ ...editForm, id: editingCakeShape._id });
    }
  }, [editingCakeShape, editForm, updateCakeShapeMutation]);

  const handleCloseEditModal = useCallback(() => {
    setIsEditModalOpen(false);
  }, []);

  // Memoize sorted arrays
  const cakeShapes = useMemo(
    () => {
      if (!cakeShapesData || !Array.isArray(cakeShapesData)) return [];
      return [...cakeShapesData].sort((a, b) => a.name.localeCompare(b.name));
    },
    [cakeShapesData]
  );

  return (
    <div className="space-y-6">
      {/* Add Cake Shape Form */}
      <CakeShapeForm
        form={cakeShapeForm}
        setForm={setCakeShapeForm}
        onSubmit={handleSubmit}
        isPending={createCakeShapeMutation.isPending}
      />

      {/* Cake Shapes List */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <h3 className="text-lg font-semibold p-6 border-b">Cake Shapes</h3>
        {cakeShapesLoading ? (
          <div className="p-8 text-center text-gray-500">Loading...</div>
        ) : cakeShapes.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No cake shapes yet</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
            {cakeShapes.map((shape) => (
              <CakeShapeCard
                key={shape._id}
                cakeShape={shape}
                onEdit={handleEditCakeShape}
                onDelete={deleteCakeShape}
                isDeleting={deleteCakeShapeMutation.isPending}
              />
            ))}
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editingCakeShape && (
        <CakeShapeEditModal
          isOpen={isEditModalOpen}
          onClose={handleCloseEditModal}
          cakeShape={editingCakeShape}
          form={editForm}
          setForm={setEditForm}
          onSubmit={handleUpdateSubmit}
          isPending={updateCakeShapeMutation.isPending}
        />
      )}
    </div>
  );
}
