'use client';

import { useQuery } from '@tanstack/react-query';
import { ProductTypeForm as ProductTypeFormData } from './ProductTypesTab';
import { CakeShape } from '@/lib/api/cakeShapes';
import Checkbox from '../ui/Checkbox';
import { fetchComplexityThresholdSettings } from '@/lib/api/settings';
import {
  DEFAULT_COMPLEXITY_THRESHOLDS,
  classifyComplexityFromMinutes,
  getComplexityRanges,
} from '@/lib/complexity';

interface ProductTypeEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  form: ProductTypeFormData;
  setForm: (form: ProductTypeFormData) => void;
  onSubmit: (e: React.FormEvent) => void;
  isPending: boolean;
  cakeShapes?: CakeShape[];
}

const OVERSIZE_MINUTE_OPTIONS = [10, 20, 30, 40, 60] as const;

export default function ProductTypeEditModal({
  isOpen,
  onClose,
  form,
  setForm,
  onSubmit,
  isPending,
  cakeShapes = [],
}: ProductTypeEditModalProps) {
  const hasShapes = cakeShapes && cakeShapes.length > 0;
  const isShapeCheckboxDisabled = !hasShapes;
  const effectivePricingMethod = form.pricingMethod === 'perkg' ? 'perkg' : 'perunit';
  const derivedMeasurementType = effectivePricingMethod === 'perkg' ? 'weight' : 'quantity';

  const toOptionalFloat = (value: string) => {
    if (!value.trim()) return undefined;
    const parsed = parseFloat(value);
    return Number.isNaN(parsed) ? undefined : parsed;
  };

  const toOptionalInt = (value: string) => {
    if (!value.trim()) return undefined;
    const parsed = parseInt(value, 10);
    return Number.isNaN(parsed) ? undefined : parsed;
  };

  const toNonNegativeInt = (value: string) => {
    const parsed = parseInt(value, 10);
    if (Number.isNaN(parsed) || parsed < 0) {
      return 0;
    }

    return parsed;
  };

  const baseTotalMinutes =
    (form.bake_time_minutes || 0)
    + (form.fill_time_minutes || 0)
    + (form.decoration_time_minutes || 0)
    + (form.rest_time_minutes || 0);

  const { data: thresholdSettings } = useQuery({
    queryKey: ['complexity-threshold-settings'],
    queryFn: fetchComplexityThresholdSettings,
    staleTime: 5 * 60 * 1000,
  });

  const activeThresholds = thresholdSettings || DEFAULT_COMPLEXITY_THRESHOLDS;
  const baseComplexity = classifyComplexityFromMinutes(baseTotalMinutes, activeThresholds);
  const baseComplexityLabel = baseComplexity || 'Not set';
  const complexityClass =
    baseComplexityLabel === 'Hard'
      ? 'bg-red-100 text-red-800'
      : baseComplexityLabel === 'Low'
        ? 'bg-green-100 text-green-800'
        : baseComplexityLabel === 'Medium'
          ? 'bg-yellow-100 text-yellow-800'
          : 'bg-gray-100 text-gray-700';
  const complexityRanges = getComplexityRanges(activeThresholds).map((item) => ({
    ...item,
    isActive: item.level === baseComplexityLabel,
  }));

  const baseQuantityForOversizeRule = form.base_quantity ?? form.minQuantity;
  const quantityThresholdForOversizeRule = typeof baseQuantityForOversizeRule === 'number' && baseQuantityForOversizeRule > 0
    ? baseQuantityForOversizeRule * 2
    : undefined;
  const baseWeightForOversizeRule = form.base_weight ?? form.minWeight;
  const weightThresholdForOversizeRule = typeof baseWeightForOversizeRule === 'number' && baseWeightForOversizeRule > 0
    ? baseWeightForOversizeRule * 2
    : undefined;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <h3 className="text-xl font-bold mb-4">Edit Product Type</h3>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Name *</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-admin-primary focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Pricing Method *</label>
              <select
                value={effectivePricingMethod}
                onChange={(e) => {
                  const pricingMethod = e.target.value as 'perunit' | 'perkg';
                  const syncedWeight = form.minWeight ?? form.base_weight ?? 1;
                  setForm({
                    ...form,
                    pricingMethod,
                    measurement_type: pricingMethod === 'perkg' ? 'weight' : 'quantity',
                    minQuantity: pricingMethod === 'perunit' ? (form.base_quantity ?? form.minQuantity ?? 1) : form.minQuantity,
                    minWeight: pricingMethod === 'perkg' ? syncedWeight : form.minWeight,
                    base_weight: pricingMethod === 'perkg' ? syncedWeight : undefined,
                    unitPrice: pricingMethod === 'perunit' ? form.unitPrice : undefined,
                    pricePerKg: pricingMethod === 'perkg' ? form.pricePerKg : undefined,
                  });
                }}
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-admin-primary focus:outline-none"
              >
                <option value="perunit">Per Unit</option>
                <option value="perkg">Per Kg</option>
              </select>
            </div>
          </div>

          {effectivePricingMethod === 'perunit' && (
            <div className="grid grid-cols-4 gap-4">
              <div>
                <label className="block min-h-10 text-sm font-semibold text-gray-700 mb-2 leading-tight">Unit Price *</label>
                <input
                  type="number"
                  step="0.01"
                  value={form.unitPrice || ''}
                  onChange={(e) => setForm({ ...form, unitPrice: toOptionalFloat(e.target.value) })}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-admin-primary focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="block min-h-10 text-sm font-semibold text-gray-700 mb-2 leading-tight">Min Quantity</label>
                <input
                  type="number"
                  value={derivedMeasurementType === 'quantity' ? (form.base_quantity || '') : (form.minQuantity || '')}
                  onChange={(e) => {
                    const minQuantity = toOptionalInt(e.target.value);
                    setForm({
                      ...form,
                      minQuantity,
                      base_quantity: derivedMeasurementType === 'quantity' ? minQuantity : form.base_quantity,
                    });
                  }}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-admin-primary focus:outline-none"
                />
              </div>
              <div>
                <label className="block min-h-10 text-sm font-semibold text-gray-700 mb-2 leading-tight">Max Quantity</label>
                <input
                  type="number"
                  value={form.maxQuantity || ''}
                  onChange={(e) => setForm({ ...form, maxQuantity: toOptionalInt(e.target.value) })}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-admin-primary focus:outline-none"
                />
              </div>
              <div>
                <label className="block min-h-10 text-sm font-semibold text-gray-700 mb-2 leading-tight">Extra Minutes / Unit (Oversize)</label>
                <select
                  value={form.oversizeQuantityExtraMinutesPerUnit ?? ''}
                  onChange={(e) => {
                    const parsed = toOptionalInt(e.target.value);
                    setForm({
                      ...form,
                      oversizeQuantityExtraMinutesPerUnit: parsed === undefined ? undefined : Math.max(parsed, 0),
                    });
                  }}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-admin-primary focus:outline-none"
                >
                  {OVERSIZE_MINUTE_OPTIONS.map((option) => (
                    <option key={option} value={option}>{`+${option}m`}</option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">Applied per extra unit above 2x base quantity.</p>
              </div>
            </div>
          )}

          {effectivePricingMethod === 'perkg' && (
            <div className="grid grid-cols-4 gap-4">
              <div>
                <label className="block min-h-10 text-sm font-semibold text-gray-700 mb-2 leading-tight">Price Per Kg *</label>
                <input
                  type="number"
                  step="0.01"
                  value={form.pricePerKg || ''}
                  onChange={(e) => setForm({ ...form, pricePerKg: toOptionalFloat(e.target.value) })}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-admin-primary focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="block min-h-10 text-sm font-semibold text-gray-700 mb-2 leading-tight">Min Weight (kg)</label>
                <input
                  type="number"
                  step="0.01"
                  value={form.minWeight || ''}
                  onChange={(e) => {
                    const minWeight = toOptionalFloat(e.target.value);
                    setForm({
                      ...form,
                      minWeight,
                      base_weight: derivedMeasurementType === 'weight' ? minWeight : form.base_weight,
                    });
                  }}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-admin-primary focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="block min-h-10 text-sm font-semibold text-gray-700 mb-2 leading-tight">Max Weight (kg)</label>
                <input
                  type="number"
                  step="0.01"
                  value={form.maxWeight || ''}
                  onChange={(e) => setForm({ ...form, maxWeight: toOptionalFloat(e.target.value) })}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-admin-primary focus:outline-none"
                />
              </div>
              <div>
                <label className="block min-h-10 text-sm font-semibold text-gray-700 mb-2 leading-tight">Extra Minutes (Oversize)</label>
                <select
                  value={form.oversizeWeightExtraMinutes ?? ''}
                  onChange={(e) => {
                    const parsed = toOptionalInt(e.target.value);
                    setForm({
                      ...form,
                      oversizeWeightExtraMinutes: parsed === undefined ? undefined : Math.max(parsed, 0),
                    });
                  }}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-admin-primary focus:outline-none"
                >
                  {OVERSIZE_MINUTE_OPTIONS.map((option) => (
                    <option key={option} value={option}>{`+${option}m`}</option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">Applied above 2x base weight.</p>
              </div>
            </div>
          )}

          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900 space-y-1">
            <p className="font-semibold">Oversize Rule Preview</p>
            {effectivePricingMethod === 'perunit' ? (
              <>
                <p>Oversize applies only when order quantity is greater than 2x base quantity.</p>
                <p>At exactly 2x, no oversize minutes are added.</p>
                <p>Formula: ceil(order quantity - (2 * base quantity)) * selected extra minutes.</p>
                {typeof quantityThresholdForOversizeRule === 'number' && (
                  <p>Current threshold: order quantity must be greater than {quantityThresholdForOversizeRule} units.</p>
                )}
              </>
            ) : (
              <>
                <p>Oversize applies only when order weight is greater than 2x base weight.</p>
                <p>At exactly 2x, no oversize minutes are added.</p>
                <p>Formula: add selected extra minutes once when weight is above threshold.</p>
                {typeof weightThresholdForOversizeRule === 'number' && (
                  <p>Current threshold: order weight must be greater than {weightThresholdForOversizeRule} kg.</p>
                )}
              </>
            )}
          </div>

          <div className="border border-gray-200 rounded-lg p-4 space-y-3">
            <h4 className="text-sm font-semibold text-gray-800">Production Time Measurement Basis</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block min-h-10 text-sm font-semibold text-gray-700 mb-2 leading-tight">Time Measurement Type (auto from pricing method)</label>
                <input
                  type="text"
                  value={derivedMeasurementType === 'weight' ? 'Weight' : 'Quantity'}
                  readOnly
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg bg-gray-50 text-gray-700"
                />
              </div>

              {derivedMeasurementType === 'weight' ? (
                <div>
                  <label className="block min-h-10 text-sm font-semibold text-gray-700 mb-2 leading-tight">Base Weight (kg) (auto from Min Weight)</label>
                  <input
                    type="text"
                    value={form.minWeight ?? form.base_weight ?? ''}
                    readOnly
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg bg-gray-50 text-gray-700"
                  />
                </div>
              ) : (
                <div>
                  <label className="block min-h-10 text-sm font-semibold text-gray-700 mb-2 leading-tight">Base Quantity *</label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={form.base_quantity || ''}
                    onChange={(e) => {
                      const base_quantity = toOptionalInt(e.target.value);
                      setForm({
                        ...form,
                        base_quantity,
                        minQuantity: base_quantity,
                      });
                    }}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-admin-primary focus:outline-none"
                    required
                  />
                </div>
              )}
            </div>

            <p className="text-xs text-gray-600">
              {derivedMeasurementType === 'weight'
                ? 'Times below are fixed base-stage minutes for the base weight. Additional oversize minutes are handled by the oversize rule.'
                : 'Times below are fixed base-stage minutes for the base quantity. Additional oversize minutes are handled by the oversize rule.'}
            </p>
          </div>

          <div className="border border-gray-200 rounded-lg p-4 space-y-4">
            <h4 className="text-sm font-semibold text-gray-800">Production Time (minutes)</h4>

            <div className="rounded-md border border-gray-200 bg-gray-50 p-3">
              <p className="text-xs text-gray-600">Base total time: <span className="font-semibold text-gray-800">{baseTotalMinutes}m</span></p>
              <p className="text-xs text-gray-700 mt-1">
                Suggested complexity:{' '}
                <span className={`inline-block px-2 py-0.5 rounded-full font-semibold ${complexityClass}`}>
                  {baseComplexityLabel}
                </span>
              </p>
              <p className="text-xs text-gray-500 mt-1">
                This is guidance based on base production minutes and helps standardize planning.
              </p>

              <div className="mt-3 grid grid-cols-1 md:grid-cols-4 gap-2">
                {complexityRanges.map((item) => (
                  <div
                    key={item.level}
                    className={`rounded-md border px-2 py-2 text-xs ${item.isActive ? 'border-black bg-white text-gray-900' : 'border-gray-200 bg-gray-50 text-gray-600'}`}
                  >
                    <p className="font-semibold">{item.level}</p>
                    <p>{item.range}</p>
                  </div>
                ))}
              </div>
              <p className="text-[11px] text-gray-500 mt-1">Current complexity range is highlighted.</p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Bake Time</label>
              <input
                type="number"
                min="0"
                step="1"
                value={form.bake_time_minutes}
                onChange={(e) => setForm({ ...form, bake_time_minutes: toNonNegativeInt(e.target.value) })}
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-admin-primary focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Fill Time</label>
              <input
                type="number"
                min="0"
                step="1"
                value={form.fill_time_minutes}
                onChange={(e) => setForm({ ...form, fill_time_minutes: toNonNegativeInt(e.target.value) })}
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-admin-primary focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Decoration Time</label>
              <input
                type="number"
                min="0"
                step="1"
                value={form.decoration_time_minutes}
                onChange={(e) => setForm({ ...form, decoration_time_minutes: toNonNegativeInt(e.target.value) })}
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-admin-primary focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Rest Time</label>
              <input
                type="number"
                min="0"
                step="1"
                value={form.rest_time_minutes}
                onChange={(e) => setForm({ ...form, rest_time_minutes: toNonNegativeInt(e.target.value) })}
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-admin-primary focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-admin-primary focus:outline-none"
              rows={2}
            />
          </div>

          <Checkbox
            label="Available in Multiple Cake Shapes"
            checked={form.hasMultipleShapes || false}
            onChange={(checked) => {
              // Only allow checking if shapes exist
              if (checked && !hasShapes) {
                return;
              }
              setForm({ ...form, hasMultipleShapes: checked, shapeIds: checked ? (form.shapeIds || []) : [] });
            }}
            disabled={isShapeCheckboxDisabled}
          />

          {/* Warning message if no shapes exist */}
          {isShapeCheckboxDisabled && (
            <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded">
              <p className="text-sm text-blue-800">
                <span className="font-semibold">📢 No cake shapes available:</span> Please add at least one cake shape first in the Cake Shapes tab before you can assign shapes to products.
              </p>
            </div>
          )}

          {/* Cake Shapes Selection - Only show if checkbox is checked */}
          {form.hasMultipleShapes && cakeShapes && cakeShapes.length > 0 && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">Select Available Shapes</label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {cakeShapes.map((shape) => (
                  <label key={shape._id} className="flex items-center gap-2 cursor-pointer p-2 hover:bg-gray-50 rounded-lg border border-gray-200">
                    <input
                      type="checkbox"
                      checked={(form.shapeIds || []).includes(shape._id)}
                      onChange={(e) => {
                        const shapeIds = form.shapeIds || [];
                        if (e.target.checked) {
                          setForm({ ...form, shapeIds: [...shapeIds, shape._id] });
                        } else {
                          setForm({ ...form, shapeIds: shapeIds.filter((id) => id !== shape._id) });
                        }
                      }}
                      className="w-4 h-4 rounded accent-black focus:ring-black"
                    />
                    <span className="text-sm font-medium text-gray-700">{shape.name}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <Checkbox
            label="Active"
            checked={form.isActive}
            onChange={(checked) => setForm({ ...form, isActive: checked })}
          />

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 bg-linear-to-r from-gray-800 to-gray-900 text-white py-2 rounded-lg hover:from-gray-900 hover:to-black disabled:opacity-50 transition-all font-semibold"
            >
              {isPending ? 'Updating...' : 'Update Product Type'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 transition-all font-semibold"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
