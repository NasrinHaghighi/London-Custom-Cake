import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Admin from "@/lib/models/admin";
import ActivityLog from "@/lib/models/activitylog";
import { authenticateRequest } from "@/lib/auth";

export async function PATCH(request: NextRequest, context: { params: { id: string } }) {

  await dbConnect();
  const { id } = await context.params;

  // Authenticate request
  const auth = authenticateRequest(request);
  if (!auth.authenticated) {
    return auth.response;
  }

  // Set isActive to false (or clear passwordHash)
  const updated = await Admin.findByIdAndUpdate(id, { $set: { passwordHash: null } }, { new: true });
  if (!updated) {
    return NextResponse.json({ success: false, message: "Admin not found" }, { status: 404 });
  }

  // Log the deactivation in the activity log
  const performedBy = auth.user.email || "admin";
  let targetAdmin = id;
  if (updated && updated.name) {
    targetAdmin = updated.name;
  }
  await ActivityLog.create({
    action: 'admin_deactivated',
    performedBy,
    targetAdmin,
    details: `Admin account deactivated`,
    timestamp: new Date(),
  });

  return NextResponse.json({ success: true, admin: updated });
}
