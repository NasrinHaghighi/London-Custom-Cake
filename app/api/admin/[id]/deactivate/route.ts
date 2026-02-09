import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Admin from "@/lib/models/admin";
import ActivityLog from "@/lib/models/activitylog";

export async function PATCH(request: NextRequest, context: { params: { id: string } }) {

  await dbConnect();
  const { id } =await context.params;

  // Authentication: check auth_token cookie
  const adminId = request.cookies.get('auth_token')?.value;
  if (!adminId) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }
  const authAdmin = await Admin.findById(adminId);
  if (!authAdmin) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  // Set isActive to false (or clear passwordHash)
  const updated = await Admin.findByIdAndUpdate(id, { $set: { passwordHash: null } }, { new: true });
  if (!updated) {
    return NextResponse.json({ success: false, message: "Admin not found" }, { status: 404 });
  }

  // Log the deactivation in the activity log
  let performedBy = adminId;
  if (authAdmin && authAdmin.name) {
    performedBy = authAdmin.name;
  }
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
