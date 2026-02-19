import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import CakeShape from "@/lib/models/cakeShapeSchema";
import { authenticateRequest } from "@/lib/auth";
import { updateCakeShapeSchema } from "@/lib/validators/cakeShape";
import { z } from "zod";
import logger from "@/lib/logger";

// GET: Fetch a single cake shape
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
    const { id } = await params;

    const shape = await CakeShape.findById(id);

    if (!shape) {
      return NextResponse.json({
        success: false,
        message: "Cake shape not found"
      }, { status: 404 });
    }

    return NextResponse.json({ success: true, shape });
  } catch (error) {
    logger.error({ error: error instanceof Error ? error.message : 'Unknown error' }, 'Failed to fetch cake shape');
    return NextResponse.json({
      success: false,
      message: 'Failed to fetch cake shape'
    }, { status: 500 });
  }
}

// PUT: Update a cake shape
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
    const validatedData = updateCakeShapeSchema.parse(requestBody);

    // Update cake shape with validated data
    const updatedShape = await CakeShape.findByIdAndUpdate(
      id,
      validatedData,
      { new: true, runValidators: true }
    );

    if (!updatedShape) {
      return NextResponse.json({
        success: false,
        message: "Cake shape not found"
      }, { status: 404 });
    }

    logger.info({ userId: auth.user.userId, cakeShapeId: id }, 'Cake shape updated');

    return NextResponse.json({ success: true, shape: updatedShape });
  } catch (error) {
    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      const errorMessages = error.issues.map((err: z.ZodIssue) => `${err.path.join('.')}: ${err.message}`);
      logger.warn({ errors: errorMessages, cakeShapeId: (await params).id }, 'Cake shape update validation failed');

      return NextResponse.json({
        success: false,
        message: 'Validation failed',
        errors: errorMessages
      }, { status: 400 });
    }

    // Handle other errors
    logger.error({ error: error instanceof Error ? error.message : 'Unknown error' }, 'Cake shape update failed');

    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to update cake shape'
    }, { status: 500 });
  }
}

// DELETE: Remove a cake shape
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

    const deletedShape = await CakeShape.findByIdAndDelete(id);

    if (!deletedShape) {
      return NextResponse.json({
        success: false,
        message: "Cake shape not found"
      }, { status: 404 });
    }

    logger.info({ userId: auth.user.userId, cakeShapeId: id }, 'Cake shape deleted');

    return NextResponse.json({
      success: true,
      message: "Cake shape deleted successfully"
    });
  } catch (error) {
    logger.error({ error: error instanceof Error ? error.message : 'Unknown error' }, 'Cake shape deletion failed');
    return NextResponse.json({
      success: false,
      message: 'Failed to delete cake shape'
    }, { status: 500 });
  }
}
