import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import FlavorType from "@/lib/models/flavorTypeSchema";

// GET: List all flavor types

export async function GET(request: NextRequest) {
  // Authentication: check auth_token cookie
  const authToken = request.cookies.get('auth_token')?.value;
  if (!authToken) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }
  await dbConnect();
  const flavors = await FlavorType.find().sort({ sortOrder: 1, name: 1 });
  return NextResponse.json({ success: true, flavors });
}

// POST: Create a new flavor type

export async function POST(request: NextRequest) {
  // Authentication: check auth_token cookie
  const authToken = request.cookies.get('auth_token')?.value;
  if (!authToken) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }
  await dbConnect();
  const { name, description, isActive, sortOrder } = await request.json();
  const flavor = await FlavorType.create({ name, description, isActive, sortOrder });
  return NextResponse.json({ success: true, flavor });
}
