export interface CustomerListItem {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  notes?: string;
  addressCount: number;
  createdAt: string;
}

export interface CustomerAddress {
  id: string;
  label?: string;
  line1: string;
  line2?: string;
  city: string;
  state?: string;
  postalCode: string;
  notes?: string;
}

export interface CustomerDetail {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  notes?: string;
  addresses: CustomerAddress[];
}

interface CustomersResponse {
  success: boolean;
  customers?: CustomerListItem[];
  message?: string;
}

interface CustomerResponse {
  success: boolean;
  customer?: CustomerDetail;
  message?: string;
}

interface CustomerMutationResponse {
  success: boolean;
  customer?: CustomerDetail;
  message?: string;
}

export async function fetchCustomers(): Promise<CustomerListItem[]> {
  const response = await fetch('/api/customers');

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data: CustomersResponse = await response.json();

  if (!data.success || !data.customers) {
    throw new Error(data.message || 'Failed to fetch customers');
  }

  return data.customers;
}

export async function fetchCustomerById(id: string): Promise<CustomerDetail> {
  const response = await fetch(`/api/customers/${id}`);

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data: CustomerResponse = await response.json();

  if (!data.success || !data.customer) {
    throw new Error(data.message || 'Failed to fetch customer');
  }

  return data.customer;
}

export async function updateCustomer(id: string, payload: Omit<CustomerDetail, 'addresses' | '_id'>): Promise<CustomerDetail> {
  const response = await fetch(`/api/customers/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json();
    if (errorData.errors && Array.isArray(errorData.errors)) {
      throw new Error(errorData.errors.join(', '));
    }
    throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
  }

  const data: CustomerMutationResponse = await response.json();

  if (!data.success || !data.customer) {
    throw new Error(data.message || 'Failed to update customer');
  }

  return data.customer;
}

export async function deleteCustomer(id: string): Promise<void> {
  const response = await fetch(`/api/customers/${id}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
  }
}

export async function updateCustomerAddress(
  customerId: string,
  addressId: string,
  payload: Omit<CustomerAddress, 'id'>
): Promise<CustomerDetail> {
  const response = await fetch(`/api/customers/${customerId}/addresses/${addressId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json();
    if (errorData.errors && Array.isArray(errorData.errors)) {
      throw new Error(errorData.errors.join(', '));
    }
    throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
  }

  const data: CustomerMutationResponse = await response.json();

  if (!data.success || !data.customer) {
    throw new Error(data.message || 'Failed to update address');
  }

  return data.customer;
}

export async function deleteCustomerAddress(customerId: string, addressId: string): Promise<CustomerDetail> {
  const response = await fetch(`/api/customers/${customerId}/addresses/${addressId}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
  }

  const data: CustomerMutationResponse = await response.json();

  if (!data.success || !data.customer) {
    throw new Error(data.message || 'Failed to delete address');
  }

  return data.customer;
}
