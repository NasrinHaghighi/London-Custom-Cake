'use client';

import { useState, useCallback, useMemo } from 'react';
import { type FlavorType } from '@/lib/api/flavorTypes';
import { useFlavorTypes, useCreateFlavorType, useUpdateFlavorType, useDeleteFlavorType } from '@/hooks/useFlavorTypes';
import FlavorTypeForm, { FlavorTypeFormData } from './FlavorTypeForm';
import FlavorTypeCard from './FlavorTypeCard';
import FlavorTypeEditModal from './FlavorTypeEditModal';

export default function FlavorsTab() {
  // Flavor Type State
  const [flavorTypeForm, setFlavorTypeForm] = useState<FlavorTypeFormData>({
    name: '',
    description: '',
    isActive: true,
    hasExtraPrice: false,
    extraPricePerUnit: undefined,
    extraPricePerKg: undefined,
  });

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingFlavor, setEditingFlavor] = useState<FlavorType | null>(null);
  const [editForm, setEditForm] = useState<FlavorTypeFormData>({
    name: '',
    description: '',
    isActive: true,
    hasExtraPrice: false,
    extraPricePerUnit: undefined,
    extraPricePerKg: undefined,
  });

  // Custom Hooks
  const { data: flavorTypesData, isLoading: flavorTypesLoading } = useFlavorTypes();

  const resetForm = useCallback(() => {
    setFlavorTypeForm({
      name: '',
      description: '',
      isActive: true,
      hasExtraPrice: false,
      extraPricePerUnit: undefined,
      extraPricePerKg: undefined,
    });
  }, []);

  const closeModal = useCallback(() => {
    setIsEditModalOpen(false);
    setEditingFlavor(null);
  }, []);

  const createFlavorTypeMutation = useCreateFlavorType(resetForm);
  const deleteFlavorTypeMutation = useDeleteFlavorType();
  const updateFlavorTypeMutation = useUpdateFlavorType(closeModal);

  // Handlers
  const handleFlavorTypeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createFlavorTypeMutation.mutate(flavorTypeForm);
  };

  const deleteFlavorType = useCallback((id: string) => {
    if (confirm('Are you sure you want to delete this flavor type?')) {
      deleteFlavorTypeMutation.mutate(id);
    }
  }, [deleteFlavorTypeMutation]);

  const handleEditFlavor = useCallback((flavor: FlavorType) => {
    setEditingFlavor(flavor);
    setEditForm({
      name: flavor.name,
      description: flavor.description || '',
      isActive: flavor.isActive,
      hasExtraPrice: flavor.hasExtraPrice || false,
      extraPricePerUnit: flavor.extraPricePerUnit,
      extraPricePerKg: flavor.extraPricePerKg,
    });
    setIsEditModalOpen(true);
  }, []);

  const handleUpdateSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (editingFlavor) {
      updateFlavorTypeMutation.mutate({ ...editForm, id: editingFlavor._id });
    }
  }, [editingFlavor, editForm, updateFlavorTypeMutation]);

  const handleCloseEditModal = useCallback(() => {
    setIsEditModalOpen(false);
  }, []);

  // Memoize sorted arrays
  const flavorTypes = useMemo(
    () => {
      if (!flavorTypesData || !Array.isArray(flavorTypesData)) return [];
      return [...flavorTypesData].sort((a, b) => a.name.localeCompare(b.name));
    },
    [flavorTypesData]
  );

  return (
    <div className="space-y-6">
      {/* Add Flavor Type Form */}
      <FlavorTypeForm
        form={flavorTypeForm}
        setForm={setFlavorTypeForm}
        onSubmit={handleFlavorTypeSubmit}
        isPending={createFlavorTypeMutation.isPending}
        isError={createFlavorTypeMutation.isError}
        error={createFlavorTypeMutation.error}
      />

      {/* Flavor Types List */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <h3 className="text-lg font-semibold p-6 border-b">Flavor Types</h3>
        {flavorTypesLoading ? (
          <div className="p-8 text-center text-gray-500">Loading...</div>
        ) : flavorTypes.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No flavor types yet</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
            {flavorTypes.map((flavor) => (
              <FlavorTypeCard
                key={flavor._id}
                flavor={flavor}
                onEdit={handleEditFlavor}
                onDelete={deleteFlavorType}
                isDeleting={deleteFlavorTypeMutation.isPending}
              />
            ))}
          </div>
        )}
      </div>

      {/* Edit Modal */}
      <FlavorTypeEditModal
        isOpen={isEditModalOpen}
        onClose={handleCloseEditModal}
        form={editForm}
        setForm={setEditForm}
        onSubmit={handleUpdateSubmit}
        isPending={updateFlavorTypeMutation.isPending}
        isError={updateFlavorTypeMutation.isError}
        error={updateFlavorTypeMutation.error}
      />
    </div>
  );
}
