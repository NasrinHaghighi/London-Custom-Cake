import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import FlavorType from "@/lib/models/flavorTypeSchema";
import { authenticateRequest } from "@/lib/auth";

// GET: List all flavor types
export async function GET(request: NextRequest) {
  // Authenticate request
  const auth = authenticateRequest(request);
  if (!auth.authenticated) {
    return auth.response;
  }

  await dbConnect();
  const flavors = await FlavorType.find().sort({ sortOrder: 1, name: 1 });
  return NextResponse.json({ success: true, flavors });
}

// POST: Create a new flavor type
export async function POST(request: NextRequest) {
  // Authenticate request
  const auth = authenticateRequest(request);
  if (!auth.authenticated) {
    return auth.response;
  }

  await dbConnect();
  const { name, description, isActive, sortOrder, hasExtraPrice, extraPricePerUnit, extraPricePerKg } = await request.json();
  const flavor = await FlavorType.create({
    name,
    description,
    isActive,
    sortOrder,
    hasExtraPrice,
    extraPricePerUnit,
    extraPricePerKg
  });
  return NextResponse.json({ success: true, flavor });
}
