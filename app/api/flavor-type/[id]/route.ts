import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import FlavorType from "@/lib/models/flavorTypeSchema";
import { authenticateRequest } from "@/lib/auth";

// DELETE: Remove a flavor type
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Authenticate request
  const auth = authenticateRequest(request);
  if (!auth.authenticated) {
    return auth.response;
  }

  await dbConnect();
  const { id } = await params;

  const deletedFlavor = await FlavorType.findByIdAndDelete(id);

  if (!deletedFlavor) {
    return NextResponse.json({ success: false, message: "Flavor type not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true, message: "Flavor type deleted successfully" });
}
