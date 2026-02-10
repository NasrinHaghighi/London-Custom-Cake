import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import nodemailer from "nodemailer";
import dbConnect from "@/lib/mongodb";
import Admin from "../../../lib/models/admin";
import { authenticateRequest } from "@/lib/auth";
import { createAdminSchema } from "@/lib/validators/admin";
import { z } from "zod";
import logger from "@/lib/logger";

export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const requestBody = await request.json();

    // Validate request body with Zod
    const validatedData = createAdminSchema.parse(requestBody);
    const { name, email, phone } = validatedData;

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
      const auth = authenticateRequest(request);
      let performedBy = "system";
      if (auth.authenticated) {
        performedBy = auth.user.email || "admin";
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
    const duplicateField = existing.email === email ? 'email' : 'phone';
    logger.warn({ email, phone, duplicateField }, 'Attempt to add duplicate admin');
    return NextResponse.json(
      {
        success: false,
        message: "Validation failed",
        errors: [duplicateField === 'email' ? 'This email is already registered' : 'This phone number is already registered']
      },
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
    const auth = authenticateRequest(request);
    let performedBy = "system";
    if (auth.authenticated) {
      performedBy = auth.user.email || "admin";
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

    logger.info({ adminEmail: email }, 'Admin invitation sent');
    return NextResponse.json({ success: true, message: "Invitation sent" });
  } catch (err) {
    logger.error({ error: err instanceof Error ? err.message : 'Unknown error' }, 'Failed to send admin invitation email');
    return NextResponse.json({ success: false, message: "Failed to send invitation", error: String(err) }, { status: 500 });
  }
  } catch (error) {
    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      const errorMessages = error.issues.map((err: z.ZodIssue) => `${err.path.join('.')}: ${err.message}`);
      logger.warn({ errors: errorMessages }, 'Admin validation failed');

      return NextResponse.json({
        success: false,
        message: 'Validation failed',
        errors: errorMessages
      }, { status: 400 });
    }

    // Handle other errors
    logger.error({ error: error instanceof Error ? error.message : 'Unknown error' }, 'Admin creation failed');
    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to create admin'
    }, { status: 500 });
  }
}
