'use client';

import { useMemo, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { OrderItem } from '../types';
import { ProductType } from '@/lib/api/productTypes';
import { CakeShape } from '@/lib/api/cakeShapes';
import { DeliveryMethod } from '../types';
import OrderTabCustomerInfoSection, { Address, Customer } from './OrderTabCustomerInfoSection';
import { FlavorType } from '@/lib/api/flavorTypes';
import { fetchOrderProductionTimeEstimate } from '@/lib/api/orders';

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
  customDecorations: string;
  referenceImages: string[];
}

const MAX_REFERENCE_IMAGES = 3;
const MAX_REFERENCE_IMAGE_BYTES = 5 * 1024 * 1024;
const ALLOWED_REFERENCE_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];

const orderDateTimeFormatter = new Intl.DateTimeFormat('en-GB', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  hour12: false,
  timeZone: 'UTC',
});

function formatOrderDateTime(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return '-';
  }
  return `${orderDateTimeFormatter.format(parsed)}h`;
}

function toDateInputValue(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatHoursLabel(totalMinutes: number): string {
  const rounded = Math.max(0, Math.round(totalMinutes));
  const hours = Math.floor(rounded / 60);
  const minutes = rounded % 60;

  if (hours === 0) {
    return `${minutes}m`;
  }

  if (minutes === 0) {
    return `${hours}h`;
  }

  return `${hours}h ${minutes}m`;
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
  if (normalized === 'in-progress') {
    return 'bg-blue-100 text-blue-700';
  }
  return 'bg-yellow-100 text-yellow-700'; // pending
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

function calculateItemLineTotal(
  productType: ProductType | undefined,
  flavor: FlavorType | undefined,
  quantity: number,
  weight: number
): number {
  if (!productType) {
    return 0;
  }

  const isPerUnit = productType.pricingMethod === 'perunit';
  const basePrice = isPerUnit
    ? (productType.unitPrice || 0) * quantity
    : (productType.pricePerKg || 0) * weight;

  const extraPrice = flavor?.hasExtraPrice
    ? (isPerUnit ? (flavor.extraPricePerUnit || 0) * quantity : (flavor.extraPricePerKg || 0) * weight)
    : 0;

  return Math.round((basePrice + extraPrice) * 100) / 100;
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
    orderDateTime: string;
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
  const [referenceImageError, setReferenceImageError] = useState<string>('');
  const [isProcessingImages, setIsProcessingImages] = useState(false);
  const [isPreviousOrdersCollapsed, setIsPreviousOrdersCollapsed] = useState(true);
  const referenceImagesInputRef = useRef<HTMLInputElement | null>(null);
  const editReferenceImagesInputRef = useRef<HTMLInputElement | null>(null);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingItemIndex, setEditingItemIndex] = useState<number>(-1);
  const [editReferenceImageError, setEditReferenceImageError] = useState<string>('');
  const [editFormError, setEditFormError] = useState<string>('');
  const [isEditingImages, setIsEditingImages] = useState(false);
  const [editingDraft, setEditingDraft] = useState<OrderDraft>({
    productTypeId: '',
    flavorId: '',
    cakeShapeId: '',
    quantity: 1,
    weight: 1,
    specialInstructions: '',
    customDecorations: '',
    referenceImages: [],
  });
  const [draft, setDraft] = useState<OrderDraft>({
    productTypeId: '',
    flavorId: '',
    cakeShapeId: '',
    quantity: 1,
    weight: 1,
    specialInstructions: '',
    customDecorations: '',
    referenceImages: [],
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
      const response = await fetch('/api/flavor-type', {
        credentials: 'include',
      });
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
      const response = await fetch('/api/product-flavor?isAvailable=true', {
        credentials: 'include',
      });
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
    return calculateItemLineTotal(selectedProductType, selectedFlavor, draft.quantity, draft.weight);
  }, [selectedFlavor, selectedProductType, draft.quantity, draft.weight]);

  const editingProductType = useMemo(
    () => productTypes.find((product) => product._id === editingDraft.productTypeId),
    [editingDraft.productTypeId, productTypes]
  );
  const editingSelectedFlavor = useMemo(
    () => flavors.find((flavor) => flavor._id === editingDraft.flavorId),
    [editingDraft.flavorId, flavors]
  );
  const editingRequiresShapeSelection = Boolean(
    editingProductType && (editingProductType.shapeIds?.length || 0) > 0
  );

  const editingAvailableFlavorIds = useMemo(() => {
    if (!editingDraft.productTypeId) {
      return [] as string[];
    }

    const combinations = combinationData?.combinations || [];
    return combinations
      .filter((combination) => {
        const productId = extractRefId(combination.productTypeId);
        return productId === editingDraft.productTypeId && combination.isAvailable;
      })
      .map((combination) => extractRefId(combination.flavorId));
  }, [combinationData?.combinations, editingDraft.productTypeId]);

  const editingAvailableFlavors = useMemo(() => {
    const scopedFlavors = flavors.filter((flavor) => editingAvailableFlavorIds.includes(flavor._id));
    const currentFlavor = flavors.find((flavor) => flavor._id === editingDraft.flavorId);

    if (!currentFlavor || scopedFlavors.some((flavor) => flavor._id === currentFlavor._id)) {
      return scopedFlavors;
    }

    return [currentFlavor, ...scopedFlavors];
  }, [editingAvailableFlavorIds, editingDraft.flavorId, flavors]);

  const editingAvailableShapes = useMemo(() => {
    if (!editingProductType) {
      return [] as CakeShape[];
    }

    const shapeIds = editingProductType.shapeIds || [];
    if (!shapeIds.length) {
      return [] as CakeShape[];
    }

    const normalizedShapeIds = new Set(shapeIds.map((shapeId) => String(shapeId)));
    const scopedShapes = cakeShapes.filter((shape) => normalizedShapeIds.has(shape._id));
    const currentShape = cakeShapes.find((shape) => shape._id === editingDraft.cakeShapeId);

    if (!currentShape || scopedShapes.some((shape) => shape._id === currentShape._id)) {
      return scopedShapes;
    }

    return [currentShape, ...scopedShapes];
  }, [cakeShapes, editingDraft.cakeShapeId, editingProductType]);

  const editingLineTotal = useMemo(
    () => calculateItemLineTotal(editingProductType, editingSelectedFlavor, editingDraft.quantity, editingDraft.weight),
    [editingDraft.quantity, editingDraft.weight, editingProductType, editingSelectedFlavor]
  );

  const editingFlavorExtra = useMemo(() => {
    if (!editingProductType || !editingSelectedFlavor?.hasExtraPrice) {
      return 0;
    }

    return editingProductType.pricingMethod === 'perunit'
      ? (editingSelectedFlavor.extraPricePerUnit || 0) * editingDraft.quantity
      : (editingSelectedFlavor.extraPricePerKg || 0) * editingDraft.weight;
  }, [editingDraft.quantity, editingDraft.weight, editingProductType, editingSelectedFlavor]);

  const editingConstraintError = useMemo(() => {
    if (!editingProductType) {
      return 'Product type is required.';
    }

    if (!editingDraft.flavorId) {
      return 'Flavor is required.';
    }

    if (editingRequiresShapeSelection && !editingDraft.cakeShapeId) {
      return 'Shape is required for this product type.';
    }

    if (editingProductType.pricingMethod === 'perunit') {
      const minQuantity = editingProductType.minQuantity ?? 1;
      const maxQuantity = editingProductType.maxQuantity;

      if (editingDraft.quantity < minQuantity) {
        return `Quantity must be at least ${minQuantity} for ${editingProductType.name}.`;
      }

      if (typeof maxQuantity === 'number' && editingDraft.quantity > maxQuantity) {
        return `Quantity must be at most ${maxQuantity} for ${editingProductType.name}.`;
      }

      return '';
    }

    const minWeight = editingProductType.minWeight ?? 0.5;
    const maxWeight = editingProductType.maxWeight;

    if (editingDraft.weight < minWeight) {
      return `Weight must be at least ${minWeight}kg for ${editingProductType.name}.`;
    }

    if (typeof maxWeight === 'number' && editingDraft.weight > maxWeight) {
      return `Weight must be at most ${maxWeight}kg for ${editingProductType.name}.`;
    }

    return '';
  }, [editingDraft.cakeShapeId, editingDraft.flavorId, editingDraft.quantity, editingDraft.weight, editingProductType, editingRequiresShapeSelection]);

  const canSaveEditedItem = editingItemIndex >= 0 && !editingConstraintError;

  const subTotal = useMemo(
    () => Math.round(items.reduce((sum, item) => sum + (item.lineTotal || 0), 0) * 100) / 100,
    [items]
  );
  const loyaltyDiscount = hasPreviousOrders ? Math.round(subTotal * 0.1 * 100) / 100 : 0;
  const totalAmount = Math.max(Math.round((subTotal - loyaltyDiscount) * 100) / 100, 0);
  const minimumToConfirm = Math.round(totalAmount * 0.5 * 100) / 100;

  const estimateItemsPayload = useMemo(
    () => items.map((item) => ({
      productTypeId: item.productTypeId,
      quantity: item.quantity,
      weight: item.weight,
    })),
    [items]
  );

  const {
    data: productionEstimate,
    isLoading: isEstimatingProductionTime,
    error: productionEstimateError,
  } = useQuery({
    queryKey: ['order-production-estimate', estimateItemsPayload],
    queryFn: () => fetchOrderProductionTimeEstimate({ items: estimateItemsPayload }),
    enabled: estimateItemsPayload.length > 0,
    staleTime: 30 * 1000,
  });

  const productionTimeLabel = productionEstimate
    ? formatHoursLabel(productionEstimate.totalMinutes)
    : '';

  const productionEstimateByIndex = useMemo(() => {
    const estimateMap = new Map<number, number>();
    (productionEstimate?.itemEstimates || []).forEach((estimate) => {
      estimateMap.set(estimate.itemIndex, estimate.minutes);
    });
    return estimateMap;
  }, [productionEstimate?.itemEstimates]);

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

  const fileToDataUrl = (file: File) => new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      if (!result) {
        reject(new Error('Failed to read selected image'));
        return;
      }
      resolve(result);
    };
    reader.onerror = () => {
      reject(new Error('Failed to read selected image'));
    };
    reader.readAsDataURL(file);
  });

  const handleReferenceImagesChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || []);
    setReferenceImageError('');

    if (!selectedFiles.length) {
      return;
    }

    if (draft.referenceImages.length + selectedFiles.length > MAX_REFERENCE_IMAGES) {
      setReferenceImageError(`You can upload a maximum of ${MAX_REFERENCE_IMAGES} reference images per item.`);
      if (referenceImagesInputRef.current) {
        referenceImagesInputRef.current.value = '';
      }
      return;
    }

    for (const file of selectedFiles) {
      if (!ALLOWED_REFERENCE_IMAGE_TYPES.includes(file.type)) {
        setReferenceImageError('Only PNG, JPG, JPEG, and WEBP images are allowed.');
        if (referenceImagesInputRef.current) {
          referenceImagesInputRef.current.value = '';
        }
        return;
      }

      if (file.size > MAX_REFERENCE_IMAGE_BYTES) {
        setReferenceImageError('Each image must be 5MB or less.');
        if (referenceImagesInputRef.current) {
          referenceImagesInputRef.current.value = '';
        }
        return;
      }
    }

    try {
      setIsProcessingImages(true);
      const uploadedImages = await Promise.all(selectedFiles.map((file) => fileToDataUrl(file)));
      setDraft((prev) => ({
        ...prev,
        referenceImages: [...prev.referenceImages, ...uploadedImages],
      }));
    } catch {
      setReferenceImageError('Failed to process image. Please try again.');
    } finally {
      setIsProcessingImages(false);
      if (referenceImagesInputRef.current) {
        referenceImagesInputRef.current.value = '';
      }
    }
  };

  const removeReferenceImage = (indexToRemove: number) => {
    setReferenceImageError('');
    setDraft((prev) => ({
      ...prev,
      referenceImages: prev.referenceImages.filter((_, index) => index !== indexToRemove),
    }));
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
      customDecorations: draft.customDecorations || undefined,
      referenceImages: draft.referenceImages.length ? draft.referenceImages : undefined,
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
      customDecorations: '',
      referenceImages: [],
    });
    setReferenceImageError('');
    if (referenceImagesInputRef.current) {
      referenceImagesInputRef.current.value = '';
    }
  };

  const removeItem = (itemId: string) => {
    setItems(items.filter((item) => item.id !== itemId));
  };

  const handleEditItem = (item: OrderItem, index: number) => {
    setEditingItemId(item.id);
    setEditingItemIndex(index);
    setEditingDraft({
      productTypeId: item.productTypeId,
      flavorId: item.flavorId,
      cakeShapeId: item.cakeShapeId || '',
      quantity: item.quantity || 1,
      weight: item.weight || 1,
      specialInstructions: item.specialInstructions || '',
      customDecorations: item.customDecorations || '',
      referenceImages: item.referenceImages || [],
    });
    setEditReferenceImageError('');
    setEditFormError('');
  };

  const handleCancelEdit = () => {
    setEditingItemId(null);
    setEditingItemIndex(-1);
    setEditingDraft({
      productTypeId: '',
      flavorId: '',
      cakeShapeId: '',
      quantity: 1,
      weight: 1,
      specialInstructions: '',
      customDecorations: '',
      referenceImages: [],
    });
    setEditReferenceImageError('');
    setEditFormError('');
    if (editReferenceImagesInputRef.current) {
      editReferenceImagesInputRef.current.value = '';
    }
  };

  const handleEditReferenceImagesChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || []);
    setEditReferenceImageError('');

    if (!selectedFiles.length) {
      return;
    }

    if (editingDraft.referenceImages.length + selectedFiles.length > MAX_REFERENCE_IMAGES) {
      setEditReferenceImageError(`You can upload a maximum of ${MAX_REFERENCE_IMAGES} reference images per item.`);
      if (editReferenceImagesInputRef.current) {
        editReferenceImagesInputRef.current.value = '';
      }
      return;
    }

    for (const file of selectedFiles) {
      if (!ALLOWED_REFERENCE_IMAGE_TYPES.includes(file.type)) {
        setEditReferenceImageError('Only PNG, JPG, JPEG, and WEBP images are allowed.');
        if (editReferenceImagesInputRef.current) {
          editReferenceImagesInputRef.current.value = '';
        }
        return;
      }

      if (file.size > MAX_REFERENCE_IMAGE_BYTES) {
        setEditReferenceImageError('Each image must be 5MB or less.');
        if (editReferenceImagesInputRef.current) {
          editReferenceImagesInputRef.current.value = '';
        }
        return;
      }
    }

    try {
      setIsEditingImages(true);
      const uploadedImages = await Promise.all(selectedFiles.map((file) => fileToDataUrl(file)));
      setEditingDraft((prev) => ({
        ...prev,
        referenceImages: [...prev.referenceImages, ...uploadedImages],
      }));
    } catch {
      setEditReferenceImageError('Failed to process image. Please try again.');
    } finally {
      setIsEditingImages(false);
      if (editReferenceImagesInputRef.current) {
        editReferenceImagesInputRef.current.value = '';
      }
    }
  };

  const removeEditingReferenceImage = (indexToRemove: number) => {
    setEditReferenceImageError('');
    setEditingDraft((prev) => ({
      ...prev,
      referenceImages: prev.referenceImages.filter((_, index) => index !== indexToRemove),
    }));
  };

  const handleSaveEditedItem = () => {
    if (editingItemIndex < 0 || editingItemIndex >= items.length) {
      return;
    }

    if (editingConstraintError || !editingProductType) {
      setEditFormError(editingConstraintError || 'Product type is required.');
      return;
    }

    setEditFormError('');

    const isPerUnit = editingProductType.pricingMethod === 'perunit';

    const updatedItem: OrderItem = {
      ...items[editingItemIndex],
      flavorId: editingDraft.flavorId,
      cakeShapeId: editingRequiresShapeSelection ? editingDraft.cakeShapeId : undefined,
      specialInstructions: editingDraft.specialInstructions,
      customDecorations: editingDraft.customDecorations || undefined,
      referenceImages: editingDraft.referenceImages.length ? editingDraft.referenceImages : undefined,
      quantity: isPerUnit ? editingDraft.quantity : undefined,
      weight: isPerUnit ? undefined : editingDraft.weight,
      lineTotal: editingLineTotal,
    };

    const updatedItems = [...items];
    updatedItems[editingItemIndex] = updatedItem;
    setItems(updatedItems);
    handleCancelEdit();
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
          customDecorations: item.customDecorations || '',
          referenceImages: item.referenceImages || [],
        })),
        notes: orderNotes,
      };

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
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
        orderDateTime: data.order.orderDateTime,
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
              onChange={(e) => {
                const productTypeId = e.target.value;
                const selectedProduct = productTypes.find((product) => product._id === productTypeId);

                const nextQuantity = selectedProduct?.pricingMethod === 'perunit'
                  ? (selectedProduct.minQuantity ?? 1)
                  : draft.quantity;
                const nextWeight = selectedProduct?.pricingMethod === 'perkg'
                  ? (selectedProduct.minWeight ?? 0.5)
                  : draft.weight;

                setDraft({
                  ...draft,
                  productTypeId,
                  flavorId: '',
                  cakeShapeId: '',
                  quantity: nextQuantity,
                  weight: nextWeight,
                });
              }}
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
                  onChange={(e) => {
                    const minWeight = selectedProductType.minWeight ?? 0.5;
                    const parsedWeight = Number(e.target.value);
                    const weight = Number.isFinite(parsedWeight) ? Math.max(parsedWeight, minWeight) : minWeight;
                    setDraft({ ...draft, weight });
                  }}
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

        {/* Custom Decorations Section */}
        {selectedProductType && (
          <div className="border border-blue-200 bg-blue-50 rounded-lg p-4 space-y-3">
            <h4 className="font-medium text-blue-900 text-sm">✨ Custom Decorations (Optional)</h4>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Describe custom decorations</label>
              <input
                type="text"
                value={draft.customDecorations}
                onChange={(e) => setDraft({ ...draft, customDecorations: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                placeholder="e.g., gold leaf, custom piping, intricate design..."
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Reference Images (optional)</label>
              <input
                ref={referenceImagesInputRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/webp"
                multiple
                onChange={handleReferenceImagesChange}
                disabled={isProcessingImages || draft.referenceImages.length >= MAX_REFERENCE_IMAGES}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-white"
              />
              <p className="text-xs text-gray-600 mt-1">
                Upload up to {MAX_REFERENCE_IMAGES} images, 5MB max each.
              </p>
              {referenceImageError && (
                <p className="text-sm text-red-600 mt-1">{referenceImageError}</p>
              )}
              {isProcessingImages && (
                <p className="text-xs text-blue-700 mt-1">Processing image...</p>
              )}
              {draft.referenceImages.length > 0 && (
                <div className="mt-2 grid grid-cols-3 gap-2">
                  {draft.referenceImages.map((imageUrl, index) => (
                    <div key={`${imageUrl.slice(0, 40)}-${index}`} className="relative border border-gray-200 rounded-md overflow-hidden bg-white">
                      <img src={imageUrl} alt={`Reference ${index + 1}`} className="h-20 w-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeReferenceImage(index)}
                        className="absolute top-1 right-1 rounded bg-black/70 px-1.5 py-0.5 text-[10px] text-white"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
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
              const itemEstimatedMinutes = productionEstimateByIndex.get(index);
              return (
                <div key={item.id} className="flex items-center justify-between border border-gray-200 rounded-md p-3">
                  <div className="text-sm">
                    <p className="font-semibold text-gray-800">{index + 1}. {product?.name || 'Unknown Product'}</p>
                    <p className="text-gray-600">Flavor: {flavor?.name || 'N/A'} • Shape: {shape?.name || 'N/A'}</p>
                    <p className="text-gray-600">
                      {item.quantity ? `Qty: ${item.quantity}` : `Weight: ${item.weight || 0}kg`}
                    </p>
                    <p className="text-xs text-gray-700 mt-1">
                      ⏱ Estimated prep:{' '}
                      <span className="font-semibold text-gray-900">
                        {isEstimatingProductionTime
                          ? 'Calculating...'
                          : itemEstimatedMinutes !== undefined
                            ? formatHoursLabel(itemEstimatedMinutes)
                            : '-'}
                      </span>
                    </p>
                    {item.customDecorations && (
                      <p className="text-blue-600 text-xs mt-1 font-medium">🎨 Decoration: {item.customDecorations}</p>
                    )}
                    {item.referenceImages && item.referenceImages.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {item.referenceImages.map((imageUrl, imageIndex) => (
                          <img
                            key={`${item.id}-img-${imageIndex}`}
                            src={imageUrl}
                            alt={`Order item reference ${imageIndex + 1}`}
                            className="h-12 w-12 rounded border border-gray-200 object-cover"
                          />
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="font-semibold text-gray-800">{(item.lineTotal || 0).toFixed(2)}</p>
                    <button
                      type="button"
                      onClick={() => handleEditItem(item, index)}
                      className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      className="text-sm text-red-600 hover:text-red-700 font-medium"
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
          <p className="text-gray-700">
            Estimated Production Time:{' '}
            <span className="font-semibold text-gray-900">
              {isEstimatingProductionTime
                ? 'Calculating...'
                : productionEstimate
                  ? productionTimeLabel
                  : estimateItemsPayload.length > 0
                    ? '-'
                    : 'No items yet'}
            </span>
          </p>
          {productionEstimateError && (
            <p className="text-xs text-amber-700">
              Could not preview production time right now. {productionEstimateError instanceof Error ? productionEstimateError.message : ''}
            </p>
          )}
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

      {/* Edit Item Modal */}
      {editingItemId && editingItemIndex >= 0 && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full my-8">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-800">Edit Order Item</h2>
              <button
                type="button"
                onClick={handleCancelEdit}
                className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
              >
                ×
              </button>
            </div>

            <div className="px-6 py-4 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-4">
                <h3 className="font-semibold text-gray-800 text-sm">Item Details</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Product</label>
                    <p className="text-sm text-gray-800 font-medium">{editingProductType?.name || 'Unknown'}</p>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Flavor</label>
                    <select
                      value={editingDraft.flavorId}
                      onChange={(e) => {
                        setEditFormError('');
                        setEditingDraft({ ...editingDraft, flavorId: e.target.value });
                      }}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-white"
                      disabled={!editingProductType}
                    >
                      <option value="">Select flavor</option>
                      {editingAvailableFlavors.map((flavor) => (
                        <option key={flavor._id} value={flavor._id}>{flavor.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Shape</label>
                    <select
                      value={editingDraft.cakeShapeId}
                      onChange={(e) => {
                        setEditFormError('');
                        setEditingDraft({ ...editingDraft, cakeShapeId: e.target.value });
                      }}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-white"
                      disabled={!editingProductType || !editingRequiresShapeSelection}
                    >
                      <option value="">Select shape</option>
                      {editingAvailableShapes.map((shape) => (
                        <option key={shape._id} value={shape._id}>{shape.name}</option>
                      ))}
                    </select>
                    {editingProductType && !editingRequiresShapeSelection && (
                      <p className="text-xs text-amber-700 mt-1">No shapes configured for this product type. Shape is optional.</p>
                    )}
                  </div>

                  {editingProductType?.pricingMethod === 'perunit' ? (
                    <div>
                      <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Quantity</label>
                      <input
                        type="number"
                        min={editingProductType.minQuantity || 1}
                        max={editingProductType.maxQuantity}
                        value={editingDraft.quantity}
                        onChange={(e) => {
                          setEditFormError('');
                          setEditingDraft({ ...editingDraft, quantity: Number(e.target.value) || 0 });
                        }}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-white"
                      />
                    </div>
                  ) : (
                    <div>
                      <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Weight (kg)</label>
                      <input
                        type="number"
                        min={editingProductType?.minWeight || 0.5}
                        max={editingProductType?.maxWeight}
                        step="0.1"
                        value={editingDraft.weight}
                        onChange={(e) => {
                          if (!editingProductType) {
                            return;
                          }
                          setEditFormError('');
                          const minWeight = editingProductType.minWeight ?? 0.5;
                          const parsedWeight = Number(e.target.value);
                          const weight = Number.isFinite(parsedWeight) ? Math.max(parsedWeight, minWeight) : minWeight;
                          setEditingDraft({ ...editingDraft, weight });
                        }}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-white"
                      />
                    </div>
                  )}
                </div>

                <div className="border-t border-gray-200 pt-3 grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase">Base Price</p>
                    <p className="text-gray-800 font-semibold">€{Math.max(editingLineTotal - editingFlavorExtra, 0).toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase">Flavor Extra</p>
                    <p className="text-gray-800 font-semibold">€{editingFlavorExtra.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase">Line Total</p>
                    <p className="text-gray-800 font-bold text-base">€{editingLineTotal.toFixed(2)}</p>
                  </div>
                </div>
              </div>

              {/* Special Instructions */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Special Instructions</label>
                <input
                  type="text"
                  value={editingDraft.specialInstructions}
                  onChange={(e) => {
                    setEditFormError('');
                    setEditingDraft({ ...editingDraft, specialInstructions: e.target.value });
                  }}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                  placeholder="Optional"
                />
              </div>

              {/* Custom Decorations */}
              <div className="border border-blue-200 bg-blue-50 rounded-lg p-4 space-y-3">
                <h4 className="font-medium text-blue-900 text-sm">✨ Custom Decorations (Optional)</h4>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Describe custom decorations</label>
                  <input
                    type="text"
                    value={editingDraft.customDecorations}
                    onChange={(e) => {
                      setEditFormError('');
                      setEditingDraft({ ...editingDraft, customDecorations: e.target.value });
                    }}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                    placeholder="e.g., gold leaf, custom piping, intricate design..."
                  />
                </div>

              </div>

              {/* Reference Images */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Reference Images (optional)</label>
                <input
                  ref={editReferenceImagesInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/webp"
                  multiple
                  onChange={handleEditReferenceImagesChange}
                  disabled={isEditingImages || editingDraft.referenceImages.length >= MAX_REFERENCE_IMAGES}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-white"
                />
                <p className="text-xs text-gray-600 mt-1">
                  Upload up to {MAX_REFERENCE_IMAGES} images, 5MB max each.
                </p>
                {editReferenceImageError && (
                  <p className="text-sm text-red-600 mt-1">{editReferenceImageError}</p>
                )}
                {isEditingImages && (
                  <p className="text-xs text-blue-700 mt-1">Processing image...</p>
                )}
                {editingDraft.referenceImages.length > 0 && (
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    {editingDraft.referenceImages.map((imageUrl, imageIndex) => (
                      <div key={`edit-img-${imageIndex}`} className="relative border border-gray-200 rounded-md overflow-hidden bg-white">
                        <img src={imageUrl} alt={`Reference ${imageIndex + 1}`} className="h-20 w-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removeEditingReferenceImage(imageIndex)}
                          className="absolute top-1 right-1 rounded bg-black/70 px-1.5 py-0.5 text-[10px] text-white hover:bg-black"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {editFormError && (
                <p className="text-sm text-red-600">{editFormError}</p>
              )}
            </div>

            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={handleCancelEdit}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md text-sm hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveEditedItem}
                disabled={!canSaveEditedItem}
                className="px-4 py-2 bg-gray-800 text-white rounded-md text-sm hover:bg-gray-900 disabled:opacity-50"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}