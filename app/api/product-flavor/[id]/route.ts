import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import ProductTypeFlavor from "@/lib/models/productTypeFlavorSchema";
import { authenticateRequest } from "@/lib/auth";
import { updateProductFlavorSchema } from "@/lib/validators/productFlavor";
import { z } from "zod";
import logger from "@/lib/logger";

// PUT: Update a product-flavor combination
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
    const validatedData = updateProductFlavorSchema.parse(requestBody);

    // Update combination
    const updatedCombination = await ProductTypeFlavor.findByIdAndUpdate(
      id,
      validatedData,
      { new: true, runValidators: true }
    )
      .populate('productTypeId', 'name')
      .populate('flavorId', 'name');

    if (!updatedCombination) {
      return NextResponse.json({
        success: false,
        message: "Product-flavor combination not found"
      }, { status: 404 });
    }

    logger.info({
      userId: auth.user.userId,
      combinationId: id,
      updates: validatedData
    }, 'Product-flavor combination updated');

    return NextResponse.json({ success: true, combination: updatedCombination });
  } catch (error) {
    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      const errorMessages = error.issues.map((err: z.ZodIssue) => `${err.path.join('.')}: ${err.message}`);
      logger.warn({ errors: errorMessages, combinationId: (await params).id }, 'Product-flavor update validation failed');

      return NextResponse.json({
        success: false,
        message: 'Validation failed',
        errors: errorMessages
      }, { status: 400 });
    }

    logger.error({ error: error instanceof Error ? error.message : 'Unknown error' }, 'Product-flavor update failed');

    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to update combination'
    }, { status: 500 });
  }
}

// DELETE: Remove a product-flavor combination
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
    const { id } = await params;

    const deletedCombination = await ProductTypeFlavor.findByIdAndDelete(id);

    if (!deletedCombination) {
      return NextResponse.json({
        success: false,
        message: "Product-flavor combination not found"
      }, { status: 404 });
    }

    logger.info({
      userId: auth.user.userId,
      combinationId: id
    }, 'Product-flavor combination deleted');

    return NextResponse.json({
      success: true,
      message: 'Combination deleted successfully'
    });
  } catch (error) {
    logger.error({ error: error instanceof Error ? error.message : 'Unknown error' }, 'Product-flavor deletion failed');

    return NextResponse.json({
      success: false,
      message: 'Failed to delete combination'
    }, { status: 500 });
  }
}
