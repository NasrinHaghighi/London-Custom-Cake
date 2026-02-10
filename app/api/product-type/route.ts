import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import ProductType from "../../../lib/models/productTypeSchema";
import { authenticateRequest } from "@/lib/auth";
import { createProductTypeSchema } from "@/lib/validators/productType";
import { z } from "zod";
import logger from "@/lib/logger";

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

    // Validate request body with Zod
    const validatedData = createProductTypeSchema.parse(requestBody);

    // Create product type with validated data
    const type = await ProductType.create(validatedData);

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
