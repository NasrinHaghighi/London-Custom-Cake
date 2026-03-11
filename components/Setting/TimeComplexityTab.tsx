type ComplexityRange = {
  level: 'Not set' | 'Low' | 'Medium' | 'Hard';
  range: string;
};

interface TimeComplexityTabProps {
  lowMaxMinutesInput: string;
  mediumMaxMinutesInput: string;
  isLoading: boolean;
  isSaving: boolean;
  thresholdRanges: ComplexityRange[];
  onLowMaxMinutesChange: (value: string) => void;
  onMediumMaxMinutesChange: (value: string) => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
}

export default function TimeComplexityTab({
  lowMaxMinutesInput,
  mediumMaxMinutesInput,
  isLoading,
  isSaving,
  thresholdRanges,
  onLowMaxMinutesChange,
  onMediumMaxMinutesChange,
  onSubmit,
}: TimeComplexityTabProps) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold mb-1">Production Time Complexity Thresholds</h3>
      <p className="text-sm text-gray-600 mb-4">
        These thresholds classify production complexity across menu guidance and order views.
      </p>

      <form onSubmit={onSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Low Threshold (minutes)</label>
            <input
              type="number"
              min="1"
              step="1"
              value={lowMaxMinutesInput}
              onChange={(e) => onLowMaxMinutesChange(e.target.value)}
              className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-admin-primary focus:outline-none"
              disabled={isLoading || isSaving}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Medium Threshold (minutes)</label>
            <input
              type="number"
              min="2"
              step="1"
              value={mediumMaxMinutesInput}
              onChange={(e) => onMediumMaxMinutesChange(e.target.value)}
              className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-admin-primary focus:outline-none"
              disabled={isLoading || isSaving}
            />
          </div>
        </div>

        <div className="rounded-md border border-gray-200 bg-gray-50 p-3">
          <p className="text-xs font-semibold text-gray-700 mb-2">Current ranges</p>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
            {thresholdRanges.map((range) => (
              <div key={range.level} className="rounded-md border border-gray-200 bg-white px-2 py-2 text-xs text-gray-700">
                <p className="font-semibold">{range.level}</p>
                <p>{range.range}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="bg-black text-white py-2.5 px-6 rounded-md hover:bg-gray-900 disabled:opacity-50 transition-all font-medium text-sm shadow-sm"
            disabled={isLoading || isSaving}
          >
            {isSaving ? 'Saving...' : 'Save Thresholds'}
          </button>
        </div>
      </form>
    </div>
  );
}
