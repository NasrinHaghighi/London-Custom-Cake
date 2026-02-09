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
            className={`px-3 py-1 rounded border text-sm font-semibold transition-colors duration-150 ${
              filter === action
                ? "bg-blue-500 text-white border-blue-500 shadow"
                : "bg-white text-gray-700 border-gray-300 hover:bg-blue-50"
            }`}
            onClick={() => setFilter(action)}
          >
            {ACTION_LABELS[action]}
          </button>
        ))}
      </div>
      <div className="bg-white border border-gray-100 rounded-lg p-5 min-h-30">
        {isLoading ? (
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-gray-200 rounded w-1/2" />
            <div className="h-4 bg-gray-200 rounded w-1/3" />
            <div className="h-4 bg-gray-200 rounded w-1/4" />
          </div>
        ) : filteredActivities.length === 0 ? (
          <div className="text-gray-400 text-center py-8">No recent activity to display.</div>
        ) : (
          <ul className="space-y-3">
            {filteredActivities.map((activity, idx) => (
              <li key={activity._id || idx} className="flex items-center bg-gray-50 rounded-lg px-4 py-3 shadow-sm">
                {/* Avatar/Initials */}
                <div className="shrink-0 w-10 h-10 rounded-full bg-blue-200 flex items-center justify-center text-lg font-bold text-blue-700 mr-4">
                  {getInitials(activity.performedBy)}
                </div>
                {/* Main content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-gray-800">{activity.performedBy}</span>
                    <span className={`px-2 py-0.5 rounded text-xs font-semibold ${getBadgeColor(activity.action)}`}>{activity.action}</span>
                    {activity.targetAdmin && (
                      <span className="text-gray-700">on <b>{activity.targetAdmin}</b></span>
                    )}
                  </div>
                  {activity.details && (
                    <div className="text-gray-500 text-sm mt-0.5">{activity.details}</div>
                  )}
                </div>
                {/* Timestamp */}
                <div className="flex flex-col items-end ml-4">
                  <span className="flex items-center text-xs text-gray-400">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    {new Date(activity.timestamp).toLocaleString()}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
