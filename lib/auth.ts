import jwt from 'jsonwebtoken';
import { NextRequest, NextResponse } from 'next/server';

// Get JWT secret from environment variable
const JWT_SECRET = process.env.JWT_SECRET || '';

if (!JWT_SECRET) {
  console.warn('⚠️  WARNING: JWT_SECRET is not set in environment variables!');
}

// JWT Payload interface
export interface JWTPayload {
  userId: string;
  phone: string;
  email: string;
  isAdmin?: boolean;
}

// Extended payload with timestamps (added by jwt.sign)
export interface JWTPayloadWithTimestamps extends JWTPayload {
  iat: number; // Issued at
  exp: number; // Expires at
}

/**
 * Generate a JWT token for a user
 * @param payload User data to include in token
 * @returns Signed JWT token
 */
export const generateToken = (payload: JWTPayload): string => {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: '24h', // Token expires in 24 hours
    algorithm: 'HS256',
  });
};

/**
 * Verify and decode a JWT token
 * @param token JWT token to verify
 * @returns Decoded payload if valid, null if invalid/expired
 */
export const verifyToken = (token: string): JWTPayloadWithTimestamps | null => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      algorithms: ['HS256'],
    }) as JWTPayloadWithTimestamps;
    return decoded;
  } catch (error) {
    // Token is invalid, expired, or malformed
    if (error instanceof jwt.TokenExpiredError) {
      console.log('Token expired');
    } else if (error instanceof jwt.JsonWebTokenError) {
      console.log('Invalid token');
    }
    return null;
  }
};

/**
 * Middleware to authenticate requests
 * Extracts and verifies JWT token from cookies
 * @param request Next.js request object
 * @returns Object containing authenticated user or error response
 */
export const authenticateRequest = (
  request: NextRequest
): { authenticated: true; user: JWTPayloadWithTimestamps } | { authenticated: false; response: NextResponse } => {
  // Get token from cookie
  const token = request.cookies.get('auth_token')?.value;

  if (!token) {
    return {
      authenticated: false,
      response: NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      ),
    };
  }

  // Verify token
  const user = verifyToken(token);

  if (!user) {
    return {
      authenticated: false,
      response: NextResponse.json(
        { success: false, message: 'Invalid or expired token' },
        { status: 401 }
      ),
    };
  }

  return {
    authenticated: true,
    user,
  };
};

/**
 * Check if user has admin privileges
 * @param user Decoded JWT payload
 * @returns True if user is admin
 */
export const isAdmin = (user: JWTPayload): boolean => {
  return user.isAdmin === true;
};
