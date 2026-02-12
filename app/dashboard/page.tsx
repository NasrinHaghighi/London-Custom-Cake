
'use client';


import React from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowTrendingUpIcon, CakeIcon, ClipboardDocumentListIcon, UserGroupIcon } from "@heroicons/react/24/outline";

import QuickActions from "@/components/QuickActions";
import RecentActivity from "@/components/RecentActivity";
import StatsSummary from "@/components/StatsSummary";


const statsConfig = [
  {
    label: "Total Cakes",
    key: "totalCakes",
    icon: CakeIcon,
    bg: "bg-pink-100",
    iconColor: "text-pink-500",
  },
  {
    label: "Total Orders",
    key: "totalOrders",
    icon: ClipboardDocumentListIcon,
    bg: "bg-blue-100",
    iconColor: "text-blue-500",
  },
  {
    label: "Pending Orders",
    key: "pendingOrders",
    icon: ArrowTrendingUpIcon,
    bg: "bg-yellow-100",
    iconColor: "text-yellow-500",
  },
  {
    label: "Total Admins",
    key: "totalAdmins",
    icon: UserGroupIcon,
    bg: "bg-green-100",
    iconColor: "text-green-500",
  },
];

// Type for stats object
type StatsType = {
  [key: string]: number;
};

// Fetch stats from the real API endpoint
async function fetchStats(): Promise<StatsType> {
  const res = await fetch("/api/dashboard/summary", {
    method: "GET",
    credentials: "include", // send cookies
  });
  if (!res.ok) {
    throw new Error("Failed to fetch stats");
  }
  return res.json();
}

const quickActions = [
  {
    label: "Menu Management",
    href: "/dashboard/menu-management",
  },
  {
    label: "View Orders",
    href: "/admin/orders",
  },
  {
    label: "Admin Management",
    href: "/dashboard/settings",
  },
];




// Simulate fetching recent activities

// Fetch recent activities from the real API endpoint
export type ActivityLogType = {
  action: string;
  performedBy: string;
  targetAdmin?: string;
  details?: string;
  timestamp: string;
  _id: string;
};

async function fetchActivities(): Promise<ActivityLogType[]> {
  const res = await fetch("/api/activitylog", {
    method: "GET",
    credentials: "include",
  });
  if (!res.ok) {
    throw new Error("Failed to fetch activity logs");
  }
  const data = await res.json();
  return data.logs || [];
}


export default function DashboardPage() {
  const { data: activities, isLoading: isLoadingActivities } = useQuery<ActivityLogType[]>({
    queryKey: ["activities"],
    queryFn: fetchActivities,
  });
  const { data: stats, isLoading: isLoadingStats } = useQuery<StatsType>({
    queryKey: ["stats"],
    queryFn: fetchStats,
  });
  console.log("Dashboard activities...:", activities);

  return (
    <main className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">Overview of the bakery management system</p>
      </header>

      {/* Stats Summary */}
      <StatsSummary statsConfig={statsConfig} stats={stats} isLoading={isLoadingStats} />

      {/* Quick Actions */}
      {quickActions.length === 0 ? (
        <div className="text-gray-400 text-center py-8">No quick actions available.</div>
      ) : (
        <QuickActions actions={quickActions} />
      )}

      {/* Recent Activity */}
    <RecentActivity activities={activities} isLoading={isLoadingActivities} />
    </main>
  );
}
