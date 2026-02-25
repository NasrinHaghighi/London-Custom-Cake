'use client';

import { useMemo, useState } from 'react';
import Checkbox from '@/components/ui/Checkbox';
import { DeliveryMethod } from '../types';

export interface Address {
  id: string;
  label?: string;
  line1: string;
  line2?: string;
  city: string;
  state?: string;
  postalCode: string;
  notes?: string;
}

export interface Customer {
  _id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  addresses: Address[];
}

interface OrderTabCustomerInfoSectionProps {
  customerId: string;
  customer?: Customer;
  deliveryMethod: DeliveryMethod;
  deliveryAddressId: string;
  deliveryAddress?: Address;
  customerLoading: boolean;
  customerError: boolean;
  onPickupToggle: (checked: boolean) => void;
  onDeliveryAddressChange: (addressId: string) => void;
}

export default function OrderTabCustomerInfoSection({
  customerId,
  customer,
  deliveryMethod,
  deliveryAddressId,
  deliveryAddress,
  customerLoading,
  customerError,
  onPickupToggle,
  onDeliveryAddressChange,
}: OrderTabCustomerInfoSectionProps) {
  const [collapsedOverride, setCollapsedOverride] = useState<boolean | null>(null);

  const isSectionComplete = useMemo(() => {
    if (!customer) {
      return false;
    }

    if (deliveryMethod === 'pickup') {
      return true;
    }

    return Boolean(deliveryAddressId);
  }, [customer, deliveryMethod, deliveryAddressId]);

  const isCollapsed = collapsedOverride ?? isSectionComplete;

  if (!customerId) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h3 className="font-semibold text-gray-800">Order Contact Summary</h3>
        <p className="text-sm text-gray-600 mt-2">Customer information is not loaded yet. Please go back to the previous step and save customer details.</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
      <button
        type="button"
        onClick={() => {
          setCollapsedOverride((prev) => {
            const current = prev ?? isSectionComplete;
            return !current;
          });
        }}
        className="w-full flex items-center justify-between mb-3 text-left"
      >
        <div>
          <h3 className="font-semibold text-gray-800">Order Contact Summary</h3>
          {isSectionComplete && (
            <p className="text-xs text-gray-600 mt-1">Completed</p>
          )}
        </div>
        <span
          className={`text-lg font-bold text-gray-700 transition-transform duration-200 ${isCollapsed ? 'rotate-0' : 'rotate-180'}`}
          aria-hidden="true"
        >
          ▾
        </span>
      </button>

      {!isCollapsed && (
        <>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-md border border-gray-200 bg-white p-3">
          <p className="text-xs font-medium text-gray-500 mb-1">Customer</p>
          {customer && (
            <div className="space-y-1 text-sm text-gray-700">
              <p>Name: {customer.firstName} {customer.lastName}</p>
              <p>Phone: {customer.phone}</p>
              <p>Email: {customer.email || 'N/A'}</p>
            </div>
          )}
        </div>

        <div className="rounded-md border border-gray-200 bg-white p-3">
          <p className="text-xs font-medium text-gray-500 mb-1">Fulfillment</p>
          <Checkbox
            label="Pickup for this order"
            checked={deliveryMethod === 'pickup'}
            onChange={onPickupToggle}
            className="mb-2"
          />

          <p className="text-sm text-gray-700">
            Mode: {deliveryMethod === 'pickup' ? 'Pickup' : 'Delivery'}
          </p>
          {deliveryMethod === 'pickup' && (
            <p className="text-sm text-gray-600 mt-1">No delivery address needed.</p>
          )}

          {deliveryMethod === 'delivery' && customer?.addresses?.length ? (
            <div className="mt-3">
              <label className="block text-xs font-medium text-gray-500 mb-1">Selected Address</label>
              <select
                value={deliveryAddressId}
                onChange={(e) => onDeliveryAddressChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-700 focus:border-gray-800 focus:outline-none"
              >
                <option value="" disabled>Select address</option>
                {customer.addresses.map((address) => (
                  <option key={address.id} value={address.id}>
                    {address.label || 'Address'} - {address.line1}, {address.city}
                  </option>
                ))}
              </select>
            </div>
          ) : null}

          {deliveryMethod === 'delivery' && !customer?.addresses?.length && (
            <p className="text-sm text-gray-600 mt-2">No saved addresses available for this customer.</p>
          )}

          {deliveryMethod === 'delivery' && deliveryAddress && (
            <div className="mt-4 rounded-md border-2 border-gray-300 bg-white p-4">
              <p className="text-sm font-bold text-gray-900 mb-2">Delivery Address (Important)</p>
              <div className="space-y-1 text-sm text-gray-700">
                {deliveryAddress.label && (
                  <p>
                    <span className="font-bold text-gray-800">Label:</span> {deliveryAddress.label}
                  </p>
                )}
                <p>
                  <span className="font-bold text-gray-800">Address Line 1:</span> {deliveryAddress.line1}
                </p>
                {deliveryAddress.line2 && (
                  <p>
                    <span className="font-bold text-gray-800">Address Line 2:</span> {deliveryAddress.line2}
                  </p>
                )}
                <p>
                  <span className="font-bold text-gray-800">City/State:</span> {deliveryAddress.city}{deliveryAddress.state ? `, ${deliveryAddress.state}` : ''}
                </p>
                <p>
                  <span className="font-bold text-gray-800">Postal Code:</span> {deliveryAddress.postalCode}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {customerLoading && (
        <p className="text-sm text-gray-600 mt-2">Loading customer details...</p>
      )}

      {customerError && (
        <p className="text-sm text-red-600 mt-2">Failed to load customer details.</p>
      )}
        </>
      )}
    </div>
  );
}