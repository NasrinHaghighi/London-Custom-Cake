import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import nodemailer from "nodemailer";
import dbConnect from "@/lib/mongodb";
import Admin from "../../../lib/models/admin";

export async function POST(request: NextRequest) {
  await dbConnect();

  const { name, email, phone } = await request.json();

  const existing = await Admin.findOne({ $or: [{ email }, { phone }] });
  const ActivityLog = (await import("@/lib/models/activitylog")).default;
  // If admin exists and is pending (no passwordHash), resend invitation
  if (existing && !existing.passwordHash) {
    const token = crypto.randomBytes(32).toString("hex");
    existing.token = token;
    existing.tokenExpiresAt = new Date(Date.now() + 1000 * 60 * 60);
    await existing.save();

    // Log activity: invitation resent
    try {
      const adminId = request.cookies.get('auth_token')?.value;
      let performedBy = "system";
      if (adminId) {
        const admin = await Admin.findById(adminId);
        if (admin) performedBy = admin.name;
      }
      await ActivityLog.create({
        action: "admin_invitation_resent",
        performedBy,
        targetAdmin: existing.name,
        details: `Invitation resent to ${name} (${email})`,
        timestamp: new Date(),
      });
    } catch (err) {
      console.error("Failed to log activity:", err);
    }

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });
    const link = `${process.env.NEXT_PUBLIC_BASE_URL}/set-password?token=${token}`;
    try {
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject: "Set your admin password",
        html: `
          <p>Hi ${name},</p>
          <p>Click the link below to set your password:</p>
          <a href="${link}">${link}</a>
          <p>This link expires in 1 hour.</p>
        `,
      });
      return NextResponse.json({ success: true, message: "Invitation resent" });
    } catch (err) {
      console.error("Failed to send email:", err);
      return NextResponse.json({ success: false, message: "Failed to resend invitation", error: String(err) }, { status: 500 });
    }
  }

  // If admin exists and is active, block
  if (existing) {
    return NextResponse.json(
      { success: false, message: "Admin already exists" },
      { status: 400 }
    );
  }

  // Otherwise, create new admin and send invitation
  const token = crypto.randomBytes(32).toString("hex");
  const newAdmin = await Admin.create({
    name,
    email,
    phone,
    token,
    tokenExpiresAt: new Date(Date.now() + 1000 * 60 * 60), // 1 hour
  });

  // Log activity: admin added
  try {
    // 1. Get admin ID from cookie
    const adminId = request.cookies.get('auth_token')?.value;
    let performedBy = "system";
    if (adminId) {
      const admin = await Admin.findById(adminId);
      if (admin) performedBy = admin.name;
    }
    await ActivityLog.create({
      action: "admin_added",
      performedBy, // now the real admin name if available
      targetAdmin: newAdmin.name,
      details: `Admin ${name} (${email}) invited`,
      timestamp: new Date(),
    });
  } catch (err) {
    console.error("Failed to log activity:", err);
    // Optionally, continue without failing the request
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    tls: {
      rejectUnauthorized: false,
    },
  });

  const link = `${process.env.NEXT_PUBLIC_BASE_URL}/set-password?token=${token}`;

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Set your admin password",
      html: `
        <p>Hi ${name},</p>
        <p>Click the link below to set your password:</p>
        <a href="${link}">${link}</a>
        <p>This link expires in 1 hour.</p>
      `,
    });
    return NextResponse.json({ success: true, message: "Invitation sent" });
  } catch (err) {
    console.error("Failed to send email:", err);
    return NextResponse.json({ success: false, message: "Failed to send invitation", error: String(err) }, { status: 500 });
  }
}
