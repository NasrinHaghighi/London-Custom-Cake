import {
  DEFAULT_COMPLEXITY_THRESHOLDS,
  normalizeComplexityThresholds,
  type ComplexityThresholds,
} from '@/lib/complexity';

interface ComplexityThresholdResponse {
  success: boolean;
  thresholds?: ComplexityThresholds;
  message?: string;
  errors?: string[];
}

export async function fetchComplexityThresholdSettings(): Promise<ComplexityThresholds> {
  const response = await fetch('/api/settings/complexity-threshold', { credentials: 'include' });
  const data: ComplexityThresholdResponse = await response.json();

  if (!response.ok || !data.success) {
    if (Array.isArray(data.errors) && data.errors.length > 0) {
      throw new Error(data.errors.join(', '));
    }
    throw new Error(data.message || 'Failed to fetch complexity thresholds');
  }

  return normalizeComplexityThresholds(data.thresholds || DEFAULT_COMPLEXITY_THRESHOLDS);
}

export async function updateComplexityThresholdSettings(payload: ComplexityThresholds): Promise<ComplexityThresholds> {
  const response = await fetch('/api/settings/complexity-threshold', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(payload),
  });

  const data: ComplexityThresholdResponse = await response.json();

  if (!response.ok || !data.success || !data.thresholds) {
    if (Array.isArray(data.errors) && data.errors.length > 0) {
      throw new Error(data.errors.join(', '));
    }
    throw new Error(data.message || 'Failed to update complexity thresholds');
  }

  return normalizeComplexityThresholds(data.thresholds);
}
