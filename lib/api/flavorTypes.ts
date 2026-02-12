export interface FlavorType {
  _id: string;
  name: string;
  description: string;
  isActive: boolean;
  sortOrder: number;
  hasExtraPrice: boolean;
  extraPricePerUnit?: number;
  extraPricePerKg?: number;
}

export interface FlavorTypeInput {
  name: string;
  description: string;
  isActive: boolean;
  hasExtraPrice: boolean;
  extraPricePerUnit?: number;
  extraPricePerKg?: number;
}

interface FlavorTypesResponse {
  success: boolean;
  flavors: FlavorType[];
  message?: string;
}

interface FlavorTypeResponse {
  success: boolean;
  flavor?: FlavorType;
  message?: string;
}

// Fetch all flavor types
export async function fetchFlavorTypes(): Promise<FlavorType[]> {
  const response = await fetch('/api/flavor-type');

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data: FlavorTypesResponse = await response.json();

  if (!data.success) {
    throw new Error(data.message || 'Failed to fetch flavor types');
  }

  return data.flavors;
}

// Create new flavor type
export async function createFlavorType(formData: FlavorTypeInput): Promise<FlavorType> {
  const response = await fetch('/api/flavor-type', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(formData),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data: FlavorTypeResponse = await response.json();

  if (!data.success || !data.flavor) {
    throw new Error(data.message || 'Failed to create flavor type');
  }

  return data.flavor;
}

// Update flavor type
export async function updateFlavorType(id: string, formData: FlavorTypeInput): Promise<FlavorType> {
  const response = await fetch(`/api/flavor-type/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(formData),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data: FlavorTypeResponse = await response.json();

  if (!data.success || !data.flavor) {
    throw new Error(data.message || 'Failed to update flavor type');
  }

  return data.flavor;
}

// Delete flavor type
export async function deleteFlavorType(id: string): Promise<void> {
  const response = await fetch(`/api/flavor-type/${id}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = await response.json();

  if (!data.success) {
    throw new Error(data.message || 'Failed to delete flavor type');
  }
}
