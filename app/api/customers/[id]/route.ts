import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Customer from "@/lib/models/customer";
import { authenticateRequest } from "@/lib/auth";
import logger from "@/lib/logger";
import { z } from "zod";
import { updateCustomerSchema } from "@/lib/validators/customer";
import mongoose from "mongoose";

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

const addAddressSchema = z.object({
  label: z.string().max(100).optional(),
  line1: z.string().min(1, 'Address line 1 is required'),
  line2: z.string().optional(),
  city: z.string().min(1, 'City is required'),
  state: z.string().optional(),
  postalCode: z.string().min(1, 'Postal code is required'),
  notes: z.string().optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Authenticate request
    const auth = authenticateRequest(request);
    if (!auth.authenticated) {
      return auth.response;
    }

    await dbConnect();

    const { id: customerId } = await params;
    if (!mongoose.Types.ObjectId.isValid(customerId)) {
      return NextResponse.json(
        { success: false, message: 'Invalid customer ID' },
        { status: 400 }
      );
    }

    const requestBody = await request.json();
    const validated = addAddressSchema.parse(requestBody);

    const customer = await Customer.findById(customerId);
    if (!customer) {
      return NextResponse.json(
        { success: false, message: 'Customer not found' },
        { status: 404 }
      );
    }

    // Add new address
    const nextIndex = (customer.addresses?.length || 0) + 1;
    const label = validated.label || `Address ${nextIndex}`;
    customer.addresses.push({ ...validated, label });
    await customer.save();

    logger.info(
      { userId: auth.user.userId, customerId: customer._id },
      'Address added to customer'
    );

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

    return NextResponse.json({
      success: true,
      customer: {
        firstName: customer.firstName,
        lastName: customer.lastName,
        email: customer.email,
        phone: customer.phone,
        notes: customer.notes,
        addresses,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.issues.map(
        (err: z.ZodIssue) => `${err.path.join('.')}: ${err.message}`
      );
      return NextResponse.json(
        {
          success: false,
          message: 'Validation failed',
          errors: errorMessages,
        },
        { status: 400 }
      );
    }

    logger.error(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      'Add address failed'
    );

    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to add address',
      },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Authenticate request
    const auth = authenticateRequest(request);
    if (!auth.authenticated) {
      return auth.response;
    }

    await dbConnect();

    const { id: customerId } = await params;
    if (!mongoose.Types.ObjectId.isValid(customerId)) {
      return NextResponse.json(
        { success: false, message: 'Invalid customer ID' },
        { status: 400 }
      );
    }

    const customer = await Customer.findById(customerId).lean();
    if (!customer) {
      return NextResponse.json(
        { success: false, message: 'Customer not found' },
        { status: 404 }
      );
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
  } catch (error) {
    logger.error(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      'Customer detail fetch failed'
    );

    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to fetch customer',
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Authenticate request
    const auth = authenticateRequest(request);
    if (!auth.authenticated) {
      return auth.response;
    }

    await dbConnect();

    const { id: customerId } = await params;
    if (!mongoose.Types.ObjectId.isValid(customerId)) {
      return NextResponse.json(
        { success: false, message: 'Invalid customer ID' },
        { status: 400 }
      );
    }

    const requestBody = await request.json();
    const validated = updateCustomerSchema.parse(requestBody);

    const updatePayload: Record<string, unknown> = {
      firstName: validated.firstName,
      lastName: validated.lastName,
      email: validated.email,
      phone: validated.phone,
      notes: validated.notes ?? '',
    };

    if (validated.addresses) {
      updatePayload.addresses = validated.addresses;
    }

    const updated = await Customer.findByIdAndUpdate(customerId, updatePayload, { new: true }).lean();
    if (!updated) {
      return NextResponse.json(
        { success: false, message: 'Customer not found' },
        { status: 404 }
      );
    }

    const addresses = (updated.addresses || []).map((address: AddressDoc) => ({
      id: address._id?.toString() || '',
      label: address.label,
      line1: address.line1,
      line2: address.line2,
      city: address.city,
      state: address.state,
      postalCode: address.postalCode,
      notes: address.notes,
    }));

    logger.info({ userId: auth.user.userId, customerId }, 'Customer updated');

    return NextResponse.json({
      success: true,
      customer: {
        _id: updated._id?.toString() || '',
        firstName: updated.firstName,
        lastName: updated.lastName,
        email: updated.email,
        phone: updated.phone,
        notes: updated.notes,
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

    logger.error(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      'Customer update failed'
    );

    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to update customer',
    }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Authenticate request
    const auth = authenticateRequest(request);
    if (!auth.authenticated) {
      return auth.response;
    }

    await dbConnect();

    const { id: customerId } = await params;
    if (!mongoose.Types.ObjectId.isValid(customerId)) {
      return NextResponse.json(
        { success: false, message: 'Invalid customer ID' },
        { status: 400 }
      );
    }

    const deleted = await Customer.findByIdAndDelete(customerId).lean();
    if (!deleted) {
      return NextResponse.json(
        { success: false, message: 'Customer not found' },
        { status: 404 }
      );
    }

    logger.info({ userId: auth.user.userId, customerId }, 'Customer deleted');

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      'Customer delete failed'
    );

    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to delete customer',
    }, { status: 500 });
  }
}
