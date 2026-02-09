import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import ProductType from "@/lib/models/productTypeSchema";

// PUT: Update a product type

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Authentication: check auth_token cookie
  const authToken = request.cookies.get('auth_token')?.value;
  if (!authToken) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  await dbConnect();
  const { id } = await params;

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
  } = await request.json();

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

  const updatedType = await ProductType.findByIdAndUpdate(
    id,
    {
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
    },
    { new: true, runValidators: true }
  );

  if (!updatedType) {
    return NextResponse.json({ success: false, message: "Product type not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true, type: updatedType });
}

// DELETE: Remove a product type

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Authentication: check auth_token cookie
  const authToken = request.cookies.get('auth_token')?.value;
  if (!authToken) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  await dbConnect();
  const { id } = await params;

  const deletedType = await ProductType.findByIdAndDelete(id);

  if (!deletedType) {
    return NextResponse.json({ success: false, message: "Product type not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true, message: "Product type deleted successfully" });
}
