'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  useCustomerDetail,
  useDeleteCustomer,
  useDeleteCustomerAddress,
  useUpdateCustomer,
  useUpdateCustomerAddress,
} from '@/hooks/useCustomers';
import { useRouter } from 'next/navigation';

export default function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: customer, isLoading, error } = useCustomerDetail(id);
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState('');
  const [formState, setFormState] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    notes: '',
  });
  const [addressForm, setAddressForm] = useState({
    label: '',
    line1: '',
    line2: '',
    city: '',
    state: '',
    postalCode: '',
    notes: '',
  });

  const updateCustomerMutation = useUpdateCustomer(id, () => setIsEditing(false));
  const deleteCustomerMutation = useDeleteCustomer(() => router.push('/dashboard/customers'));
  const updateAddressMutation = useUpdateCustomerAddress(id, () => setEditingAddressId(''));
  const deleteAddressMutation = useDeleteCustomerAddress(id);

  useEffect(() => {
    if (!customer) return;
    const handle = setTimeout(() => {
      setFormState({
        firstName: customer.firstName,
        lastName: customer.lastName,
        email: customer.email,
        phone: customer.phone,
        notes: customer.notes || '',
      });
    }, 0);

    return () => clearTimeout(handle);
  }, [customer]);

  useEffect(() => {
    if (!customer || !editingAddressId) return;
    const current = customer.addresses.find((address) => address.id === editingAddressId);
    if (!current) return;
    const handle = setTimeout(() => {
      setAddressForm({
        label: current.label || '',
        line1: current.line1,
        line2: current.line2 || '',
        city: current.city,
        state: current.state || '',
        postalCode: current.postalCode,
        notes: current.notes || '',
      });
    }, 0);

    return () => clearTimeout(handle);
  }, [customer, editingAddressId]);

  const handleSave = () => {
    updateCustomerMutation.mutate({
      firstName: formState.firstName,
      lastName: formState.lastName,
      email: formState.email,
      phone: formState.phone,
      notes: formState.notes,
    });
  };

  const handleDelete = () => {
    if (!customer) return;
    const confirmed = window.confirm('Delete this customer? This action cannot be undone.');
    if (!confirmed) return;
    deleteCustomerMutation.mutate(customer._id);
  };

  const handleSaveAddress = () => {
    if (!editingAddressId) return;
    updateAddressMutation.mutate({
      addressId: editingAddressId,
      data: {
        label: addressForm.label || undefined,
        line1: addressForm.line1,
        line2: addressForm.line2 || undefined,
        city: addressForm.city,
        state: addressForm.state || undefined,
        postalCode: addressForm.postalCode,
        notes: addressForm.notes || undefined,
      },
    });
  };

  const handleDeleteAddress = (addressId: string) => {
    const confirmed = window.confirm('Delete this address?');
    if (!confirmed) return;
    deleteAddressMutation.mutate(addressId);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Customer Details</h1>
          <p className="text-gray-600 mt-2">Customer profile and addresses</p>
        </div>
        <Link
          href="/dashboard/customers"
          className="text-sm font-medium text-gray-700 hover:text-gray-900"
        >
          ← Back to Customers
        </Link>
      </div>

      {isLoading && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center text-blue-700">
          Loading customer...
        </div>
      )}

      {!isLoading && error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center text-red-700">
          {error instanceof Error ? error.message : 'Failed to load customer'}
        </div>
      )}

      {!isLoading && !error && customer && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-800">Profile</h2>
              <div className="flex gap-2">
                {!isEditing ? (
                  <button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Edit
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSave}
                      disabled={updateCustomerMutation.isPending}
                      className="px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-md hover:bg-black disabled:opacity-50"
                    >
                      {updateCustomerMutation.isPending ? 'Saving...' : 'Save'}
                    </button>
                  </>
                )}
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deleteCustomerMutation.isPending}
                  className="px-4 py-2 text-sm font-medium text-red-600 border border-red-200 rounded-md hover:bg-red-50 disabled:opacity-50"
                >
                  {deleteCustomerMutation.isPending ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>

            {!isEditing ? (
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700">
                <div>
                  <span className="font-semibold">Name:</span> {customer.firstName} {customer.lastName}
                </div>
                <div>
                  <span className="font-semibold">Phone:</span> {customer.phone}
                </div>
                <div>
                  <span className="font-semibold">Email:</span> {customer.email}
                </div>
                <div>
                  <span className="font-semibold">Notes:</span> {customer.notes || '-'}
                </div>
              </div>
            ) : (
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">First name</label>
                  <input
                    type="text"
                    value={formState.firstName}
                    onChange={(e) => setFormState({ ...formState, firstName: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-gray-800 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Last name</label>
                  <input
                    type="text"
                    value={formState.lastName}
                    onChange={(e) => setFormState({ ...formState, lastName: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-gray-800 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                  <input
                    type="email"
                    value={formState.email}
                    onChange={(e) => setFormState({ ...formState, email: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-gray-800 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Phone</label>
                  <input
                    type="text"
                    value={formState.phone}
                    onChange={(e) => setFormState({ ...formState, phone: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-gray-800 focus:outline-none"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Notes</label>
                  <textarea
                    value={formState.notes}
                    onChange={(e) => setFormState({ ...formState, notes: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-gray-800 focus:outline-none"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-800">Addresses</h2>
            {customer.addresses.length === 0 ? (
              <p className="text-sm text-gray-500 mt-3">No addresses yet.</p>
            ) : (
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                {customer.addresses.map((address) => (
                  <div key={address.id} className="border border-gray-200 rounded-md p-4">
                    {editingAddressId !== address.id ? (
                      <>
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-semibold text-gray-700">{address.label || 'Address'}</p>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => setEditingAddressId(address.id)}
                              className="text-xs text-gray-700 hover:underline"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteAddress(address.id)}
                              className="text-xs text-red-600 hover:underline"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                        <p className="text-xs text-gray-600 mt-1">
                          {address.line1}{address.line2 ? `, ${address.line2}` : ''}
                        </p>
                        <p className="text-xs text-gray-600">
                          {address.city}, {address.state} {address.postalCode}
                        </p>
                        {address.notes && (
                          <p className="text-xs text-gray-500 mt-2">{address.notes}</p>
                        )}
                      </>
                    ) : (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-semibold text-gray-700">Edit Address</p>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => setEditingAddressId('')}
                              className="text-xs text-gray-700 hover:underline"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={handleSaveAddress}
                              disabled={updateAddressMutation.isPending}
                              className="text-xs text-gray-900 font-semibold hover:underline disabled:opacity-50"
                            >
                              {updateAddressMutation.isPending ? 'Saving...' : 'Save'}
                            </button>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 gap-2">
                          <input
                            type="text"
                            value={addressForm.label}
                            onChange={(e) => setAddressForm({ ...addressForm, label: e.target.value })}
                            placeholder="Label"
                            className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm"
                          />
                          <input
                            type="text"
                            value={addressForm.line1}
                            onChange={(e) => setAddressForm({ ...addressForm, line1: e.target.value })}
                            placeholder="Line 1"
                            className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm"
                          />
                          <input
                            type="text"
                            value={addressForm.line2}
                            onChange={(e) => setAddressForm({ ...addressForm, line2: e.target.value })}
                            placeholder="Line 2"
                            className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm"
                          />
                          <input
                            type="text"
                            value={addressForm.city}
                            onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                            placeholder="City"
                            className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm"
                          />
                          <input
                            type="text"
                            value={addressForm.state}
                            onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}
                            placeholder="State"
                            className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm"
                          />
                          <input
                            type="text"
                            value={addressForm.postalCode}
                            onChange={(e) => setAddressForm({ ...addressForm, postalCode: e.target.value })}
                            placeholder="Postal code"
                            className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm"
                          />
                          <input
                            type="text"
                            value={addressForm.notes}
                            onChange={(e) => setAddressForm({ ...addressForm, notes: e.target.value })}
                            placeholder="Notes"
                            className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-800">Order History</h2>
            <p className="text-sm text-gray-500 mt-3">No orders to show yet.</p>
          </div>
        </div>
      )}
    </div>
  );
}
