'use client';

import { useState } from 'react';
import ProductTypesTab from '../../../components/MenuManagement/ProductTypesTab';
import FlavorsTab from '../../../components/MenuManagement/FlavorsTab';
import CombinationsTab from '../../../components/MenuManagement/CombinationsTab';
import { useQuery } from '@tanstack/react-query';
import { fetchProductTypes } from '@/lib/api/productTypes';
import { fetchFlavorTypes } from '@/lib/api/flavorTypes';

type TabType = 'products' | 'flavors' | 'combinations';

export default function MenuManagementPage() {
  const [activeTab, setActiveTab] = useState<TabType>('products');

  // Fetch counts for tab badges
  const { data: productTypesData } = useQuery({
    queryKey: ['productTypes'],
    queryFn: fetchProductTypes,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const { data: flavorTypesData } = useQuery({
    queryKey: ['flavorTypes'],
    queryFn: fetchFlavorTypes,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const { data: combinationsData } = useQuery({
    queryKey: ['product-flavors'],
    queryFn: async () => {
      const res = await fetch('/api/product-flavor');
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      return data.combinations;
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const productCount = productTypesData?.length || 0;
  const flavorCount = flavorTypesData?.length || 0;
  const comboCount = combinationsData?.length || 0;

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Menu Management</h1>
        <p className="text-gray-600">Manage your product types, flavors, and their combinations</p>
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <nav className="inline-flex gap-3" aria-label="Tabs">
          <button
            onClick={() => setActiveTab('products')}
            className={`
              px-6 py-3 rounded-md font-semibold text-base transition-all duration-200
              ${activeTab === 'products'
                ? 'bg-gradient-to-r from-gray-800 to-gray-900 text-white shadow-admin-lg hover:from-gray-900 hover:to-black'
                : 'bg-white text-gray-700 hover:text-gray-900 hover:shadow-md border border-gray-200'
              }
            `}
          >
            Product Types
            {productCount > 0 && (
              <span className={`ml-2 py-0.5 px-2.5 rounded-full text-xs font-medium ${
                activeTab === 'products'
                  ? 'bg-white/20 text-white'
                  : 'bg-gray-100 text-gray-700'
              }`} suppressHydrationWarning>
                {productCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('flavors')}
            className={`
              px-6 py-3 rounded-md font-semibold text-base transition-all duration-200
              ${activeTab === 'flavors'
                ? 'bg-gradient-to-r from-gray-800 to-gray-900 text-white shadow-admin-lg hover:from-gray-900 hover:to-black'
                : 'bg-white text-gray-700 hover:text-gray-900 hover:shadow-md border border-gray-200'
              }
            `}
          >
            Flavors
            {flavorCount > 0 && (
              <span className={`ml-2 py-0.5 px-2.5 rounded-full text-xs font-medium ${
                activeTab === 'flavors'
                  ? 'bg-white/20 text-white'
                  : 'bg-gray-100 text-gray-700'
              }`} suppressHydrationWarning>
                {flavorCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('combinations')}
            className={`
              px-6 py-3 rounded-md font-semibold text-base transition-all duration-200
              ${activeTab === 'combinations'
                ? 'bg-gradient-to-r from-gray-800 to-gray-900 text-white shadow-admin-lg hover:from-gray-900 hover:to-black'
                : 'bg-white text-gray-700 hover:text-gray-900 hover:shadow-md border border-gray-200'
              }
            `}
          >
            Combinations
            {comboCount > 0 && (
              <span className={`ml-2 py-0.5 px-2.5 rounded-full text-xs font-medium ${
                activeTab === 'combinations'
                  ? 'bg-white/20 text-white'
                  : 'bg-gray-100 text-gray-700'
              }`} suppressHydrationWarning>
                {comboCount}
              </span>
            )}
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'products' && <ProductTypesTab />}
        {activeTab === 'flavors' && <FlavorsTab />}
        {activeTab === 'combinations' && <CombinationsTab />}
      </div>
    </div>
  );
}
