import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/mongodb';
import { authenticateRequest } from '@/lib/auth';
import logger from '@/lib/logger';
import { z } from 'zod';
import Order from '@/lib/models/order';
import Customer from '@/lib/models/customer';
import ProductType from '@/lib/models/productTypeSchema';
import FlavorType from '@/lib/models/flavorTypeSchema';
import CakeShape from '@/lib/models/cakeShapeSchema';
import ProductTypeFlavor from '@/lib/models/productTypeFlavorSchema';
import { createOrderSchema, orderQuerySchema } from '@/lib/validators/order';

const round2 = (value: number) => Math.round(value * 100) / 100;

class OrderValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'OrderValidationError';
  }
}

function calculatePaymentStatus(totalAmount: number, paidAmount: number): 'unpaid' | 'partial' | 'paid' {
  if (paidAmount <= 0) return 'unpaid';
  if (paidAmount >= totalAmount) return 'paid';
  return 'partial';
}

function generateOrderNumber() {
  const now = new Date();
  const y = now.getFullYear().toString().slice(-2);
  const m = `${now.getMonth() + 1}`.padStart(2, '0');
  const d = `${now.getDate()}`.padStart(2, '0');
  const random = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `ORD-${y}${m}${d}-${random}`;
}

async function getUniqueOrderNumber(): Promise<string> {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const orderNumber = generateOrderNumber();
    const exists = await Order.exists({ orderNumber });
    if (!exists) return orderNumber;
  }

  return `ORD-${Date.now()}`;
}

type AddressDoc = {
  _id?: { toString: () => string };
  label?: string;
  line1: string;
  line2?: string;
  city: string;
  state?: string;
  postalCode: string;
  notes?: string;
};

