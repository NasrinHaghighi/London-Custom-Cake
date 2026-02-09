import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import FlavorType from "@/lib/models/flavorTypeSchema";

// DELETE: Remove a flavor type

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Authentication: check auth_token cookie
  const authToken = request.cookies.get('auth_token')?.value;
  if (!authToken) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  await dbConnect();
  const { id } = params;

  const deletedFlavor = await FlavorType.findByIdAndDelete(id);

  if (!deletedFlavor) {
    return NextResponse.json({ success: false, message: "Flavor type not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true, message: "Flavor type deleted successfully" });
}
