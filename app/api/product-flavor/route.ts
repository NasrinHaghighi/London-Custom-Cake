import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import ProductTypeFlavor from "@/lib/models/productTypeFlavorSchema";
import ProductType from "@/lib/models/productTypeSchema";
import FlavorType from "@/lib/models/flavorTypeSchema";
import { authenticateRequest } from "@/lib/auth";
import { createProductFlavorSchema } from "@/lib/validators/productFlavor";
import { z } from "zod";
import logger from "@/lib/logger";

// GET: List all product-flavor combinations
export async function GET(request: NextRequest) {
  try {
    // Authenticate request
    const auth = authenticateRequest(request);
    if (!auth.authenticated) {
      return auth.response;
    }

    await dbConnect();

    // Get query parameters for filtering
    const { searchParams } = new URL(request.url);
    const productTypeId = searchParams.get('productTypeId');
    const flavorId = searchParams.get('flavorId');
    const isAvailable = searchParams.get('isAvailable');

    // Build filter
    const filter: Record<string, unknown> = {};
    if (productTypeId) filter.productTypeId = productTypeId;
    if (flavorId) filter.flavorId = flavorId;
    if (isAvailable !== null && isAvailable !== undefined) {
      filter.isAvailable = isAvailable === 'true';
    }

    // Fetch combinations with populated references
    const combinations = await ProductTypeFlavor.find(filter)
      .populate('productTypeId', 'name pricingMethod unitPrice pricePerKg')
      .populate('flavorId', 'name description hasExtraPrice extraPricePerUnit extraPricePerKg')
      .sort({ createdAt: -1 });

    logger.info({ count: combinations.length, filter }, 'Product-flavor combinations fetched');

    return NextResponse.json({ success: true, combinations });
  } catch (error) {
    logger.error({ error: error instanceof Error ? error.message : 'Unknown error' }, 'Failed to fetch product-flavor combinations');
    return NextResponse.json(
      { success: false, message: 'Failed to fetch combinations' },
      { status: 500 }
    );
  }
}

// POST: Create a new product-flavor combination
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
    const validatedData = createProductFlavorSchema.parse(requestBody);

    // Verify product type exists
    const productType = await ProductType.findById(validatedData.productTypeId);
    if (!productType) {
      return NextResponse.json(
        { success: false, message: 'Product type not found' },
        { status: 404 }
      );
    }

    // Verify flavor type exists
    const flavorType = await FlavorType.findById(validatedData.flavorId);
    if (!flavorType) {
      return NextResponse.json(
        { success: false, message: 'Flavor type not found' },
        { status: 404 }
      );
    }

    // Check if combination already exists
    const existing = await ProductTypeFlavor.findOne({
      productTypeId: validatedData.productTypeId,
      flavorId: validatedData.flavorId,
    });

    if (existing) {
      return NextResponse.json(
        {
          success: false,
          message: 'This product-flavor combination already exists',
          errors: ['This combination is already configured']
        },
        { status: 400 }
      );
    }

    // Create combination
    const combination = await ProductTypeFlavor.create(validatedData);

    // Populate references for response
    await combination.populate('productTypeId', 'name');
    await combination.populate('flavorId', 'name');

    logger.info({
      combinationId: combination._id,
      productType: productType.name,
      flavor: flavorType.name,
      userId: auth.user.userId
    }, 'Product-flavor combination created');

    return NextResponse.json({ success: true, combination });
  } catch (error) {
    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      const errorMessages = error.issues.map((err: z.ZodIssue) => `${err.path.join('.')}: ${err.message}`);
      logger.warn({ errors: errorMessages }, 'Product-flavor validation failed');

      return NextResponse.json({
        success: false,
        message: 'Validation failed',
        errors: errorMessages
      }, { status: 400 });
    }

    // Handle duplicate key error (MongoDB unique index)
    if (error instanceof Error && 'code' in error && error.code === 11000) {
      return NextResponse.json({
        success: false,
        message: 'This product-flavor combination already exists',
        errors: ['This combination is already configured']
      }, { status: 400 });
    }

    logger.error({ error: error instanceof Error ? error.message : 'Unknown error' }, 'Product-flavor creation failed');

    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to create combination'
    }, { status: 500 });
  }
}
