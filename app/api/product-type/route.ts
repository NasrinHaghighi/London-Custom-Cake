import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import ProductType from "../../../lib/models/productTypeSchema";
import { authenticateRequest } from "@/lib/auth";
import { createProductTypeSchema } from "@/lib/validators/productType";
import { z } from "zod";
import logger from "@/lib/logger";
import mongoose from "mongoose";

// GET: List all product types
export async function GET(request: NextRequest) {
  // Authenticate request
  const auth = authenticateRequest(request);
  if (!auth.authenticated) {
    return auth.response;
  }

  await dbConnect();
  const types = await ProductType.find().sort({ sortOrder: 1, name: 1 });
  return NextResponse.json({ success: true, types });
}

// POST: Create a new product type
export async function POST(request: NextRequest) {
  try {
    // Authenticate request
    const auth = authenticateRequest(request);
    if (!auth.authenticated) {
      return auth.response;
    }

    await dbConnect();

    const requestBody = await request.json();
    console.log('🔴 API ROUTE - Received request body:', requestBody);

    // Validate request body with Zod
    const validatedData = createProductTypeSchema.parse(requestBody);
    console.log('🔴 API ROUTE - After Zod validation:', validatedData);

    const normalizedData = { ...validatedData };
    normalizedData.measurement_type = normalizedData.pricingMethod === 'perkg' ? 'weight' : 'quantity';

    if (normalizedData.measurement_type === 'quantity') {
      const syncedQuantity = normalizedData.minQuantity ?? normalizedData.base_quantity;
      if (syncedQuantity !== undefined) {
        normalizedData.base_quantity = syncedQuantity;
        normalizedData.minQuantity = syncedQuantity;
      }
      normalizedData.base_weight = undefined;
    }

    if (normalizedData.measurement_type === 'weight') {
      const syncedWeight = normalizedData.minWeight ?? normalizedData.base_weight;
      if (syncedWeight !== undefined) {
        normalizedData.base_weight = syncedWeight;
        normalizedData.minWeight = syncedWeight;
      }
      normalizedData.base_quantity = undefined;
    }

    // Convert shapeIds strings to ObjectIds
    const dataToSave = {
      ...normalizedData,
      shapeIds: normalizedData.shapeIds?.map((id: string) => new mongoose.Types.ObjectId(id)) || []
    };
    console.log('🔴 API ROUTE - Data to save (with ObjectIds):', dataToSave);

    // Create product type with validated data
    const type = await ProductType.create(dataToSave);
    console.log('🔴 API ROUTE - Created in DB:', type.toObject());

    logger.info({ userId: auth.user.userId, productTypeId: type._id }, 'Product type created');

    return NextResponse.json({ success: true, type });
  } catch (error) {
    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      const errorMessages = error.issues.map((err: z.ZodIssue) => `${err.path.join('.')}: ${err.message}`);
      logger.warn({ errors: errorMessages }, 'Product type validation failed');

      return NextResponse.json({
        success: false,
        message: 'Validation failed',
        errors: errorMessages
      }, { status: 400 });
    }

    // Handle other errors
    logger.error({ error: error instanceof Error ? error.message : 'Unknown error' }, 'Product type creation failed');

    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to create product type'
    }, { status: 500 });
  }
}
