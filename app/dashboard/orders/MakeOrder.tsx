'use client';

import { useEffect, useMemo, useState } from 'react';
import { useProductTypes } from '@/hooks/useProductTypes';
import { useCakeShapes } from '@/hooks/useCakeShapes';
import OrderTabsNav from './components/OrderTabsNav';
import CustomerDeliveryTab from './components/CustomerDeliveryTab';
import OrderItemsTab from './components/OrderItemsTab';
import { Address, CustomerForm, CustomerLookupResult, OrderItem } from './types';

const initialCustomerForm: CustomerForm = {
  phone: '',
  firstName: '',
  lastName: '',
  email: '',
  notes: '',
  addressMode: 'existing',
  selectedAddressId: '',
  newAddress: {
    line1: '',
    line2: '',
    city: '',
    state: '',
    postalCode: '',
    notes: '',
  },
};

export default function MakeOrder() {
  const { data: productTypes = [], isLoading: productsLoading } = useProductTypes();
  const { data: cakeShapes = [], isLoading: shapesLoading } = useCakeShapes();

  const [activeTab, setActiveTab] = useState<'customer' | 'order' | 'payment'>('customer');
  const [customerForm, setCustomerForm] = useState<CustomerForm>(initialCustomerForm);
  //console.log('Customer Form State:', customerForm);
  const [customerId, setCustomerId] = useState<string>('');
  const [customerAddresses, setCustomerAddresses] = useState<Address[]>([]);
  const [selectedDeliveryAddressId, setSelectedDeliveryAddressId] = useState<string>('');
  const [lookupStatus, setLookupStatus] = useState<'idle' | 'loading' | 'found' | 'not-found' | 'error'>('idle');
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [isCreatingCustomer, setIsCreatingCustomer] = useState(false);
  const [isSavingAddress, setIsSavingAddress] = useState(false);

  const isLoading = productsLoading || shapesLoading;

  const isCustomerTabValid = useMemo(() => {
    if (!customerForm.phone || !customerForm.firstName || !customerForm.lastName || !customerForm.email) {
      return false;
    }

    if (customerForm.addressMode === 'existing') {
      return Boolean(customerForm.selectedAddressId);
    }

    return Boolean(
      customerForm.newAddress.line1 &&
      customerForm.newAddress.city &&
      customerForm.newAddress.postalCode
    );
  }, [customerForm]);

  const canAccessTab = (tab: 'customer' | 'order' | 'payment') => {
    if (tab === 'customer') return true;
    if (tab === 'order') return isCustomerTabValid;
    return false;
  };

  const buildNewCustomerPayload = () => {
    const base = {
      firstName: customerForm.firstName,
      lastName: customerForm.lastName,
      email: customerForm.email,
      phone: customerForm.phone,
      notes: customerForm.notes,
      addresses: [] as Address[],
    };

    if (customerForm.addressMode === 'new') {
      base.addresses = [{
        id: '',
        label: 'Primary',
        line1: customerForm.newAddress.line1,
        line2: customerForm.newAddress.line2,
        city: customerForm.newAddress.city,
        state: customerForm.newAddress.state,
        postalCode: customerForm.newAddress.postalCode,
        notes: customerForm.newAddress.notes,
      }];
    }

    return base;
  };

  const handleNextFromCustomer = async () => {
    if (!isCustomerTabValid || isCreatingCustomer || isSavingAddress) return;

    // If customer found and adding new address
    if (lookupStatus === 'found' && customerId && customerForm.addressMode === 'new' && customerForm.newAddress.line1) {
      await handleSaveNewAddress();
      return;
    }

    // If customer found and using existing address, just move to next tab
    if (lookupStatus === 'found') {
      setSelectedDeliveryAddressId(customerForm.selectedAddressId);
      setActiveTab('order');
      return;
    }

    // Create new customer
    setIsCreatingCustomer(true);
    try {
      const payload = buildNewCustomerPayload();
      const response = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        setLookupStatus('error');
        return;
      }

      const data = await response.json();
      if (data?.customer) {
        setCustomerAddresses(data.customer.addresses || []);
        setCustomerId(data.customer._id || '');
        setSelectedDeliveryAddressId(data.customer.addresses[0]?.id || '');
        setLookupStatus('found');
      }

      setActiveTab('order');
    } finally {
      setIsCreatingCustomer(false);
    }
  };

  const handleSaveNewAddress = async () => {
    if (!customerId) {
      return;
    }

    if (!customerForm.newAddress.line1) {
      return;
    }

    setIsSavingAddress(true);
    try {
      const response = await fetch(`/api/customers/${customerId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          line1: customerForm.newAddress.line1,
          line2: customerForm.newAddress.line2,
          city: customerForm.newAddress.city,
          state: customerForm.newAddress.state,
          postalCode: customerForm.newAddress.postalCode,
          notes: customerForm.newAddress.notes,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        return;
      }

      const data = await response.json();
      if (data?.customer) {
        setCustomerAddresses(data.customer.addresses || []);
        setSelectedDeliveryAddressId(data.customer.addresses[data.customer.addresses.length - 1]?.id || '');
        // Reset new address form
        setCustomerForm((prev) => ({
          ...prev,
          newAddress: {
            line1: '',
            line2: '',
            city: '',
            state: '',
            postalCode: '',
            notes: '',
          },
          addressMode: 'existing',
          selectedAddressId: data.customer.addresses[data.customer.addresses.length - 1]?.id || '',
        }));
      }

      setActiveTab('order');
    } finally {
      setIsSavingAddress(false);
    }
  };

  // Customer lookup by phone (debounced)
  useEffect(() => {
    if (!customerForm.phone || customerForm.phone.length < 9) {
      return;
    }

    const handle = setTimeout(async () => {
      try {
        setLookupStatus('loading');
        const response = await fetch(`/api/customers?phone=${encodeURIComponent(customerForm.phone)}`);

        if (!response.ok) {
          setLookupStatus('not-found');
          return;
        }

        const data = await response.json();
        const customer: CustomerLookupResult | undefined = data?.customer;

        if (!customer) {
          setLookupStatus('not-found');
          return;
        }

        setCustomerId(customer._id || '');
        setCustomerForm((prev) => ({
          ...prev,
          firstName: customer.firstName,
          lastName: customer.lastName,
          email: customer.email,
          addressMode: customer.addresses.length > 0 ? 'existing' : 'new',
          selectedAddressId: customer.addresses[0]?.id || '',
        }));

        setCustomerAddresses(customer.addresses || []);
        setLookupStatus('found');
      } catch (error) {
        setLookupStatus('error');
      }
    }, 500);

    return () => clearTimeout(handle);
  }, [customerForm.phone]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-800">Create New Order</h1>
        <p className="text-gray-600 mt-2">Follow the steps below to place a new order</p>
      </div>

      <OrderTabsNav
        activeTab={activeTab}
        onTabChange={setActiveTab}
        canAccessTab={canAccessTab}
      />

      {isLoading && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center text-blue-700">
          Loading products and shapes...
        </div>
      )}

      {!isLoading && activeTab === 'customer' && (
        <div className="space-y-6">
          <CustomerDeliveryTab
            form={customerForm}
            setForm={setCustomerForm}
            addresses={customerAddresses}
            lookupStatus={lookupStatus}
          />

          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleNextFromCustomer}
              disabled={!isCustomerTabValid || isCreatingCustomer || isSavingAddress}
              className="bg-gradient-to-r from-gray-800 to-gray-900 text-white py-2 px-6 rounded-md hover:from-gray-900 hover:to-black disabled:opacity-50 transition-all font-medium shadow-sm"
            >
              {isCreatingCustomer ? 'Saving...' : isSavingAddress ? 'Saving Address...' : 'Next'}
            </button>
          </div>
        </div>
      )}

      {!isLoading && activeTab === 'order' && (
        <OrderItemsTab
          items={orderItems}
          setItems={setOrderItems}
          productTypes={productTypes}
          cakeShapes={cakeShapes}
          customerId={customerId}
          deliveryAddressId={selectedDeliveryAddressId}
        />
      )}
    </div>
  );
}
