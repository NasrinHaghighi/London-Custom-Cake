import React, { useState } from "react";

import type { ActivityLogType } from "@/app/dashboard/page";

interface RecentActivityProps {
  activities: ActivityLogType[] | undefined;
  isLoading: boolean;
}

const ACTION_LABELS: Record<string, string> = {
  all: "All",
  admin_added: "Added",
  admin_deactivated: "Deactivated",
  admin_deleted: "Deleted",
  admin_invitation_resent: "Resent Invitation",
};

const ACTION_ORDER = [
  "all",
  "admin_added",
  "admin_deactivated",
  "admin_deleted",
  "admin_invitation_resent",
];

const activityTimestampFormatter = new Intl.DateTimeFormat('en-GB', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
  timeZone: 'UTC',
});

function formatActivityTimestamp(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return '-';
  }
  return activityTimestampFormatter.format(parsed);
}

export default function RecentActivity({ activities, isLoading }: RecentActivityProps) {
  const [filter, setFilter] = useState<string>("all");

  // Filter activities by selected type
  const filteredActivities = activities
    ? filter === "all"
      ? activities.slice(0, 5)
      : activities.filter(a => a.action === filter).slice(0, 5)
    : [];

  // Helper to get initials from name
  const getInitials = (name: string) => name.split(" ").map(n => n[0]?.toUpperCase()).join("");
  // Helper to get badge color by action
  const getBadgeColor = (action: string) => {
    if (/delete|remove/i.test(action)) return "bg-red-100 text-red-600";
    if (/create|add/i.test(action)) return "bg-green-100 text-green-600";
    if (/deactivate|pending/i.test(action)) return "bg-yellow-100 text-yellow-700";
    if (/resent|invite/i.test(action)) return "bg-blue-100 text-blue-600";
    return "bg-gray-100 text-gray-600";
  };

  return (
    <section>
      <h2 className="text-lg font-semibold text-gray-800 mb-3">Recent Activity</h2>
      <div className="mb-4 flex gap-2 flex-wrap">
        {ACTION_ORDER.map(action => (
          <button
            key={action}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
              filter === action
                ? "bg-gradient-to-r from-gray-800 to-gray-900 text-white shadow-md"
                : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 hover:shadow-sm"
            }`}
            onClick={() => setFilter(action)}
          >
            {ACTION_LABELS[action]}
          </button>
        ))}
      </div>
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {isLoading ? (
          <div className="p-6 animate-pulse space-y-3">
            <div className="h-4 bg-gray-200 rounded w-1/2" />
            <div className="h-4 bg-gray-200 rounded w-1/3" />
            <div className="h-4 bg-gray-200 rounded w-1/4" />
          </div>
        ) : filteredActivities.length === 0 ? (
          <div className="text-gray-400 text-center py-8">No recent activity to display.</div>
        ) : (
          <div className="divide-y">
            {filteredActivities.map((activity, idx) => (
              <div key={activity._id || idx} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    {/* Avatar/Initials */}
                    <div className="shrink-0 w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center text-sm font-bold text-white">
                      {getInitials(activity.performedBy)}
                    </div>
                    {/* Main content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-semibold text-gray-800">{activity.performedBy}</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getBadgeColor(activity.action)}`}>{activity.action}</span>
                        {activity.targetAdmin && (
                          <span className="text-gray-600 text-sm">on <span className="font-medium">{activity.targetAdmin}</span></span>
                        )}
                      </div>
                      {activity.details && (
                        <div className="text-gray-500 text-sm">{activity.details}</div>
                      )}
                    </div>
                  </div>
                  {/* Timestamp */}
                  <div className="ml-4 text-right">
                    <span className="text-xs text-gray-400">
                      {formatActivityTimestamp(activity.timestamp)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
