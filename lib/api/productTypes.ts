export interface ProductType {
  _id: string;
  name: string;
  description: string;
  isActive: boolean;
  sortOrder: number;
  pricingMethod: 'perunit' | 'perkg';
  unitPrice?: number;
  minQuantity?: number;
  maxQuantity?: number;
  pricePerKg?: number;
  minWeight?: number;
  maxWeight?: number;
}

export interface ProductTypeInput {
  name: string;
  description: string;
  isActive: boolean;
  pricingMethod: 'perunit' | 'perkg';
  unitPrice?: number;
  minQuantity?: number;
  maxQuantity?: number;
  pricePerKg?: number;
  minWeight?: number;
  maxWeight?: number;
}

interface ProductTypesResponse {
  success: boolean;
  types: ProductType[];
  message?: string;
}

interface ProductTypeResponse {
  success: boolean;
  type?: ProductType;
  message?: string;
}

// Fetch all product types
export async function fetchProductTypes(): Promise<ProductType[]> {
  const response = await fetch('/api/product-type');

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data: ProductTypesResponse = await response.json();

  if (!data.success) {
    throw new Error(data.message || 'Failed to fetch product types');
  }

  return data.types;
}

// Create new product type
export async function createProductType(formData: ProductTypeInput): Promise<ProductType> {
  const response = await fetch('/api/product-type', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(formData),
  });

  if (!response.ok) {
    const errorData = await response.json();
    if (errorData.errors && Array.isArray(errorData.errors)) {
      throw new Error(errorData.errors.join(', '));
    }
    throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
  }

  const data: ProductTypeResponse = await response.json();

  if (!data.success || !data.type) {
    throw new Error(data.message || 'Failed to create product type');
  }

  return data.type;
}

// Update existing product type
export async function updateProductType(id: string, formData: ProductTypeInput): Promise<ProductType> {
  const response = await fetch(`/api/product-type/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(formData),
  });

  if (!response.ok) {
    const errorData = await response.json();
    if (errorData.errors && Array.isArray(errorData.errors)) {
      throw new Error(errorData.errors.join(', '));
    }
    throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
  }

  const data: ProductTypeResponse = await response.json();

  if (!data.success || !data.type) {
    throw new Error(data.message || 'Failed to update product type');
  }

  return data.type;
}

// Delete product type
export async function deleteProductType(id: string): Promise<void> {
  const response = await fetch(`/api/product-type/${id}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = await response.json();

  if (!data.success) {
    throw new Error(data.message || 'Failed to delete product type');
  }
}
