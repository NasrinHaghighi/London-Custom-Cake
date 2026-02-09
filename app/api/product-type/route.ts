import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import ProductType from "../../../lib/models/productTypeSchema";

// GET: List all product types

export async function GET(request: NextRequest) {
  // Authentication: check auth_token cookie
  const authToken = request.cookies.get('auth_token')?.value;
  if (!authToken) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }
  await dbConnect();
  const types = await ProductType.find().sort({ sortOrder: 1, name: 1 });
  return NextResponse.json({ success: true, types });
}

// POST: Create a new product type

export async function POST(request: NextRequest) {
  // Authentication: check auth_token cookie
  const authToken = request.cookies.get('auth_token')?.value;
  if (!authToken) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  await dbConnect();

  const requestBody = await request.json();

  // Debug: Log what we receive
  console.log('Received POST data:', requestBody);

  const {
    name,
    description,
    isActive,
    sortOrder,
    pricingMethod,
    unitPrice,
    minQuantity,
    maxQuantity,
    pricePerKg,
    minWeight,
    maxWeight
  } = requestBody;

  // Validation: Ensure correct pricing fields based on pricingMethod
  if (pricingMethod === 'perunit') {
    if (!unitPrice) {
      return NextResponse.json({
        success: false,
        message: "Unit price is required for per-unit pricing"
      }, { status: 400 });
    }
  } else if (pricingMethod === 'perkg') {
    if (!pricePerKg) {
      return NextResponse.json({
        success: false,
        message: "Price per kilogram is required for per-kg pricing"
      }, { status: 400 });
    }
  }

  const type = await ProductType.create({
    name,
    description,
    isActive,
    sortOrder,
    pricingMethod,
    unitPrice,
    minQuantity,
    maxQuantity,
    pricePerKg,
    minWeight,
    maxWeight
  });

  // Debug: Log what was saved
  console.log('Saved to DB:', type);

  return NextResponse.json({ success: true, type });
}
