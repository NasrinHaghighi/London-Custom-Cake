'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import LogoutButton from './LogoutButton';

interface User {
  email: string;
  phone: string;
}

interface SidebarProps {
  user: User | null;
}

export default function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();

  const isActive = (path: string) => {
    if (path === '/dashboard') {
      return pathname === '/dashboard';
    }
    return pathname.startsWith(path);
  };

  return (
    <div className="w-64 bg-white shadow-md flex flex-col h-screen sticky top-0">
      {/* User Info Section */}
      {user && (
        <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-gray-800 to-gray-900 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center text-white font-bold text-lg">
                {user.email?.charAt(0).toUpperCase() || 'A'}
              </div>
              {/* Online indicator */}
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 rounded-full border-2 border-gray-900"></div>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-white font-semibold text-sm truncate">
                {user.email?.split('@')[0] || 'Admin'}
              </h3>
              <p className="text-gray-300 text-xs truncate">{user.phone}</p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex-1 p-4 overflow-y-auto">
        {/* Dashboard Section */}
        <div className="mb-6">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-3">
            Dashboard
          </h3>
          <ul className="space-y-1">
            <li>
              <Link
                href="/dashboard"
                className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
                  isActive('/dashboard') && pathname === '/dashboard'
                    ? 'bg-gray-800 text-white'
                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <span className="font-medium">Overview</span>
              </Link>
            </li>
          </ul>
        </div>

        {/* Menu Section */}
        <div className="mb-6">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-3">
            Menu
          </h3>
          <ul className="space-y-1">
            <li>
              <Link
                href="/dashboard/menu-management"
                className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
                  isActive('/dashboard/menu-management')
                    ? 'bg-gray-800 text-white'
                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <span className="font-medium">Menu Management</span>
              </Link>
            </li>
          </ul>
        </div>

        {/* Settings Section */}
        <div className="mb-6">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-3">
            Settings
          </h3>
          <ul className="space-y-1">
            <li>
              <Link
                href="/dashboard/settings"
                className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
                  isActive('/dashboard/settings')
                    ? 'bg-gray-800 text-white'
                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <span className="font-medium">Admin Management</span>
              </Link>
            </li>
          </ul>
        </div>
      </div>

      {/* Logout Button */}
      <div className="p-4 border-t border-gray-200 flex-shrink-0">
        <LogoutButton />
      </div>
    </div>
  );
}
