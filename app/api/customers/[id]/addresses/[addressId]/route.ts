import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Customer from '@/lib/models/customer';
import { authenticateRequest } from '@/lib/auth';
import logger from '@/lib/logger';
import mongoose from 'mongoose';
import { z } from 'zod';
import { addressInputSchema } from '@/lib/validators/customer';

const fallbackAddressSchema = z.object({
  label: z.string().max(100).optional(),
  line1: z.string().min(1, 'Address line 1 is required'),
  line2: z.string().optional(),
  city: z.string().min(1, 'City is required'),
  state: z.string().optional(),
  postalCode: z.string().min(1, 'Postal code is required'),
  notes: z.string().optional(),
});

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

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; addressId: string }> }
) {
  try {
    const auth = authenticateRequest(request);
    if (!auth.authenticated) {
      return auth.response;
    }

    await dbConnect();

    const { id: customerId, addressId } = await params;
    if (!mongoose.Types.ObjectId.isValid(customerId) || !mongoose.Types.ObjectId.isValid(addressId)) {
      return NextResponse.json(
        { success: false, message: 'Invalid customer or address ID' },
        { status: 400 }
      );
    }

    const requestBody = await request.json();
    const schema = addressInputSchema ?? fallbackAddressSchema;
    const validated = schema.parse(requestBody);

    const updatePayload: Record<string, unknown> = {
      'addresses.$.label': validated.label,
      'addresses.$.line1': validated.line1,
      'addresses.$.line2': validated.line2,
      'addresses.$.city': validated.city,
      'addresses.$.state': validated.state,
      'addresses.$.postalCode': validated.postalCode,
      'addresses.$.notes': validated.notes,
    };

    const updated = await Customer.findOneAndUpdate(
      { _id: customerId, 'addresses._id': addressId },
      { $set: updatePayload },
      { new: true }
    ).lean();

    if (!updated) {
      return NextResponse.json(
        { success: false, message: 'Customer or address not found' },
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

    logger.info({ userId: auth.user.userId, customerId }, 'Customer address updated');

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
      'Customer address update failed'
    );

    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to update address',
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; addressId: string }> }
) {
  try {
    const auth = authenticateRequest(request);
    if (!auth.authenticated) {
      return auth.response;
    }

    await dbConnect();

    const { id: customerId, addressId } = await params;
    if (!mongoose.Types.ObjectId.isValid(customerId) || !mongoose.Types.ObjectId.isValid(addressId)) {
      return NextResponse.json(
        { success: false, message: 'Invalid customer or address ID' },
        { status: 400 }
      );
    }

    const updated = await Customer.findByIdAndUpdate(
      customerId,
      { $pull: { addresses: { _id: addressId } } },
      { new: true }
    ).lean();

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

    logger.info({ userId: auth.user.userId, customerId }, 'Customer address deleted');

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
    logger.error(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      'Customer address delete failed'
    );

    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to delete address',
      },
      { status: 500 }
    );
  }
}
