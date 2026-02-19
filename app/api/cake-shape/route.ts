import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import CakeShape from "@/lib/models/cakeShapeSchema";
import { authenticateRequest } from "@/lib/auth";
import { createCakeShapeSchema } from "@/lib/validators/cakeShape";
import { z } from "zod";
import logger from "@/lib/logger";

// GET: List all cake shapes
export async function GET(request: NextRequest) {
  // Authenticate request
  const auth = authenticateRequest(request);
  if (!auth.authenticated) {
    return auth.response;
  }

  try {
    await dbConnect();
    const shapes = await CakeShape.find().sort({ sortOrder: 1, name: 1 });
    return NextResponse.json({ success: true, shapes });
  } catch (error) {
    logger.error({ error: error instanceof Error ? error.message : 'Unknown error' }, 'Failed to fetch cake shapes');
    return NextResponse.json({
      success: false,
      message: 'Failed to fetch cake shapes'
    }, { status: 500 });
  }
}

// POST: Create a new cake shape
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
    const validatedData = createCakeShapeSchema.parse(requestBody);

    // Create cake shape with validated data
    const shape = await CakeShape.create(validatedData);

    logger.info({ userId: auth.user.userId, cakeShapeId: shape._id }, 'Cake shape created');

    return NextResponse.json({ success: true, shape }, { status: 201 });
  } catch (error) {
    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      const errorMessages = error.issues.map((err: z.ZodIssue) => `${err.path.join('.')}: ${err.message}`);
      logger.warn({ errors: errorMessages }, 'Cake shape validation failed');

      return NextResponse.json({
        success: false,
        message: 'Validation failed',
        errors: errorMessages
      }, { status: 400 });
    }

    // Handle other errors
    logger.error({ error: error instanceof Error ? error.message : 'Unknown error' }, 'Cake shape creation failed');

    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to create cake shape'
    }, { status: 500 });
  }
}
