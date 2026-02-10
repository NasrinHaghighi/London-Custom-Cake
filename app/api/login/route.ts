import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import dbConnect from '../../../lib/mongodb';
import Admin from '../../../lib/models/admin';
import { generateToken } from '../../../lib/auth';
import logger from '../../../lib/logger';
import { loginSchema } from '@/lib/validators/login';
import { z } from 'zod';

export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const requestBody = await request.json();

    // Validate request body with Zod
    const validatedData = loginSchema.parse(requestBody);
    const { phone, password } = validatedData;

    logger.info({ phone }, 'Login attempt');

    // Find admin account
    const account = await Admin.findOne({ phone });

    if (!account) {
      logger.warn({ phone }, 'Login failed: User not found');
      return NextResponse.json(
        { success: false, message: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Verify password
    const hash = account.passwordHash;
    if (!hash) {
      return NextResponse.json(
        { success: false, message: 'Account not activated. Please set password first.' },
        { status: 401 }
      );
    }

    const isValid = await bcrypt.compare(password, hash);

    if (!isValid) {
      logger.warn({ phone, userId: account._id.toString() }, 'Login failed: Invalid password');
      return NextResponse.json(
        { success: false, message: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Generate JWT token with user data
    const token = generateToken({
      userId: account._id.toString(),
      phone: account.phone,
      email: account.email,
      isAdmin: true, // All users in Admin collection are admins
    });

    logger.info({
      userId: account._id.toString(),
      email: account.email,
      phone: account.phone
    }, 'Login successful');

    const response = NextResponse.json({
      success: true,
      message: 'Login successful',
      user: {
        name: account.name,
        email: account.email,
        phone: account.phone,
      },
    });

    // Set secure HTTP-only cookie with JWT
    response.cookies.set('auth_token', token, {
      httpOnly: true, // Prevents JavaScript access (XSS protection)
      secure: process.env.NODE_ENV === 'production', // HTTPS only in production
      path: '/',
      maxAge: 60 * 60 * 24, // 1 day
      sameSite: 'strict', // CSRF protection
    });

    return response;
  } catch (error) {
    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      const errorMessages = error.issues.map((err: z.ZodIssue) => `${err.path.join('.')}: ${err.message}`);
      logger.warn({ errors: errorMessages }, 'Login validation failed');

      return NextResponse.json({
        success: false,
        message: 'Validation failed',
        errors: errorMessages
      }, { status: 400 });
    }

    logger.error({ error: error instanceof Error ? error.message : 'Unknown error' }, 'Login error');
    return NextResponse.json(
      { success: false, message: 'Server error during login' },
      { status: 500 }
    );
  }
}

