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
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = loginSchema.parse(body);

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
