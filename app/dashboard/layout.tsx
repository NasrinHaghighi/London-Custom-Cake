import { getCurrentUser } from '@/lib/getCurrentUser';
import Sidebar from '@/components/Sidebar';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  return (
    <div className="min-h-screen bg-gray-100 flex">
      <Sidebar user={user} />
      <div className="flex-1 p-8">
        {children}
      </div>
    </div>
  );
}