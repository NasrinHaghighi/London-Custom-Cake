import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Customer from "@/lib/models/customer";
import { authenticateRequest } from "@/lib/auth";
import logger from "@/lib/logger";
import { createCustomerSchema, customerPhoneQuerySchema } from "@/lib/validators/customer";
import { z } from "zod";

type AddressDoc = {
  _id?: { toString: () => string };
  label?: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  notes?: string;
};

export async function GET(request: NextRequest) {
  try {
    // Authenticate request
    const auth = authenticateRequest(request);
    if (!auth.authenticated) {
      return auth.response;
    }

    await dbConnect();

    const phone = request.nextUrl.searchParams.get('phone') || '';

    if (phone) {
      const validated = customerPhoneQuerySchema.parse({ phone });
      const customer = await Customer.findOne({ phone: validated.phone }).lean();

      if (!customer) {
        return NextResponse.json({ success: false, message: 'Customer not found' }, { status: 404 });
      }

      const addresses = (customer.addresses || []).map((address: AddressDoc) => ({
        id: address._id?.toString() || '',
        label: address.label,
        line1: address.line1,
        line2: address.line2,
        city: address.city,
        state: address.state,
        postalCode: address.postalCode,
        notes: address.notes,
      }));

      logger.info({ userId: auth.user.userId, customerId: customer._id }, 'Customer lookup by phone');

      return NextResponse.json({
        success: true,
        customer: {
          _id: customer._id?.toString() || '',
          firstName: customer.firstName,
          lastName: customer.lastName,
          email: customer.email,
          phone: customer.phone,
          notes: customer.notes,
          addresses,
        },
      });
    }

    const customers = await Customer.find().sort({ createdAt: -1 }).lean();
    const customerList = customers.map((customer) => ({
      _id: customer._id?.toString() || '',
      firstName: customer.firstName,
      lastName: customer.lastName,
      email: customer.email,
      phone: customer.phone,
      notes: customer.notes,
      addressCount: customer.addresses?.length || 0,
      createdAt: customer.createdAt ? new Date(customer.createdAt).toISOString() : '',
    }));

    return NextResponse.json({
      success: true,
      customers: customerList,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.issues.map((err: z.ZodIssue) => `${err.path.join('.')}: ${err.message}`);
      return NextResponse.json({
        success: false,
        message: 'Validation failed',
        errors: errorMessages,
      }, { status: 400 });
    }

    logger.error({ error: error instanceof Error ? error.message : 'Unknown error' }, 'Customer lookup failed');

    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to lookup customer',
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Authenticate request
    const auth = authenticateRequest(request);
    if (!auth.authenticated) {
      return auth.response;
    }

    await dbConnect();

    const requestBody = await request.json();
    const validated = createCustomerSchema.parse(requestBody);

    const existing = await Customer.findOne({ phone: validated.phone }).lean();
    if (existing) {
      const addresses = (existing.addresses || []).map((address: AddressDoc) => ({
        id: address._id?.toString() || '',
        label: address.label,
        line1: address.line1,
        line2: address.line2,
        city: address.city,
        state: address.state,
        postalCode: address.postalCode,
        notes: address.notes,
      }));

      return NextResponse.json({
        success: true,
        created: false,
        customer: {
          _id: existing._id?.toString() || '',
          firstName: existing.firstName,
          lastName: existing.lastName,
          email: existing.email,
          phone: existing.phone,
          notes: existing.notes,
          addresses,
        },
      });
    }

    const created = await Customer.create({
      firstName: validated.firstName,
      lastName: validated.lastName,
      email: validated.email,
      phone: validated.phone,
      notes: validated.notes,
      addresses: validated.addresses,
    });

    logger.info({ userId: auth.user.userId, customerId: created._id }, 'Customer created');

    const addresses = (created.addresses || []).map((address: AddressDoc) => ({
      id: address._id?.toString() || '',
      label: address.label,
      line1: address.line1,
      line2: address.line2,
      city: address.city,
      state: address.state,
      postalCode: address.postalCode,
      notes: address.notes,
    }));

    return NextResponse.json({
      success: true,
      created: true,
      customer: {
        _id: created._id?.toString() || '',
        firstName: created.firstName,
        lastName: created.lastName,
        email: created.email,
        phone: created.phone,
        notes: created.notes,
        addresses,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.issues.map((err: z.ZodIssue) => `${err.path.join('.')}: ${err.message}`);
      return NextResponse.json({
        success: false,
        message: 'Validation failed',
        errors: errorMessages,
      }, { status: 400 });
    }

    logger.error({ error: error instanceof Error ? error.message : 'Unknown error' }, 'Customer create failed');

    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to create customer',
    }, { status: 500 });
  }
}
