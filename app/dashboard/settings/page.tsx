'use client'


import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
// Deactivate admin API call
const deactivateAdmin = async (id: string) => {
  const res = await fetch(`/api/admin/${id}/deactivate`, { method: 'PATCH' });
  if (!res.ok) throw new Error('Failed to deactivate admin');
  return res.json();
};

import toast from 'react-hot-toast';
import AdminList from '@/components/Setting/AdminList';

// Fetch all admins
const fetchAdmins = async () => {
  const res = await fetch('/api/admin/list');
  if (!res.ok) throw new Error('Failed to fetch admins');
  return res.json();
};

// Delete admin API call
const deleteAdmin = async (id: string) => {
  const res = await fetch(`/api/admin/${id}/delete`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete admin');
  return res.json();
};


export default function Settings() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  // Mutation for sending admin invitation
  const mutation = useMutation({
    mutationFn: async (data: { name: string; email: string; phone: string }) => {
      const response = await fetch('/api/admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const errorData = await response.json();
        if (errorData.errors && Array.isArray(errorData.errors)) {
          setValidationErrors(errorData.errors);
          throw new Error('Validation failed');
        }
        throw new Error(errorData.message || 'Failed to send invitation');
      }
      return response.json();
    },
    onSuccess: (data) => {
      setValidationErrors([]);
      if (data.message === 'Invitation resent') {
        toast.success('Invitation resent to pending admin.');
      } else if (data.message === 'Invitation sent') {
        toast.success('Invitation sent to new admin.');
        setName('');
        setEmail('');
        setPhone('');
      } else {
        toast.success(data.message);
      }
    },
    onError: (error) => {
      if (error.message !== 'Validation failed') {
        setValidationErrors([]);
        toast.error(error.message || 'An error occurred');
      }
    },
  });

    // Mutation for deactivating admin
  const deactivateMutation = useMutation({
    mutationFn: deactivateAdmin,
    onSuccess: () => {
      toast.success('Admin deactivated');
      refetch();
    },
    onError: (error: unknown) => {
      let message = 'Failed to deactivate admin';
      if (error instanceof Error) {
        message = error.message;
      } else if (typeof error === 'string') {
        message = error;
      }
      toast.error(message);
    },
  });
 // Mutation for deleting admin
  const deleteMutation = useMutation({
    mutationFn: deleteAdmin,
    onSuccess: () => {
      toast.success('Admin deleted');
      refetch();
    },
    onError: (error: unknown) => {
      let message = 'Failed to delete admin';
      if (error instanceof Error) {
        message = error.message;
      } else if (typeof error === 'string') {
        message = error;
      }
      toast.error(message);
    },
  });
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate({ name, email, phone });
  };

  // Query for admin list
  const { data: adminData, isLoading: isLoadingAdmins, error: adminError, refetch } = useQuery({
    queryKey: ['admins'],
    queryFn: fetchAdmins,
  });



  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500 mt-1">Manage admin users and system settings</p>
      </div>

      {/* Add New Admin Form */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4">Add New Admin</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Name *</label>
              <input
                type="text"
                placeholder="Enter full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-admin-primary focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Email *</label>
              <input
                type="email"
                placeholder="admin@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-admin-primary focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Phone *</label>
              <input
                type="tel"
                placeholder="+44 123 456 7890"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-admin-primary focus:outline-none"
                required
              />
            </div>
          </div>

          {validationErrors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 space-y-1">
              {validationErrors.map((error, index) => (
                <p key={index} className="text-red-600 text-sm">{error}</p>
              ))}
            </div>
          )}
          {mutation.isError && validationErrors.length === 0 && (
            <p className="text-red-500 text-sm">Error: {mutation.error.message}</p>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              className="bg-admin-gradient text-white py-2.5 px-6 rounded-md hover:bg-admin-gradient-hover disabled:opacity-50 transition-all font-medium text-sm shadow-sm hover:shadow-admin"
              disabled={mutation.isPending}
            >
              {mutation.isPending ? '⏳ Sending...' : '➕ Send Invitation'}
            </button>
          </div>
        </form>
      </div>

      {/* Admin List */}
      <AdminList
        admins={adminData?.admins}
        isLoading={isLoadingAdmins}
        error={adminError}
        onDeactivate={(id) => deactivateMutation.mutate(id)}
        onInvite={(admin) => mutation.mutate({ name: admin.name, email: admin.email, phone: admin.phone })}
        onDelete={(id) => deleteMutation.mutate(id)}
      />
    </div>
  );
}