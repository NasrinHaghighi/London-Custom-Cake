import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Admin from "@/lib/models/admin";
import ActivityLog from "@/lib/models/activitylog";

export async function DELETE(request: NextRequest, context: { params: { id: string } }) {
  await dbConnect();
  const { id } = await context.params;
console.log("Deleting admin with id:", id);
  // Authentication: check auth_token cookie
  const adminId = request.cookies.get('auth_token')?.value;
  if (!adminId) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }
  const authAdmin = await Admin.findById(adminId);
  if (!authAdmin) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }


  // Delete the admin
  const deleted = await Admin.findByIdAndDelete(id);
  if (!deleted) {
    return NextResponse.json({ success: false, message: "Admin not found" }, { status: 404 });
  }

  // Log the deletion in the activity log
  let performedBy = adminId;
  if (authAdmin && authAdmin.name) {
    performedBy = authAdmin.name;
  }
  let targetAdmin = id;
  if (deleted && deleted.name) {
    targetAdmin = deleted.name;
  }
  await ActivityLog.create({
    action: 'admin_deleted',
    performedBy,
    targetAdmin,
    details: `Admin account deleted`,
    timestamp: new Date(),
  });

  return NextResponse.json({ success: true });
}
