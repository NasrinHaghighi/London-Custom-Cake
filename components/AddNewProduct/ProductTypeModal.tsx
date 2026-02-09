import React from 'react';

import ProductTypeFormCo, { ProductTypeForm } from './ProductTypeFormCo';
import { UseMutationResult } from '@tanstack/react-query';

interface ProductTypeModalProps {
  isOpen: boolean;
  onClose: () => void;
  productTypeForm: ProductTypeForm;
  setProductTypeForm: React.Dispatch<React.SetStateAction<ProductTypeForm>>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  mutation: any;
  onSubmit: (e: React.FormEvent) => void;
  title: string;
}

export default function ProductTypeModal({
  isOpen,
  onClose,
  productTypeForm,
  setProductTypeForm,
  mutation,
  onSubmit,
  title
}: ProductTypeModalProps) {
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

        {/* Form */}
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
}
