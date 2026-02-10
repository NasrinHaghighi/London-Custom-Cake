import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Admin from "@/lib/models/admin";
import ActivityLog from "@/lib/models/activitylog";
import { authenticateRequest } from "@/lib/auth";

export async function DELETE(request: NextRequest, context: { params: { id: string } }) {
  await dbConnect();
  const { id } = await context.params;
  console.log("Deleting admin with id:", id);

  // Authenticate request
  const auth = authenticateRequest(request);
  if (!auth.authenticated) {
    return auth.response;
  }


  // Delete the admin
  const deleted = await Admin.findByIdAndDelete(id);
  if (!deleted) {
    return NextResponse.json({ success: false, message: "Admin not found" }, { status: 404 });
  }

  // Log the deletion in the activity log
  const performedBy = auth.user.email || "admin";
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
