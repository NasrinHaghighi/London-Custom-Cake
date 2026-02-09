import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import dbConnect from "@/lib/mongodb";
import Admin from "../../../lib/models/admin";

export async function POST(req: NextRequest) {
  await dbConnect();

  const { token, password } = await req.json();

  if (!token || !password) {
    return NextResponse.json({ message: "Missing data" }, { status: 400 });
  }

  const admin = await Admin.findOne({
    token,
    tokenExpiresAt: { $gt: new Date() },
  });

  if (!admin) {
    return NextResponse.json(
      { message: "Invalid or expired token" },
      { status: 400 }
    );
  }

  admin.passwordHash = await bcrypt.hash(password, 10);
  admin.token = undefined;
  admin.tokenExpiresAt = undefined;

  await admin.save();

  return NextResponse.json({ success: true, message: "Invitation sent" });
}
