export type ComplexityLevel = 'Low' | 'Medium' | 'Hard';
export type ComplexityLevelWithNotSet = ComplexityLevel | 'Not set';

export interface ComplexityThresholds {
  lowMaxMinutes: number;
  mediumMaxMinutes: number;
}

export const DEFAULT_COMPLEXITY_THRESHOLDS: ComplexityThresholds = {
  lowMaxMinutes: 120,
  mediumMaxMinutes: 300,
};

export function normalizeComplexityThresholds(
  input?: Partial<ComplexityThresholds> | null
): ComplexityThresholds {
  const lowRaw = Number(input?.lowMaxMinutes);
  const mediumRaw = Number(input?.mediumMaxMinutes);

  const lowMaxMinutes = Number.isFinite(lowRaw) && lowRaw > 0
    ? Math.floor(lowRaw)
    : DEFAULT_COMPLEXITY_THRESHOLDS.lowMaxMinutes;

  const mediumCandidate = Number.isFinite(mediumRaw)
    ? Math.floor(mediumRaw)
    : DEFAULT_COMPLEXITY_THRESHOLDS.mediumMaxMinutes;

  const mediumMaxMinutes = mediumCandidate > lowMaxMinutes
    ? mediumCandidate
    : Math.max(lowMaxMinutes + 1, DEFAULT_COMPLEXITY_THRESHOLDS.mediumMaxMinutes);

  return { lowMaxMinutes, mediumMaxMinutes };
}

export function classifyComplexityFromMinutes(
  minutes?: number,
  thresholds: ComplexityThresholds = DEFAULT_COMPLEXITY_THRESHOLDS
): ComplexityLevel | undefined {
  if (typeof minutes !== 'number' || minutes <= 0) {
    return undefined;
  }

  if (minutes < thresholds.lowMaxMinutes) {
    return 'Low';
  }

  if (minutes <= thresholds.mediumMaxMinutes) {
    return 'Medium';
  }

  return 'Hard';
}

function formatBoundaryMinutes(minutes: number): string {
  const rounded = Math.max(1, Math.round(minutes));
  const hours = Math.floor(rounded / 60);
  const remainder = rounded % 60;

  if (hours === 0) {
    return `${rounded}m`;
  }

  if (remainder === 0) {
    return `${hours}h`;
  }

  return `${hours}h ${remainder}m`;
}

export function getComplexityRanges(thresholds: ComplexityThresholds) {
  return [
    { level: 'Not set' as const, range: '0m' },
    { level: 'Low' as const, range: `<${formatBoundaryMinutes(thresholds.lowMaxMinutes)}` },
    {
      level: 'Medium' as const,
      range: `${formatBoundaryMinutes(thresholds.lowMaxMinutes)} - ${formatBoundaryMinutes(thresholds.mediumMaxMinutes)}`,
    },
    { level: 'Hard' as const, range: `>${formatBoundaryMinutes(thresholds.mediumMaxMinutes)}` },
  ];
}
