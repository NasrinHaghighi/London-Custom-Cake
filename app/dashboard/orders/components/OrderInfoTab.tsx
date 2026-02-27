'use client';

import { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { OrderItem } from '../types';
import { ProductType } from '@/lib/api/productTypes';
import { CakeShape } from '@/lib/api/cakeShapes';
import { DeliveryMethod } from '../types';
import OrderTabCustomerInfoSection, { Address, Customer } from './OrderTabCustomerInfoSection';
import { FlavorType } from '@/lib/api/flavorTypes';

interface CustomerApiResponse {
  success: boolean;
  customer: Customer;
}

interface FlavorTypesResponse {
  success: boolean;
  flavors: FlavorType[];
}

type RefIdValue = string | { _id?: string | { toString: () => string } } | { toString: () => string };

interface ProductFlavorCombination {
  productTypeId: RefIdValue;
  flavorId: RefIdValue;
  isAvailable: boolean;
}

interface ProductFlavorResponse {
  success: boolean;
  combinations: ProductFlavorCombination[];
}

interface ExistingOrderItem {
  productTypeName?: string;
  flavorName?: string;
  cakeShapeName?: string;
  quantity?: number;
  weight?: number;
}

interface ExistingOrder {
  _id: string;
  orderNumber: string;
  customerName?: string;
  deliveryMethod: DeliveryMethod;
  status: string;
  paymentStatus?: 'unpaid' | 'partial' | 'paid';
  totalAmount: number;
  orderDateTime: string;
  items?: ExistingOrderItem[];
}

interface OrdersResponse {
  success: boolean;
  total: number;
  orders: ExistingOrder[];
}

interface OrderDraft {
  productTypeId: string;
  flavorId: string;
  cakeShapeId: string;
  quantity: number;
  weight: number;
  specialInstructions: string;
}

const orderDateTimeFormatter = new Intl.DateTimeFormat('en-GB', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
  timeZone: 'UTC',
});

function formatOrderDateTime(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return '-';
  }
  return orderDateTimeFormatter.format(parsed);
}

