'use client';

interface TabConfig {
  id: 'customer' | 'order' | 'payment';
  label: string;
}

const tabs: TabConfig[] = [
  { id: 'customer', label: 'Customer & Delivery' },
  { id: 'order', label: 'Order Information' },
  { id: 'payment', label: 'Payment & Confirmation' },
];

interface OrderTabsNavProps {
  activeTab: 'customer' | 'order' | 'payment';
  onTabChange: (tab: 'customer' | 'order' | 'payment') => void;
  canAccessTab: (tab: 'customer' | 'order' | 'payment') => boolean;
}

export default function OrderTabsNav({ activeTab, onTabChange, canAccessTab }: OrderTabsNavProps) {
  return (
    <div className="bg-white rounded-lg shadow-md p-2">
      <div className="flex flex-col md:flex-row gap-2">
        {tabs.map((tab, index) => {
          const isActive = activeTab === tab.id;
          const isDisabled = !canAccessTab(tab.id);

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => !isDisabled && onTabChange(tab.id)}
              disabled={isDisabled}
              className={`flex-1 flex items-center justify-between px-4 py-3 rounded-md text-sm font-semibold transition-all ${
                isActive
                  ? 'bg-gradient-to-r from-gray-800 to-gray-900 text-white'
                  : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
              } ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <span>
                {index + 1}. {tab.label}
              </span>
              {isActive && <span className="text-xs bg-white/20 px-2 py-1 rounded">Active</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
