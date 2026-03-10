type SettingsTab = 'timeComplexity' | 'admin';

interface SettingsTabsProps {
  activeTab: SettingsTab;
  onTabChange: (tab: SettingsTab) => void;
}

export default function SettingsTabs({ activeTab, onTabChange }: SettingsTabsProps) {
  return (
    <div className="bg-white rounded-lg shadow-md p-2">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => onTabChange('timeComplexity')}
          className={`rounded-md px-4 py-2.5 text-sm font-semibold transition-colors ${
            activeTab === 'timeComplexity'
              ? 'bg-black text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Time Complexity
        </button>
        <button
          type="button"
          onClick={() => onTabChange('admin')}
          className={`rounded-md px-4 py-2.5 text-sm font-semibold transition-colors ${
            activeTab === 'admin'
              ? 'bg-black text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Add New Admin
        </button>
      </div>
    </div>
  );
}
