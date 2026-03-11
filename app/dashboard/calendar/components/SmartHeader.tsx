import type { OrderEnhanced } from './ProductionCard';

// Helper: format time as HH:mm
function formatTime(date: Date) {
  return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

type TodayStats = {
  total: number;
  delayed: number;
  totalPrepTime: number;
  workloadLevel: 'Light' | 'Normal' | 'Heavy';
  workloadPercentage: number;
};

type TomorrowAlerts = {
  earlyMorning: OrderEnhanced[];
  mustStartToday: OrderEnhanced[];
};

type SmartHeaderProps = {
  currentTime: Date;
  todayStats: TodayStats;
  tomorrowAlerts: TomorrowAlerts;
};

export function SmartHeader({ currentTime, todayStats, tomorrowAlerts }: SmartHeaderProps) {
  // Determine workload card colors based on level
  const getWorkloadColors = (level: string) => {
    switch (level) {
      case 'Light':
        return 'bg-green-100 border-green-300';
      case 'Normal':
        return 'bg-amber-100 border-amber-300';
      case 'Heavy':
        return 'bg-red-100 border-red-300';
      default:
        return 'bg-gray-100 border-gray-200';
    }
  };

  const getWorkloadTextColor = (level: string) => {
    switch (level) {
      case 'Light':
        return 'text-green-900';
      case 'Normal':
        return 'text-amber-900';
      case 'Heavy':
        return 'text-red-900';
      default:
        return 'text-gray-700';
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 text-gray-900">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Production Command Center</h1>
          <p className="text-gray-700 text-sm mt-1">
            {currentTime.toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold">{formatTime(currentTime)}</div>
          <div className="text-gray-700 text-sm">Live Time</div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-4 gap-3 mt-4">
        <div className="bg-gray-100 border border-gray-200 rounded-lg p-3">
          <div className="text-2xl font-bold">{todayStats.total}</div>
          <div className="text-xs text-gray-700">Orders Today</div>
        </div>

        <div className="bg-gray-100 border border-gray-200 rounded-lg p-3">
          <div className="text-2xl font-bold">{todayStats.delayed}</div>
          <div className="text-xs text-gray-700">Delayed</div>
        </div>

        <div className="bg-gray-100 border border-gray-200 rounded-lg p-3">
          <div className="text-2xl font-bold">{todayStats.totalPrepTime}h</div>
          <div className="text-xs text-gray-700">Total Prep Time</div>
        </div>

        <div className={`border rounded-lg p-3 ${getWorkloadColors(todayStats.workloadLevel)}`}>
          <div className={`text-2xl font-bold ${getWorkloadTextColor(todayStats.workloadLevel)}`}>{todayStats.workloadLevel}</div>
          <div className={`text-xs ${getWorkloadTextColor(todayStats.workloadLevel)}`}>{Math.round(todayStats.workloadPercentage)}% used ({todayStats.totalPrepTime}h of 8h)</div>
        </div>
      </div>

      {/* Tomorrow Alerts */}
      {(tomorrowAlerts.earlyMorning.length > 0 || tomorrowAlerts.mustStartToday.length > 0) && (
        <div className="mt-3 space-y-2">
          {tomorrowAlerts.earlyMorning.length > 0 && (
            <div className="bg-amber-500/20 border border-amber-300 rounded px-3 py-2 text-sm">
              <span className="font-semibold">{tomorrowAlerts.earlyMorning.length}</span> hard-complexity early
              morning orders tomorrow
            </div>
          )}
          {tomorrowAlerts.mustStartToday.length > 0 && (
            <div className="bg-red-500/20 border border-red-300 rounded px-3 py-2 text-sm">
              <span className="font-semibold">{tomorrowAlerts.mustStartToday.length}</span> tomorrow orders must start
              TODAY
            </div>
          )}
        </div>
      )}
    </div>
  );
}
