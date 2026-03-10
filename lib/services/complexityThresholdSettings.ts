import ComplexityThresholdSettings from '@/lib/models/complexityThresholdSettings';
import {
  DEFAULT_COMPLEXITY_THRESHOLDS,
  normalizeComplexityThresholds,
  type ComplexityThresholds,
} from '@/lib/complexity';

export async function getComplexityThresholdSettings(): Promise<ComplexityThresholds> {
  const document = await ComplexityThresholdSettings.findOne({ key: 'global' }).lean();

  if (!document) {
    return DEFAULT_COMPLEXITY_THRESHOLDS;
  }

  return normalizeComplexityThresholds({
    lowMaxMinutes: document.lowMaxMinutes,
    mediumMaxMinutes: document.mediumMaxMinutes,
  });
}
