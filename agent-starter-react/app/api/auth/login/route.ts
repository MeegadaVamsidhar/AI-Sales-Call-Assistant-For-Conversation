import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { authCookieOptions, createAuthToken } from '@/lib/auth';
import {
  checkRateLimit,
  getClientIdentifier,
  recordFailedAttempt,
  recordSuccessfulAttempt,
} from '@/lib/rate-limit';
import { verifyUser } from '@/lib/user-store';

const loginSchema = z.object({
  email: z.string().optional(),
  password: z.string().min(1, 'Password is required'),
  employee_id: z.string().optional(),
  userType: z.enum(['customer', 'admin']).default('customer'),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, employee_id, userType } = loginSchema.parse(body);

    // Handle admin login - forward to backend
    if (userType === 'admin') {
      if (!employee_id) {
        return NextResponse.json(
          { error: 'Employee ID is required for admin login' },
          { status: 400 }
        );
      }

      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
      try {
        const response = await fetch(`${backendUrl}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ employee_id, password, userType }),
        });

        const adminData = await response.json();

        if (!response.ok) {
          return NextResponse.json(
            { error: adminData.detail || 'Invalid admin credentials' },
            { status: response.status }
          );
        }

        // Create auth token for admin
        const token = await createAuthToken({
          sub: adminData.user.id,
          email: adminData.user.email,
        });

        const res = NextResponse.json(adminData.user);
        const { name, options } = authCookieOptions();
        res.cookies.set(name, token, options);
        return res;
      } catch (error) {
        console.error('Admin login error:', error);
        return NextResponse.json(
          { error: 'Failed to connect to authentication server' },
          { status: 500 }
        );
      }
    }

    // Customer login flow
    if (!email) {
      return NextResponse.json(
        { error: 'Email is required for customer login' },
        { status: 400 }
      );
    }

    const identifier = getClientIdentifier(req);

    // Check rate limit
    const rateLimit = await checkRateLimit(identifier);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: 'Too many failed attempts. Please try again later.',
          resetTime: rateLimit.resetTime,
        },
        { status: 429 }
      );
    }

    const user = await verifyUser(email, password);
    if (!user) {
      await recordFailedAttempt(identifier);
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // Check if email is verified
    if (!user.emailVerified) {
      return NextResponse.json({ error: 'Please verify your email' }, { status: 403 });
    }

    // Record successful attempt
    await recordSuccessfulAttempt(identifier);

    const token = await createAuthToken({ sub: user.id, email: user.email });
    const res = NextResponse.json({
      id: user.id,
      email: user.email,
      emailVerified: user.emailVerified,
    });
    const { name, options } = authCookieOptions();
    res.cookies.set(name, token, options);
    return res;
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.errors }, { status: 400 });
    }

    console.error('Login error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
