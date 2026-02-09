import React from "react";

interface StatConfig {
  label: string;
  key: string;
  icon: React.ElementType;
  bg: string;
  iconColor: string;
}

interface StatsSummaryProps {
  statsConfig: StatConfig[];
  stats: { [key: string]: number } | undefined;
  isLoading: boolean;
}

export default function StatsSummary({ statsConfig, stats, isLoading }: StatsSummaryProps) {
    console.log("StatsSummary stats:", stats);
  if (isLoading) {
    return (
      <section className="mb-10">
        <div className="animate-pulse space-y-3">
          <div className="h-8 bg-gray-200 rounded w-1/2 mx-auto" />
          <div className="h-8 bg-gray-200 rounded w-1/3 mx-auto" />
        </div>
      </section>
    );
  }
  if (!stats || Object.keys(stats).length === 0) {
    return (
      <section className="mb-10">
        <div className="text-gray-400 text-center py-8">No stats to display.</div>
      </section>
    );
  }
  return (
    <section className="mb-10">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsConfig.map((stat) => (
          <div
            key={stat.label}
            className="flex items-center p-5 rounded-lg shadow-sm bg-white border border-gray-100"
          >
            <div className={`flex items-center justify-center w-14 h-14 rounded-full ${stat.bg} mr-4`}>
              <stat.icon className={`w-7 h-7 ${stat.iconColor}`} aria-hidden="true" />
            </div>
            <div>
              <div className="text-gray-500 text-sm mt-1">{stat.label}</div>
              <div className="text-2xl font-bold text-gray-900">{stats[stat.key]}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
