'use client';

import { useEffect } from 'react';
import { CustomerForm, Address } from '../types';

interface CustomerDeliveryTabProps {
  form: CustomerForm;
  setForm: (form: CustomerForm) => void;
  addresses: Address[];
  lookupStatus: 'idle' | 'loading' | 'found' | 'not-found' | 'error';
}

export default function CustomerDeliveryTab({ form, setForm, addresses, lookupStatus }: CustomerDeliveryTabProps) {
  const hasAddresses = addresses.length > 0;

  useEffect(() => {
    if (form.deliveryMethod === 'delivery' && !hasAddresses && form.addressMode === 'existing') {
      setForm({ ...form, addressMode: 'new', selectedAddressId: '' });
    }
  }, [hasAddresses, form, setForm]);

  return (
    <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-800">Customer & Information</h2>
        <p className="text-gray-600 text-sm mt-1">Search by phone to autofill customer details</p>
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">Order Info</label>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setForm({ ...form, deliveryMethod: 'delivery' })}
            className={`px-4 py-2 rounded-md text-sm font-medium border ${
              form.deliveryMethod === 'delivery'
                ? 'bg-gray-800 text-white border-gray-800'
                : 'bg-white text-gray-700 border-gray-300'
            }`}
          >
            Delivery
          </button>
          <button
            type="button"
            onClick={() => setForm({ ...form, deliveryMethod: 'pickup', selectedAddressId: '' })}
            className={`px-4 py-2 rounded-md text-sm font-medium border ${
              form.deliveryMethod === 'pickup'
                ? 'bg-gray-800 text-white border-gray-800'
                : 'bg-white text-gray-700 border-gray-300'
            }`}
          >
            Pickup
          </button>
        </div>
      </div>

      {/* Phone lookup */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Phone Number *</label>
          <input
            type="tel"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            autoComplete="off"
            className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-gray-800 focus:outline-none"
            placeholder="e.g., 999123456"
            required
          />
          <div className="mt-2 text-xs text-gray-500">
            {lookupStatus === 'loading' && 'Looking up customer...'}
            {lookupStatus === 'found' && 'Customer found and autofilled.'}
            {lookupStatus === 'not-found' && 'No customer found. Please enter details.'}
            {lookupStatus === 'error' && 'Lookup failed. Please try again.'}
          </div>
        </div>

      </div>

      {/* Names */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">First Name *</label>
          <input
            type="text"
            value={form.firstName}
            onChange={(e) => setForm({ ...form, firstName: e.target.value })}
            autoComplete="off"
            className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-gray-800 focus:outline-none"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Last Name *</label>
          <input
            type="text"
            value={form.lastName}
            onChange={(e) => setForm({ ...form, lastName: e.target.value })}
            autoComplete="off"
            className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-gray-800 focus:outline-none"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Email *</label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            autoComplete="off"
            className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-gray-800 focus:outline-none"
            required
          />
        </div>
      </div>

      {/* Address */}
      {form.deliveryMethod === 'delivery' && (
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Address Selection</label>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setForm({ ...form, addressMode: 'existing' })}
              disabled={!hasAddresses}
              className={`px-4 py-2 rounded-md text-sm font-medium border ${
                form.addressMode === 'existing'
                  ? 'bg-gray-800 text-white border-gray-800'
                  : 'bg-white text-gray-700 border-gray-300'
              } ${!hasAddresses ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              Existing Address
            </button>
            <button
              type="button"
              onClick={() => setForm({ ...form, addressMode: 'new' })}
              className={`px-4 py-2 rounded-md text-sm font-medium border ${
                form.addressMode === 'new'
                  ? 'bg-gray-800 text-white border-gray-800'
                  : 'bg-white text-gray-700 border-gray-300'
              }`}
            >
              New Address
            </button>
          </div>
        </div>

        {form.addressMode === 'existing' && hasAddresses && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {addresses.map((address) => (
              <label
                key={address.id}
                className={`border rounded-md p-3 cursor-pointer ${
                  form.selectedAddressId === address.id
                    ? 'border-gray-800 bg-gray-50'
                    : 'border-gray-200'
                }`}
              >
                <div className="flex items-start gap-2">
                  <input
                    type="radio"
                    checked={form.selectedAddressId === address.id}
                    onChange={() => setForm({ ...form, selectedAddressId: address.id })}
                    className="mt-1"
                  />
                  <div>
                    <p className="font-semibold text-sm text-gray-700">{address.label || 'Address'}</p>
                    <p className="text-xs text-gray-600">{address.line1}{address.line2 ? `, ${address.line2}` : ''}</p>
                    <p className="text-xs text-gray-600">{address.city}, {address.state} {address.postalCode}</p>
                  </div>
                </div>
              </label>
            ))}
          </div>
        )}

        {form.addressMode === 'new' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Address Line 1 *</label>
              <input
                type="text"
                value={form.newAddress.line1}
                onChange={(e) => setForm({ ...form, newAddress: { ...form.newAddress, line1: e.target.value } })}
                autoComplete="off"
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-gray-800 focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Address Line 2</label>
              <input
                type="text"
                value={form.newAddress.line2}
                onChange={(e) => setForm({ ...form, newAddress: { ...form.newAddress, line2: e.target.value } })}
                autoComplete="off"
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-gray-800 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">City *</label>
              <input
                type="text"
                value={form.newAddress.city}
                onChange={(e) => setForm({ ...form, newAddress: { ...form.newAddress, city: e.target.value } })}
                autoComplete="off"
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-gray-800 focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">State</label>
              <input
                type="text"
                value={form.newAddress.state}
                onChange={(e) => setForm({ ...form, newAddress: { ...form.newAddress, state: e.target.value } })}
                autoComplete="off"
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-gray-800 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Postal Code *</label>
              <input
                type="text"
                value={form.newAddress.postalCode}
                onChange={(e) => setForm({ ...form, newAddress: { ...form.newAddress, postalCode: e.target.value } })}
                autoComplete="off"
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-gray-800 focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Notes</label>
              <input
                type="text"
                value={form.newAddress.notes}
                onChange={(e) => setForm({ ...form, newAddress: { ...form.newAddress, notes: e.target.value } })}
                autoComplete="off"
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-gray-800 focus:outline-none"
              />
            </div>
          </div>
        )}
      </div>
      )}

      {form.deliveryMethod === 'pickup' && (
        <div className="rounded-md border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700">
          Pickup selected. Delivery address is not required for this order.
        </div>
      )}

      {/* Notes */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">Notes</label>
        <textarea
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
          autoComplete="off"
          className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-gray-800 focus:outline-none"
          rows={3}
          placeholder="Order notes, allergies, or special requests"
        />
      </div>
    </div>
  );
}
