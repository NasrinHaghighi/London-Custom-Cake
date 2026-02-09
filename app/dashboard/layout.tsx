import Link from 'next/link';
import LogoutButton from '@/components/LogoutButton';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-100 flex">
      <div className="w-64 bg-white shadow-md">
        <div className="p-4">
          <h2 className="text-xl font-bold">Dashboard</h2>
          <ul className="mt-4">
            <li className="mb-2">
              <Link href="/dashboard" className="text-blue-500 hover:underline">Home</Link>
            </li>
            <li className="mb-2">
              <Link href="/dashboard/settings" className="text-blue-500 hover:underline">Settings</Link>
            </li>
             <li className="mb-2">
              <Link href="/dashboard/add-new-product" className="text-blue-500 hover:underline">Add New Product</Link>
            </li>
          </ul>
          <div className="mt-8">
            <LogoutButton />
          </div>
        </div>
      </div>
      <div className="flex-1 p-8">
        {children}
      </div>
    </div>
  );
}