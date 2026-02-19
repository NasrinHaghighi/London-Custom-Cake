export interface CakeShape {
  _id: string;
  name: string;
  description: string;
  isActive: boolean;
  sortOrder: number;
}

export interface CakeShapeInput {
  name: string;
  description: string;
  isActive: boolean;
  sortOrder?: number;
}

interface CakeShapesResponse {
  success: boolean;
  shapes: CakeShape[];
  message?: string;
}

interface CakeShapeResponse {
  success: boolean;
  shape?: CakeShape;
  message?: string;
}

// Fetch all cake shapes
export async function fetchCakeShapes(): Promise<CakeShape[]> {
  const response = await fetch('/api/cake-shape');

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data: CakeShapesResponse = await response.json();

  if (!data.success) {
    throw new Error(data.message || 'Failed to fetch cake shapes');
  }

  return data.shapes;
}

// Create new cake shape
export async function createCakeShape(formData: CakeShapeInput): Promise<CakeShape> {
  const response = await fetch('/api/cake-shape', {
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

  const data: CakeShapeResponse = await response.json();

  if (!data.success || !data.shape) {
    throw new Error(data.message || 'Failed to create cake shape');
  }

  return data.shape;
}

// Update existing cake shape
export async function updateCakeShape(id: string, formData: CakeShapeInput): Promise<CakeShape> {
  const response = await fetch(`/api/cake-shape/${id}`, {
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

  const data: CakeShapeResponse = await response.json();

  if (!data.success || !data.shape) {
    throw new Error(data.message || 'Failed to update cake shape');
  }

  return data.shape;
}

// Delete cake shape
export async function deleteCakeShape(id: string): Promise<void> {
  const response = await fetch(`/api/cake-shape/${id}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
  }
}
