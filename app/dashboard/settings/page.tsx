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
    <div>
      <h2 className="text-2xl mb-4">Settings</h2>
      <p>Settings page content here.</p>

      <h3 className="text-xl mb-2">Add New Admin</h3>
      <form onSubmit={handleSubmit} className="bg-white p-4 rounded shadow-md w-full max-w-md">
        <input
          type="text"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full p-2 mb-4 border border-gray-300 rounded"
          required
        />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-2 mb-4 border border-gray-300 rounded"
          required
        />
        <input
          type="tel"
          placeholder="Phone"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="w-full p-2 mb-4 border border-gray-300 rounded"
          required
        />
        <button
          type="submit"
          className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
          disabled={mutation.isPending}
        >
          {mutation.isPending ? 'Sending...' : 'Send Invitation'}
        </button>
        {validationErrors.length > 0 && (
          <div className="mt-2 space-y-1">
            {validationErrors.map((error, index) => (
              <p key={index} className="text-red-500 text-sm">{error}</p>
            ))}
          </div>
        )}
        {mutation.isError && validationErrors.length === 0 && (
          <p className="text-red-500 text-sm mt-2">Error: {mutation.error.message}</p>
        )}
      </form>

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