export async function GET(request: NextRequest) {
  try {
    const auth = authenticateRequest(request);
    if (!auth.authenticated) {
      return auth.response;
    }

    await dbConnect();

    const validatedQuery = orderQuerySchema.parse({
      customerId: request.nextUrl.searchParams.get('customerId') || undefined,
      status: request.nextUrl.searchParams.get('status') || undefined,
      page: request.nextUrl.searchParams.get('page') || undefined,
      limit: request.nextUrl.searchParams.get('limit') || undefined,
    });

    const filter: Record<string, unknown> = {};

    if (validatedQuery.customerId) {
      filter.customerId = new mongoose.Types.ObjectId(validatedQuery.customerId);
    }

    if (validatedQuery.status) {
      filter.status = validatedQuery.status;
    }

    const skip = (validatedQuery.page - 1) * validatedQuery.limit;

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(validatedQuery.limit)
        .lean(),
      Order.countDocuments(filter),
    ]);

    return NextResponse.json({
      success: true,
      page: validatedQuery.page,
      limit: validatedQuery.limit,
      total,
      orders,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.issues.map((issue: z.ZodIssue) => `${issue.path.join('.')}: ${issue.message}`);
      return NextResponse.json({ success: false, message: 'Validation failed', errors }, { status: 400 });
    }

    logger.error({ error: error instanceof Error ? error.message : 'Unknown error' }, 'Order fetch failed');
    return NextResponse.json({ success: false, message: 'Failed to fetch orders' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = authenticateRequest(request);
    if (!auth.authenticated) {
      return auth.response;
    }

    await dbConnect();

    const requestBody = await request.json();
    const validated = createOrderSchema.parse(requestBody);

    const customer = await Customer.findById(validated.customerId).lean();
    if (!customer) {
      return NextResponse.json({ success: false, message: 'Customer not found' }, { status: 404 });
    }

    let selectedDeliveryAddress: AddressDoc | undefined;

    if (validated.deliveryMethod === 'delivery') {
      selectedDeliveryAddress = (customer.addresses || []).find(
        (address: AddressDoc) => address._id?.toString() === validated.deliveryAddressId
      );

      if (!selectedDeliveryAddress) {
        return NextResponse.json(
          { success: false, message: 'Selected delivery address not found for customer' },
          { status: 400 }
        );
      }
    }

    const productTypeIds = [...new Set(validated.items.map((item) => item.productTypeId))];
    const flavorIds = [...new Set(validated.items.map((item) => item.flavorId))];
    const shapeIds = [...new Set(validated.items.map((item) => item.cakeShapeId).filter((id): id is string => Boolean(id)))];

    const [productTypes, flavors, shapes, combinations] = await Promise.all([
      ProductType.find({ _id: { $in: productTypeIds } }).lean(),
      FlavorType.find({ _id: { $in: flavorIds } }).lean(),
      CakeShape.find({ _id: { $in: shapeIds } }).lean(),
      ProductTypeFlavor.find({
        productTypeId: { $in: productTypeIds },
        flavorId: { $in: flavorIds },
        isAvailable: true,
      }).lean(),
    ]);

    const productMap = new Map(productTypes.map((product) => [product._id.toString(), product]));
    const flavorMap = new Map(flavors.map((flavor) => [flavor._id.toString(), flavor]));
    const shapeMap = new Map(shapes.map((shape) => [shape._id.toString(), shape]));
    const combinationSet = new Set(
      combinations.map((combination) => `${combination.productTypeId.toString()}_${combination.flavorId.toString()}`)
    );

    const calculatedItems = validated.items.map((item) => {
      const product = productMap.get(item.productTypeId);
      if (!product) {
        throw new OrderValidationError(`Product type not found: ${item.productTypeId}`);
      }

      const flavor = flavorMap.get(item.flavorId);
      if (!flavor) {
        throw new OrderValidationError(`Flavor not found: ${item.flavorId}`);
      }

      const configuredShapeIds = ((product.shapeIds || []) as Array<{ toString: () => string }>).map((shapeId) => shapeId.toString());
      let shape: { name: string } | undefined;

      if (configuredShapeIds.length > 0) {
        if (!item.cakeShapeId) {
          throw new OrderValidationError(`Cake shape is required for product type: ${product.name}`);
        }

        if (!configuredShapeIds.includes(item.cakeShapeId)) {
          throw new OrderValidationError(`Selected cake shape is not available for product type: ${product.name}`);
        }

        shape = shapeMap.get(item.cakeShapeId);
        if (!shape) {
          throw new OrderValidationError(`Cake shape not found: ${item.cakeShapeId}`);
        }
      }

      const hasCombination = combinationSet.has(`${item.productTypeId}_${item.flavorId}`);
      if (!hasCombination) {
        throw new OrderValidationError(`Flavor is not available for product type: ${product.name}`);
      }

      let unitBasePrice = 0;
      let flavorExtraPrice = 0;

      if (product.pricingMethod === 'perunit') {
        const quantity = item.quantity ?? 0;

        if (!quantity) {
          throw new OrderValidationError(`Quantity is required for product type: ${product.name}`);
        }

        if (product.minQuantity && quantity < product.minQuantity) {
          throw new OrderValidationError(`Quantity must be at least ${product.minQuantity} for ${product.name}`);
        }

        if (product.maxQuantity && quantity > product.maxQuantity) {
          throw new OrderValidationError(`Quantity must be at most ${product.maxQuantity} for ${product.name}`);
        }

        unitBasePrice = round2((product.unitPrice || 0) * quantity);
        const extraPerUnit = flavor.hasExtraPrice ? (flavor.extraPricePerUnit || 0) : 0;
        flavorExtraPrice = round2(extraPerUnit * quantity);
      } else {
        const weight = item.weight ?? 0;

        if (!weight) {
          throw new OrderValidationError(`Weight is required for product type: ${product.name}`);
        }

        if (product.minWeight && weight < product.minWeight) {
          throw new OrderValidationError(`Weight must be at least ${product.minWeight}kg for ${product.name}`);
        }

        if (product.maxWeight && weight > product.maxWeight) {
          throw new OrderValidationError(`Weight must be at most ${product.maxWeight}kg for ${product.name}`);
        }

        unitBasePrice = round2((product.pricePerKg || 0) * weight);
        const extraPerKg = flavor.hasExtraPrice ? (flavor.extraPricePerKg || 0) : 0;
        flavorExtraPrice = round2(extraPerKg * weight);
      }

      const lineTotal = round2(unitBasePrice + flavorExtraPrice);

      return {
        productTypeId: new mongoose.Types.ObjectId(item.productTypeId),
        productTypeName: product.name,
        flavorId: new mongoose.Types.ObjectId(item.flavorId),
        flavorName: flavor.name,
        cakeShapeId: item.cakeShapeId ? new mongoose.Types.ObjectId(item.cakeShapeId) : undefined,
        cakeShapeName: shape?.name || '',
        pricingMethod: product.pricingMethod,
        quantity: item.quantity,
        weight: item.weight,
        unitBasePrice,
        flavorExtraPrice,
        lineTotal,
        specialInstructions: item.specialInstructions || '',
      };
    });

    const subTotal = round2(calculatedItems.reduce((sum, item) => sum + item.lineTotal, 0));
    const hasPreviousOrder = await Order.exists({ customerId: new mongoose.Types.ObjectId(validated.customerId) });
    const discountRate = hasPreviousOrder ? 0.1 : 0;
    const discount = round2(subTotal * discountRate);
    const totalAmount = round2(Math.max(subTotal - discount, 0));
    const paidAmount = round2(validated.paidAmount || 0);

    if (paidAmount > totalAmount) {
      return NextResponse.json(
        { success: false, message: 'Paid amount cannot be greater than total amount' },
        { status: 400 }
      );
    }

    const paymentStatus = calculatePaymentStatus(totalAmount, paidAmount);
    const orderNumber = await getUniqueOrderNumber();

    const createdOrder = await Order.create({
      orderNumber,
      customerId: new mongoose.Types.ObjectId(validated.customerId),
      customerName: `${customer.firstName} ${customer.lastName}`,
      customerPhone: customer.phone,
      customerEmail: customer.email,
      deliveryMethod: validated.deliveryMethod,
      deliveryAddressId: validated.deliveryMethod === 'delivery' ? validated.deliveryAddressId : undefined,
      deliveryAddress: validated.deliveryMethod === 'delivery' && selectedDeliveryAddress
        ? {
            id: selectedDeliveryAddress._id?.toString() || '',
            label: selectedDeliveryAddress.label,
            line1: selectedDeliveryAddress.line1,
            line2: selectedDeliveryAddress.line2,
            city: selectedDeliveryAddress.city,
            state: selectedDeliveryAddress.state,
            postalCode: selectedDeliveryAddress.postalCode,
            notes: selectedDeliveryAddress.notes,
          }
        : undefined,
      orderDateTime: validated.orderDateTime,
      items: calculatedItems,
      notes: validated.notes || '',
      subTotal,
      discount,
      totalAmount,
      paidAmount,
      paymentStatus,
      status: 'pending',
      createdBy: new mongoose.Types.ObjectId(auth.user.userId),
    });

    logger.info({
      userId: auth.user.userId,
      orderId: createdOrder._id,
      orderNumber,
      customerId: validated.customerId,
      discountRate,
      discount,
      totalAmount,
    }, 'Order created successfully');

    return NextResponse.json({
      success: true,
      order: createdOrder,
    }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.issues.map((issue: z.ZodIssue) => `${issue.path.join('.')}: ${issue.message}`);
      return NextResponse.json({ success: false, message: 'Validation failed', errors }, { status: 400 });
    }

    if (error instanceof OrderValidationError) {
      return NextResponse.json({ success: false, message: error.message }, { status: 400 });
    }

    logger.error({ error: error instanceof Error ? error.message : 'Unknown error' }, 'Order creation failed');
    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to create order',
    }, { status: 500 });
  }
}