function toDateInputValue(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatOrderItemLine(item: ExistingOrderItem): string {
  const quantityOrWeight = typeof item.quantity === 'number' && item.quantity > 0
    ? `${item.quantity}x`
    : `${item.weight || 0}kg`;
  const flavorPart = item.flavorName ? ` (${item.flavorName})` : '';
  const shapePart = item.cakeShapeName ? `, ${item.cakeShapeName}` : '';
  return `${quantityOrWeight} ${item.productTypeName || 'Product'}${flavorPart}${shapePart}`;
}

function getOrderStatusBadgeClass(status: string): string {
  const normalized = status.toLowerCase();
  if (normalized === 'completed' || normalized === 'ready') {
    return 'bg-green-100 text-green-700';
  }
  if (normalized === 'cancelled') {
    return 'bg-red-100 text-red-700';
  }
  if (normalized === 'confirmed' || normalized === 'in-progress') {
    return 'bg-blue-100 text-blue-700';
  }
  return 'bg-yellow-100 text-yellow-700';
}

function getPaymentStatusBadgeClass(status?: 'unpaid' | 'partial' | 'paid'): string {
  if (status === 'paid') {
    return 'bg-green-100 text-green-700';
  }
  if (status === 'partial') {
    return 'bg-yellow-100 text-yellow-700';
  }
  return 'bg-gray-100 text-gray-700';
}

function extractRefId(value: RefIdValue | null | undefined): string {
  if (!value) {
    return '';
  }

  if (typeof value === 'string') {
    return value;
  }

  if ('_id' in value && value._id) {
    return typeof value._id === 'string' ? value._id : value._id.toString();
  }

  return value.toString();
}

interface OrderItemsTabProps {
  items: OrderItem[];
  setItems: (items: OrderItem[]) => void;
  productTypes: ProductType[];
  cakeShapes: CakeShape[];
  customerId: string;
  deliveryAddressId: string;
  deliveryMethod: DeliveryMethod;
  onDeliveryMethodChange: (method: DeliveryMethod) => void;
  onDeliveryAddressChange: (addressId: string) => void;
  onOrderCreated: (order: {
    _id: string;
    orderNumber: string;
    totalAmount: number;
    paidAmount: number;
    paymentStatus: 'unpaid' | 'partial' | 'paid';
  }) => void;
  onManagePayment: (order: {
    _id: string;
    orderNumber: string;
    totalAmount: number;
    paymentStatus: 'unpaid' | 'partial' | 'paid';
  }) => void;
}

export default function OrderItemsTab({
  items,
  setItems,
  productTypes,
  cakeShapes,
  customerId,
  deliveryAddressId,
  deliveryMethod,
  onDeliveryMethodChange,
  onDeliveryAddressChange,
  onOrderCreated,
  onManagePayment
}: OrderItemsTabProps) {
  const queryClient = useQueryClient();
  const [orderDate, setOrderDate] = useState<string>('');
  const [orderHour, setOrderHour] = useState<string>('09');
  const [orderNotes, setOrderNotes] = useState<string>('');
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<string>('');
  const [submitError, setSubmitError] = useState<string>('');
  const [isPreviousOrdersCollapsed, setIsPreviousOrdersCollapsed] = useState(true);
  const [draft, setDraft] = useState<OrderDraft>({
    productTypeId: '',
    flavorId: '',
    cakeShapeId: '',
    quantity: 1,
    weight: 1,
    specialInstructions: '',
  });

  // Fetch customer data using React Query (5min stale time per architecture)
  const { data: customerData, isLoading: customerLoading, error: customerError } = useQuery<CustomerApiResponse>({
    queryKey: ['customer', customerId],
    queryFn: async () => {
      const response = await fetch(`/api/customers/${customerId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch customer');
      }
      const data = await response.json();
      return data;
    },
    enabled: !!customerId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes garbage collection
  });

  const { data: flavorData } = useQuery<FlavorTypesResponse>({
    queryKey: ['flavorTypes-for-order'],
    queryFn: async () => {
      const response = await fetch('/api/flavor-type');
      if (!response.ok) {
        throw new Error('Failed to fetch flavors');
      }
      return response.json();
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const { data: combinationData } = useQuery<ProductFlavorResponse>({
    queryKey: ['productFlavorCombinations-for-order'],
    queryFn: async () => {
      const response = await fetch('/api/product-flavor?isAvailable=true');
      if (!response.ok) {
        throw new Error('Failed to fetch product-flavor combinations');
      }
      return response.json();
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const { data: previousOrdersData, isLoading: previousOrdersLoading } = useQuery<OrdersResponse>({
    queryKey: ['orders-by-customer', customerId],
    queryFn: async () => {
      const response = await fetch(`/api/orders?customerId=${customerId}&limit=5&page=1`);
      if (!response.ok) {
        throw new Error('Failed to fetch previous orders');
      }
      return response.json();
    },
    enabled: !!customerId,
    staleTime: 60 * 1000,
  });

  const customer = customerData?.customer;
  const deliveryAddress = customer?.addresses?.find((addr: Address) => addr.id === deliveryAddressId);
  const flavors = flavorData?.flavors || [];
  const previousOrders = previousOrdersData?.orders || [];
  const hasPreviousOrders = (previousOrdersData?.total || 0) > 0;
  const availableHours = useMemo(
    () => Array.from({ length: 12 }, (_, index) => (index + 9).toString().padStart(2, '0')),
    []
  );
  const minimumOrderDate = useMemo(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return toDateInputValue(tomorrow);
  }, []);

  const selectedProductType = productTypes.find((p) => p._id === draft.productTypeId);
  const selectedFlavor = flavors.find((f) => f._id === draft.flavorId);
  const requiresShapeSelection = Boolean(selectedProductType && (selectedProductType.shapeIds?.length || 0) > 0);

  const availableFlavorIds = useMemo(() => {
    if (!draft.productTypeId) {
      return [] as string[];
    }

    const combinations = combinationData?.combinations || [];
    return combinations
      .filter((combination) => {
        const productId = extractRefId(combination.productTypeId);
        return productId === draft.productTypeId && combination.isAvailable;
      })
      .map((combination) => extractRefId(combination.flavorId));
  }, [combinationData?.combinations, draft.productTypeId]);

  const availableFlavors = flavors.filter((flavor) => availableFlavorIds.includes(flavor._id));
  const availableShapes = useMemo(() => {
    if (!selectedProductType) {
      return [] as CakeShape[];
    }

    const shapeIds = selectedProductType.shapeIds || [];
    if (!shapeIds.length) {
      return [] as CakeShape[];
    }

    const normalizedShapeIds = new Set(shapeIds.map((shapeId) => String(shapeId)));
    return cakeShapes.filter((shape) => normalizedShapeIds.has(shape._id));
  }, [cakeShapes, selectedProductType]);

  const draftLineTotal = useMemo(() => {
    if (!selectedProductType) {
      return 0;
    }

    const isPerUnit = selectedProductType.pricingMethod === 'perunit';
    const basePrice = isPerUnit
      ? (selectedProductType.unitPrice || 0) * draft.quantity
      : (selectedProductType.pricePerKg || 0) * draft.weight;

    const extraPrice = selectedFlavor?.hasExtraPrice
      ? (isPerUnit ? (selectedFlavor.extraPricePerUnit || 0) * draft.quantity : (selectedFlavor.extraPricePerKg || 0) * draft.weight)
      : 0;

    return Math.round((basePrice + extraPrice) * 100) / 100;
  }, [selectedFlavor, selectedProductType, draft.quantity, draft.weight]);

  const subTotal = useMemo(
    () => Math.round(items.reduce((sum, item) => sum + (item.lineTotal || 0), 0) * 100) / 100,
    [items]
  );
  const loyaltyDiscount = hasPreviousOrders ? Math.round(subTotal * 0.1 * 100) / 100 : 0;
  const totalAmount = Math.max(Math.round((subTotal - loyaltyDiscount) * 100) / 100, 0);
  const minimumToConfirm = Math.round(totalAmount * 0.5 * 100) / 100;

  const canAddItem = Boolean(
    draft.productTypeId &&
    draft.flavorId &&
    (!requiresShapeSelection || draft.cakeShapeId) &&
    selectedProductType &&
    (selectedProductType.pricingMethod === 'perunit' ? draft.quantity > 0 : draft.weight > 0)
  );

  const draftConstraintError = useMemo(() => {
    if (!selectedProductType) {
      return '';
    }

    if (selectedProductType.pricingMethod === 'perunit') {
      const minQuantity = selectedProductType.minQuantity ?? 1;
      const maxQuantity = selectedProductType.maxQuantity;

      if (draft.quantity < minQuantity) {
        return `Quantity must be at least ${minQuantity} for ${selectedProductType.name}.`;
      }

      if (typeof maxQuantity === 'number' && draft.quantity > maxQuantity) {
        return `Quantity must be at most ${maxQuantity} for ${selectedProductType.name}.`;
      }

      return '';
    }

    const minWeight = selectedProductType.minWeight ?? 0.5;
    const maxWeight = selectedProductType.maxWeight;

    if (draft.weight < minWeight) {
      return `Weight must be at least ${minWeight}kg for ${selectedProductType.name}.`;
    }

    if (typeof maxWeight === 'number' && draft.weight > maxWeight) {
      return `Weight must be at most ${maxWeight}kg for ${selectedProductType.name}.`;
    }

    return '';
  }, [draft.quantity, draft.weight, selectedProductType]);

  const canAddValidItem = canAddItem && !draftConstraintError;

  const canSubmitOrder = Boolean(
    customerId &&
    items.length > 0 &&
    orderDate &&
    orderDate >= minimumOrderDate &&
    orderHour &&
    (deliveryMethod === 'pickup' || deliveryAddressId)
  );

  const handlePickupToggle = (checked: boolean) => {
    if (checked) {
      onDeliveryMethodChange('pickup');
      onDeliveryAddressChange('');
      return;
    }

    onDeliveryMethodChange('delivery');
    if (!deliveryAddressId && customer?.addresses?.length) {
      onDeliveryAddressChange(customer.addresses[0].id);
    }
  };

  const addItem = () => {
    if (!selectedProductType || !canAddValidItem) {
      return;
    }

    const isPerUnit = selectedProductType.pricingMethod === 'perunit';
    const newItem: OrderItem = {
      id: crypto.randomUUID(),
      productTypeId: draft.productTypeId,
      flavorId: draft.flavorId,
      cakeShapeId: requiresShapeSelection ? draft.cakeShapeId : undefined,
      quantity: isPerUnit ? draft.quantity : undefined,
      weight: isPerUnit ? undefined : draft.weight,
      specialInstructions: draft.specialInstructions,
      lineTotal: draftLineTotal,
    };

    setItems([...items, newItem]);
    setDraft({
      productTypeId: '',
      flavorId: '',
      cakeShapeId: '',
      quantity: 1,
      weight: 1,
      specialInstructions: '',
    });
  };

  const removeItem = (itemId: string) => {
    setItems(items.filter((item) => item.id !== itemId));
  };

  const getItemConstraintError = (item: OrderItem, index: number): string => {
    const product = productTypes.find((p) => p._id === item.productTypeId);
    const itemLabel = `Item ${index + 1}`;

    if (!product) {
      return `${itemLabel}: product type is invalid.`;
    }

    if (product.pricingMethod === 'perunit') {
      const quantity = item.quantity ?? 0;
      const minQuantity = product.minQuantity ?? 1;
      const maxQuantity = product.maxQuantity;

      if (quantity < minQuantity) {
        return `${itemLabel}: quantity must be at least ${minQuantity} for ${product.name}. Remove this item and add it again with a valid quantity.`;
      }

      if (typeof maxQuantity === 'number' && quantity > maxQuantity) {
        return `${itemLabel}: quantity must be at most ${maxQuantity} for ${product.name}. Remove this item and add it again with a valid quantity.`;
      }

      return '';
    }

    const weight = item.weight ?? 0;
    const minWeight = product.minWeight ?? 0.5;
    const maxWeight = product.maxWeight;

    if (weight < minWeight) {
      return `${itemLabel}: weight must be at least ${minWeight}kg for ${product.name}. Remove this item and add it again with a valid weight.`;
    }

    if (typeof maxWeight === 'number' && weight > maxWeight) {
      return `${itemLabel}: weight must be at most ${maxWeight}kg for ${product.name}. Remove this item and add it again with a valid weight.`;
    }

    return '';
  };

  const submitOrder = async () => {
    if (!canSubmitOrder) {
      if (orderDate && orderDate < minimumOrderDate) {
        setSubmitError('Order date must be tomorrow or later.');
      }
      return;
    }

    const invalidItemError = items
      .map((item, index) => getItemConstraintError(item, index))
      .find((error) => Boolean(error));

    if (invalidItemError) {
      setSubmitError(invalidItemError);
      setSubmitMessage('');
      return;
    }

    setIsSubmittingOrder(true);
    setSubmitError('');
    setSubmitMessage('');

    try {
      const payload = {
        customerId,
        deliveryMethod,
        deliveryAddressId: deliveryMethod === 'delivery' ? deliveryAddressId : undefined,
        orderDateTime: `${orderDate}T${orderHour}:00:00`,
        items: items.map((item) => ({
          productTypeId: item.productTypeId,
          flavorId: item.flavorId,
          cakeShapeId: item.cakeShapeId,
          quantity: item.quantity,
          weight: item.weight,
          specialInstructions: item.specialInstructions || '',
        })),
        notes: orderNotes,
      };

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok || !data?.success) {
        throw new Error(data?.message || 'Failed to create order');
      }

      setSubmitMessage(`Order created successfully: ${data.order.orderNumber}`);
      await queryClient.invalidateQueries({ queryKey: ['orders-by-customer', customerId] });
      onOrderCreated({
        _id: data.order._id,
        orderNumber: data.order.orderNumber,
        totalAmount: data.order.totalAmount,
        paidAmount: data.order.paidAmount,
        paymentStatus: data.order.paymentStatus,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create order';
      setSubmitError(message);
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
      <OrderTabCustomerInfoSection
        customerId={customerId}
        customer={customer}
        deliveryMethod={deliveryMethod}
        deliveryAddressId={deliveryAddressId}
        deliveryAddress={deliveryAddress}
        customerLoading={customerLoading}
        customerError={!!customerError}
        onPickupToggle={handlePickupToggle}
        onDeliveryAddressChange={onDeliveryAddressChange}
      />

      <div className="rounded-lg border border-gray-200 p-4 space-y-3">
        <button
          type="button"
          onClick={() => setIsPreviousOrdersCollapsed((prev) => !prev)}
          className="w-full flex items-center justify-between text-left"
        >
          <h3 className="font-semibold text-gray-800">Previous Orders</h3>
          <span
            className={`text-lg font-bold text-gray-700 transition-transform duration-200 ${isPreviousOrdersCollapsed ? 'rotate-0' : 'rotate-180'}`}
            aria-hidden="true"
          >
            ▾
          </span>
        </button>

        {!isPreviousOrdersCollapsed && (
          <>
            {previousOrdersLoading ? (
              <p className="text-sm text-gray-500">Loading previous orders...</p>
            ) : previousOrders.length === 0 ? (
              <p className="text-sm text-gray-500">No previous orders for this customer.</p>
            ) : (
              <div className="space-y-2">
                {previousOrders.map((order) => (
                  <div key={order._id} className="rounded border border-gray-200 bg-gray-50 px-3 py-3 text-sm space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-gray-800">{order.orderNumber}</p>
                        <p className="text-gray-600">{order.customerName || 'Customer'} • {formatOrderDateTime(order.orderDateTime)}</p>
                        <p className="text-gray-600 capitalize">{order.deliveryMethod}</p>
                      </div>
                      <div className="text-right">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${getOrderStatusBadgeClass(order.status)}`}>
                          {order.status}
                        </span>
                        <div className="mt-1">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${getPaymentStatusBadgeClass(order.paymentStatus)}`}>
                            payment: {order.paymentStatus || 'unpaid'}
                          </span>
                        </div>
                        <p className="font-semibold text-gray-800 mt-1">{order.totalAmount.toFixed(2)}</p>
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => onManagePayment({
                          _id: order._id,
                          orderNumber: order.orderNumber,
                          totalAmount: order.totalAmount,
                          paymentStatus: order.paymentStatus || 'unpaid',
                        })}
                        className="text-sm font-medium text-blue-600 hover:text-blue-700"
                      >
                        Manage Payment
                      </button>
                    </div>

                    <div className="text-xs text-gray-700 space-y-1">
                      <p className="font-medium">{order.items?.length || 0} item(s)</p>
                      {order.items?.slice(0, 2).map((item, index) => (
                        <p key={`${order._id}-item-${index}`}>{formatOrderItemLine(item)}</p>
                      ))}
                      {(order.items?.length || 0) > 2 && (
                        <p className="text-gray-500">+{(order.items?.length || 0) - 2} more</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <div className="rounded-lg border border-gray-200 p-4 space-y-4">
        <h3 className="font-semibold text-gray-800">Add Order Item</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Product Type</label>
            <select
              value={draft.productTypeId}
              onChange={(e) => setDraft({
                ...draft,
                productTypeId: e.target.value,
                flavorId: '',
                cakeShapeId: '',
              })}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            >
              <option value="">Select product</option>
              {productTypes.map((product) => (
                <option key={product._id} value={product._id}>{product.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Flavor</label>
            <select
              value={draft.flavorId}
              onChange={(e) => setDraft({ ...draft, flavorId: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              disabled={!draft.productTypeId}
            >
              <option value="">Select flavor</option>
              {availableFlavors.map((flavor) => (
                <option key={flavor._id} value={flavor._id}>{flavor.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Shape</label>
            <select
              value={draft.cakeShapeId}
              onChange={(e) => setDraft({ ...draft, cakeShapeId: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              disabled={!draft.productTypeId || !requiresShapeSelection}
            >
              <option value="">Select shape</option>
              {availableShapes.map((shape) => (
                <option key={shape._id} value={shape._id}>{shape.name}</option>
              ))}
            </select>
            {draft.productTypeId && !requiresShapeSelection && (
              <p className="text-xs text-amber-700 mt-1">No shapes configured for this product type. Shape is optional.</p>
            )}
          </div>
        </div>

        {selectedProductType && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {selectedProductType.pricingMethod === 'perunit' ? (
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Quantity</label>
                <input
                  type="number"
                  min={selectedProductType.minQuantity || 1}
                  max={selectedProductType.maxQuantity}
                  value={draft.quantity}
                  onChange={(e) => setDraft({ ...draft, quantity: Number(e.target.value) || 0 })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                />
              </div>
            ) : (
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Weight (kg)</label>
                <input
                  type="number"
                  min={selectedProductType.minWeight || 0.5}
                  max={selectedProductType.maxWeight}
                  step="0.1"
                  value={draft.weight}
                  onChange={(e) => setDraft({ ...draft, weight: Number(e.target.value) || 0 })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                />
              </div>
            )}

            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-gray-500 mb-1">Special Instructions</label>
              <input
                type="text"
                value={draft.specialInstructions}
                onChange={(e) => setDraft({ ...draft, specialInstructions: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                placeholder="Optional"
              />
            </div>
          </div>
        )}

        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-700">Draft item total: <span className="font-semibold">{draftLineTotal.toFixed(2)}</span></p>
          <button
            type="button"
            onClick={addItem}
            disabled={!canAddValidItem}
            className="px-4 py-2 bg-gray-800 text-white rounded-md text-sm disabled:opacity-50"
          >
            Add Item
          </button>
        </div>

        {draftConstraintError && (
          <p className="text-sm text-red-600">{draftConstraintError}</p>
        )}
      </div>

      <div className="rounded-lg border border-gray-200 p-4 space-y-3">
        <h3 className="font-semibold text-gray-800">Current Order</h3>
        {items.length === 0 ? (
          <p className="text-sm text-gray-500">No items added yet.</p>
        ) : (
          <div className="space-y-2">
            {items.map((item, index) => {
              const product = productTypes.find((p) => p._id === item.productTypeId);
              const flavor = flavors.find((f) => f._id === item.flavorId);
              const shape = cakeShapes.find((s) => s._id === item.cakeShapeId);
              return (
                <div key={item.id} className="flex items-center justify-between border border-gray-200 rounded-md p-3">
                  <div className="text-sm">
                    <p className="font-semibold text-gray-800">{index + 1}. {product?.name || 'Unknown Product'}</p>
                    <p className="text-gray-600">Flavor: {flavor?.name || 'N/A'} • Shape: {shape?.name || 'N/A'}</p>
                    <p className="text-gray-600">
                      {item.quantity ? `Qty: ${item.quantity}` : `Weight: ${item.weight || 0}kg`}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="font-semibold text-gray-800">{(item.lineTotal || 0).toFixed(2)}</p>
                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      className="text-sm text-red-600"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Order Date</label>
            <input
              type="date"
              value={orderDate}
              onChange={(e) => setOrderDate(e.target.value)}
              min={minimumOrderDate}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            />
            <p className="text-xs text-gray-500 mt-1">Earliest available date is tomorrow.</p>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Order Time</label>
            <select
              value={orderHour}
              onChange={(e) => setOrderHour(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            >
              {availableHours.map((hour) => (
                <option key={hour} value={hour}>{hour}:00</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Order Notes</label>
            <input
              type="text"
              value={orderNotes}
              onChange={(e) => setOrderNotes(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              placeholder="Optional"
            />
          </div>
        </div>

        <div className="space-y-1 text-sm">
          <p className="text-gray-700">Subtotal: <span className="font-semibold">{subTotal.toFixed(2)}</span></p>
          <p className="text-gray-700">
            Loyalty Discount (10%): <span className="font-semibold">-{loyaltyDiscount.toFixed(2)}</span>
            {!hasPreviousOrders && <span className="ml-1 text-xs text-gray-500">(applies after first order)</span>}
          </p>
          <p className="text-gray-700">Total: <span className="font-bold text-gray-900">{totalAmount.toFixed(2)}</span></p>
          <p className="text-amber-700 font-semibold">Admin note: collect at least 50% ({minimumToConfirm.toFixed(2)}) to confirm this order.</p>
        </div>

        {submitError && <p className="text-sm text-red-600">{submitError}</p>}
        {submitMessage && <p className="text-sm text-green-700">{submitMessage}</p>}

        <button
          type="button"
          onClick={submitOrder}
          disabled={!canSubmitOrder || isSubmittingOrder}
          className="px-5 py-2 bg-gray-900 text-white rounded-md text-sm disabled:opacity-50"
        >
          {isSubmittingOrder ? 'Creating Order...' : 'Create Order'}
        </button>
      </div>
    </div>
  );
}