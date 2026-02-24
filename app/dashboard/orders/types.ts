export type DeliveryMethod = 'pickup' | 'delivery';

export interface Address {
  id: string;
  label?: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  notes?: string;
}

export interface CustomerLookupResult {
  _id?: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  addresses: Address[];
}

export interface CustomerForm {
  phone: string;
  firstName: string;
  lastName: string;
  email: string;
  notes: string;
  deliveryMethod: DeliveryMethod;
  addressMode: 'existing' | 'new';
  selectedAddressId: string;
  newAddress: {
    line1: string;
    line2: string;
    city: string;
    state: string;
    postalCode: string;
    notes: string;
  };
}

export interface OrderItem {
  id: string;
  productTypeId: string;
  flavorId: string;
  cakeShapeId?: string;
  quantity?: number;
  weight?: number;
  specialInstructions: string;
  lineTotal?: number;
}

export interface PaymentForm {
  method: 'cash' | 'card' | 'upi' | 'bank-transfer';
  amountPaid: number;
  markAsPaid: boolean;
}
