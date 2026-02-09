
import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Admin from "@/lib/models/admin";

export async function GET(request: NextRequest) {
  await dbConnect();

  // 1. Get adminId from cookie
  const adminId = request.cookies.get('auth_token')?.value;
  if (!adminId) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  // 2. Validate admin
  const admin = await Admin.findById(adminId);
  if (!admin) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  // 3. Return admin list
  const admins = await Admin.find({}, "_id name email phone passwordHash createdAt");
  return NextResponse.json({ success: true, admins });
}
