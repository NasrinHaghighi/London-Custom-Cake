import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import ProductType from "@/lib/models/productTypeSchema";
import { authenticateRequest } from "@/lib/auth";
import { updateProductTypeSchema } from "@/lib/validators/productType";
import { z } from "zod";
import logger from "@/lib/logger";
import mongoose from "mongoose";

// PUT: Update a product type
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
    const { id } = await params;

    const requestBody = await request.json();

    // Validate request body with Zod
    const validatedData = updateProductTypeSchema.parse(requestBody);

    const normalizedData = { ...validatedData };
    normalizedData.measurement_type = normalizedData.pricingMethod === 'perkg' ? 'weight' : 'quantity';

    if (normalizedData.measurement_type === 'quantity') {
      const syncedQuantity = normalizedData.minQuantity ?? normalizedData.base_quantity;
      if (syncedQuantity !== undefined) {
        const normalizedQuantity = Math.max(1, Math.floor(syncedQuantity));
        normalizedData.base_quantity = normalizedQuantity;
        normalizedData.minQuantity = normalizedQuantity;
      }
      normalizedData.base_weight = undefined;
    }

    if (normalizedData.measurement_type === 'weight') {
      const syncedWeight = normalizedData.minWeight ?? normalizedData.base_weight;
      if (syncedWeight !== undefined) {
        const normalizedWeight = syncedWeight > 0 ? syncedWeight : 1;
        normalizedData.base_weight = normalizedWeight;
        normalizedData.minWeight = normalizedWeight;
      }
      normalizedData.base_quantity = undefined;
    }

    // Convert shapeIds strings to ObjectIds
    const dataToUpdate = {
      ...normalizedData,
      shapeIds: normalizedData.shapeIds?.map((id: string) => new mongoose.Types.ObjectId(id)) || []
    };

    // Update product type with validated data
    const updatedType = await ProductType.findByIdAndUpdate(
      id,
      dataToUpdate,
      { new: true, runValidators: true }
    );

    if (!updatedType) {
      return NextResponse.json({
        success: false,
        message: "Product type not found"
      }, { status: 404 });
    }

    logger.info({ userId: auth.user.userId, productTypeId: id }, 'Product type updated');

    return NextResponse.json({ success: true, type: updatedType });
  } catch (error) {
    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      const errorMessages = error.issues.map((err: z.ZodIssue) => `${err.path.join('.')}: ${err.message}`);
      logger.warn({ errors: errorMessages, productTypeId: (await params).id }, 'Product type update validation failed');

      return NextResponse.json({
        success: false,
        message: 'Validation failed',
        errors: errorMessages
      }, { status: 400 });
    }

    // Handle other errors
    logger.error({ error: error instanceof Error ? error.message : 'Unknown error' }, 'Product type update failed');

    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to update product type'
    }, { status: 500 });
  }
}

// DELETE: Remove a product type
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Authenticate request
  const auth = authenticateRequest(request);
  if (!auth.authenticated) {
    return auth.response;
  }

  await dbConnect();
  const { id } = await params;

  const deletedType = await ProductType.findByIdAndDelete(id);

  if (!deletedType) {
    return NextResponse.json({ success: false, message: "Product type not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true, message: "Product type deleted successfully" });
}
