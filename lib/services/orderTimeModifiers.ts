export type DecorationComplexity = 'none' | 'simple' | 'detailed' | 'premium';
export type TextType = 'none' | 'buttercream' | 'fondantLetters' | 'chocolatePiping';

export const DECORATION_COMPLEXITY_EXTRA_MINUTES: Record<DecorationComplexity, number> = {
  none: 0,
  simple: 10,
  detailed: 25,
  premium: 45,
};

export const TEXT_TYPE_EXTRA_MINUTES: Record<Exclude<TextType, 'fondantLetters'>, number> & { fondantLetters: { min: number; max: number } } = {
  none: 0,
  buttercream: 5,
  fondantLetters: { min: 15, max: 25 },
  chocolatePiping: 10,
};

export function normalizeDecorationComplexity(value?: string | null): DecorationComplexity {
  if (value === 'simple' || value === 'detailed' || value === 'premium') {
    return value;
  }

  return 'none';
}

export function normalizeTextType(value?: string | null): TextType {
  if (value === 'buttercream' || value === 'fondantLetters' || value === 'chocolatePiping') {
    return value;
  }

  return 'none';
}

export function getDecorationExtraMinutes(
  decorationComplexity?: string | null,
  customDecorations?: string | null
): { decorationComplexity: DecorationComplexity; decorationExtraMinutes: number } {
  const normalizedDecorationComplexity = normalizeDecorationComplexity(decorationComplexity);
  const hasCustomDecorationText = Boolean(customDecorations?.trim());

  // If user added decoration notes but no explicit complexity was selected,
  // apply a simple decoration baseline to avoid underestimating prep time.
  if (normalizedDecorationComplexity === 'none' && hasCustomDecorationText) {
    return {
      decorationComplexity: 'simple',
      decorationExtraMinutes: DECORATION_COMPLEXITY_EXTRA_MINUTES.simple,
    };
  }

  return {
    decorationComplexity: normalizedDecorationComplexity,
    decorationExtraMinutes: DECORATION_COMPLEXITY_EXTRA_MINUTES[normalizedDecorationComplexity],
  };
}

export function calculateItemProductionTimeWithModifiers(
  baseProductionMinutes: number,
  options?: {
    decorationComplexity?: string | null;
    customDecorations?: string | null;
    textType?: string | null;
    customTextMessage?: string | null;
    pricingMethod?: string | null;
    baseWeight?: number | null;
    orderWeight?: number | null;
    baseQuantity?: number | null;
    orderQuantity?: number | null;
    oversizeWeightExtraMinutes?: number | null;
    oversizeQuantityExtraMinutesPerUnit?: number | null;
  }
) {
  const safeBaseMinutes = Math.max(0, Math.round(baseProductionMinutes || 0));
  const { decorationComplexity, decorationExtraMinutes } = getDecorationExtraMinutes(
    options?.decorationComplexity,
    options?.customDecorations
  );
  const normalizedTextType = normalizeTextType(options?.textType);
  const hasCustomTextMessage = Boolean(options?.customTextMessage?.trim());

  const effectiveTextType = normalizedTextType === 'none' && hasCustomTextMessage
    ? 'buttercream'
    : normalizedTextType;

  let textExtraMinutes = 0;
  if (effectiveTextType === 'fondantLetters') {
    const textLength = options?.customTextMessage?.trim().length || 0;
    textExtraMinutes = textLength > 12
      ? TEXT_TYPE_EXTRA_MINUTES.fondantLetters.max
      : TEXT_TYPE_EXTRA_MINUTES.fondantLetters.min;
  } else {
    textExtraMinutes = TEXT_TYPE_EXTRA_MINUTES[effectiveTextType];
  }

  const isPerKg = options?.pricingMethod === 'perkg';
  const isPerUnit = options?.pricingMethod === 'perunit';
  const safeBaseWeight = Number(options?.baseWeight);
  const safeOrderWeight = Number(options?.orderWeight);
  const safeBaseQuantity = Number(options?.baseQuantity);
  const safeOrderQuantity = Number(options?.orderQuantity);
  const configuredOversizeWeightExtraMinutes = Number(options?.oversizeWeightExtraMinutes);
  const configuredOversizeQuantityExtraPerUnit = Number(options?.oversizeQuantityExtraMinutesPerUnit);
  const oversizeWeightExtraMinutes = Number.isFinite(configuredOversizeWeightExtraMinutes) && configuredOversizeWeightExtraMinutes >= 0
    ? Math.round(configuredOversizeWeightExtraMinutes)
    : 60;
  const oversizeQuantityExtraPerUnit = Number.isFinite(configuredOversizeQuantityExtraPerUnit) && configuredOversizeQuantityExtraPerUnit >= 0
    ? Math.round(configuredOversizeQuantityExtraPerUnit)
    : 30;

  let oversizeExtraMinutes = 0;
  if (
    isPerKg
    && Number.isFinite(safeBaseWeight)
    && Number.isFinite(safeOrderWeight)
    && safeBaseWeight > 0
    && safeOrderWeight > safeBaseWeight * 2
  ) {
    oversizeExtraMinutes = oversizeWeightExtraMinutes;
  }

  if (
    isPerUnit
    && Number.isFinite(safeBaseQuantity)
    && Number.isFinite(safeOrderQuantity)
    && safeBaseQuantity > 0
    && safeOrderQuantity > safeBaseQuantity * 2
  ) {
    const thresholdQuantity = safeBaseQuantity * 2;
    const extraUnits = Math.ceil(safeOrderQuantity - thresholdQuantity);
    oversizeExtraMinutes = extraUnits * oversizeQuantityExtraPerUnit;
  }

  return {
    baseProductionMinutes: safeBaseMinutes,
    decorationComplexity,
    decorationExtraMinutes,
    textType: effectiveTextType,
    textExtraMinutes,
    oversizeExtraMinutes,
    totalProductionMinutes: safeBaseMinutes + decorationExtraMinutes + textExtraMinutes + oversizeExtraMinutes,
  };
}
