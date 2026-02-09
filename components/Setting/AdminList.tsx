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
  if (isLoading) return <div>Loading admins...</div>;
  if (error) return <div className="text-red-500">Failed to load admins.</div>;
  if (!admins.length) return <div className="text-gray-500">No admins found.</div>;

  return (
    <div className="mt-8">
      <h3 className="text-xl mb-2">Admin List</h3>
      <div className="grid grid-cols-5 bg-white border rounded shadow text-sm font-semibold">
        <div className="py-2 px-4 border-b text-left">Name</div>
        <div className="py-2 px-4 border-b text-left">Email</div>
        <div className="py-2 px-4 border-b text-left">Phone</div>
        <div className="py-2 px-4 border-b text-center">Status</div>
        <div className="py-2 px-4 border-b text-center">Actions</div>
      </div>
      {admins.map((admin) => (
        <div key={admin._id} className="grid grid-cols-5 bg-white border-b last:border-b-0 text-sm items-center">
          <div className="py-2 px-4">{admin.name}</div>
          <div className="py-2 px-4">{admin.email}</div>
          <div className="py-2 px-4">{admin.phone}</div>
          <div className="py-2 px-4 text-center">
            {admin.passwordHash ? (
              <span className="text-green-600 font-semibold">Active</span>
            ) : (
              <span className="text-yellow-600 font-semibold">Pending</span>
            )}
          </div>
          <div className="py-2 px-4 flex gap-2 justify-center">
            <button
              className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
              onClick={() => onDelete && onDelete(admin._id)}
              aria-label="Delete admin"
              title="Delete admin"
            >
              Delete
            </button>
            {admin.passwordHash ? (
              <button
                className="bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600"
                onClick={() => onDeactivate && onDeactivate(admin._id)}
                aria-label="Deactivate admin"
                title="Deactivate admin"
              >
                Deactivate
              </button>
            ) : (
              <button
                className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                onClick={() => onInvite && onInvite(admin)}
                aria-label="Send invitation"
                title="Send invitation"
              >
                Send Invitation
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
