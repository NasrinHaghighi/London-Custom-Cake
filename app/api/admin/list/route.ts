
import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Admin from "@/lib/models/admin";
import { authenticateRequest } from "@/lib/auth";

export async function GET(request: NextRequest) {
  await dbConnect();

  // Authenticate request
  const auth = authenticateRequest(request);
  if (!auth.authenticated) {
    return auth.response;
  }

  // 3. Return admin list
  const admins = await Admin.find({}, "_id name email phone passwordHash createdAt");
  return NextResponse.json({ success: true, admins });
}
