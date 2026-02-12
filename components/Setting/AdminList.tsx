import React from 'react';

type Admin = {
  _id: string;
  name: string;
  email: string;
  phone: string;
  passwordHash?: string;
};

type AdminListProps = {
  admins?: Admin[];
  onDelete?: (id: string) => void;
  onDeactivate?: (id: string) => void;
  onInvite?: (admin: Admin) => void;
  isLoading?: boolean;
  error?: unknown;
};

export default function AdminList({ admins = [], onDelete, onDeactivate, onInvite, isLoading, error }: AdminListProps) {
  if (isLoading) return <div className="p-8 text-center text-gray-500">Loading admins...</div>;
  if (error) return <div className="p-8 text-center text-red-500">Failed to load admins.</div>;
  if (!admins.length) return <div className="p-8 text-center text-gray-500">No admins found.</div>;

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <h3 className="text-lg font-semibold p-6 border-b">Admin List</h3>
      <div className="divide-y">
        {admins.map((admin) => (
          <div key={admin._id} className="p-4 hover:bg-gray-50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Name</p>
                  <p className="text-sm font-medium text-gray-900">{admin.name}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Email</p>
                  <p className="text-sm text-gray-700">{admin.email}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Phone</p>
                  <p className="text-sm text-gray-700">{admin.phone}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 ml-4">
                <div>
                  {admin.passwordHash ? (
                    <span className="px-3 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-700">
                      Active
                    </span>
                  ) : (
                    <span className="px-3 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-700">
                      Pending
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    className="bg-red-600 text-white px-3 py-1.5 rounded-md hover:bg-red-700 transition-colors text-sm font-medium"
                    onClick={() => onDelete && onDelete(admin._id)}
                    aria-label="Delete admin"
                    title="Delete admin"
                  >
                    Delete
                  </button>
                  {admin.passwordHash ? (
                    <button
                      className="bg-yellow-600 text-white px-3 py-1.5 rounded-md hover:bg-yellow-700 transition-colors text-sm font-medium"
                      onClick={() => onDeactivate && onDeactivate(admin._id)}
                      aria-label="Deactivate admin"
                      title="Deactivate admin"
                    >
                      Deactivate
                    </button>
                  ) : (
                    <button
                      className="bg-admin-gradient text-white px-3 py-1.5 rounded-md hover:bg-admin-gradient-hover transition-all text-sm font-medium"
                      onClick={() => onInvite && onInvite(admin)}
                      aria-label="Send invitation"
                      title="Send invitation"
                    >
                      Resend Invite
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
