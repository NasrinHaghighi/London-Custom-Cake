import React from 'react';

import ProductTypeFormCo, { ProductTypeForm } from './ProductTypeFormCo';


interface ProductTypeModalProps {
  isOpen: boolean;
  onClose: () => void;
  // Form data - comes from parent (editForm or createForm)
  productTypeForm: ProductTypeForm;
  setProductTypeForm: React.Dispatch<React.SetStateAction<ProductTypeForm>>;
  // Mutation - comes from parent (updateMutation or createMutation)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  mutation: any;
  // Submit handler - comes from parent (handleUpdateSubmit or handleCreateSubmit)
  onSubmit: (e: React.FormEvent) => void;
  // Modal title - "Edit Product Type" or "Create Product Type"
  title: string;
}

// This modal is just a WRAPPER - it doesn't own any data
// All data comes from the parent page and gets passed to the form
const ProductTypeModal = React.memo(function ProductTypeModal({
  isOpen,
  onClose,
  productTypeForm,      // Data from parent
  setProductTypeForm,   // Data from parent
  mutation,             // Data from parent
  onSubmit,             // Data from parent
  title                 // Data from parent
}: ProductTypeModalProps) {
  // Don't render anything if modal is closed
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-purple-500 to-pink-500 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <h2 className="text-2xl font-bold text-white">{title}</h2>
          <button
            onClick={onClose}
            className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition"
          >
           X
          </button>
        </div>

        {/* Form - just passing everything through to the form component */}
        <div className="p-6">
          <ProductTypeFormCo
            productTypeForm={productTypeForm}
            setProductTypeForm={setProductTypeForm}
            mutation={mutation}
            onSubmit={onSubmit}
          />
        </div>
      </div>
    </div>
  );
});

export default ProductTypeModal;
