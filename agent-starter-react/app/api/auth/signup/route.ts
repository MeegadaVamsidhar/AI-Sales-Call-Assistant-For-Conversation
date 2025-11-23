import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { authCookieOptions, createAuthToken } from '@/lib/auth';
import { sendVerificationEmail } from '@/lib/email';
import {
  checkRateLimit,
  getClientIdentifier,
  recordFailedAttempt,
  recordSuccessfulAttempt,
} from '@/lib/rate-limit';
import { createUser } from '@/lib/user-store';

const signupSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = signupSchema.parse(body);

    const identifier = getClientIdentifier(req);

    // Check rate limit
    const rateLimit = await checkRateLimit(identifier);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: 'Too many signup attempts. Please try again later.',
          resetTime: rateLimit.resetTime,
        },
        { status: 429 }
      );
    }

    const user = await createUser(email, password);

    // Send verification email
    if (user.emailVerificationToken) {
      await sendVerificationEmail(user.email, user.emailVerificationToken);
    }

    // Record successful attempt
    await recordSuccessfulAttempt(identifier);

    const token = await createAuthToken({ sub: user.id, email: user.email });
    const res = NextResponse.json({
      id: user.id,
      email: user.email,
      emailVerified: user.emailVerified,
      message: 'Account created successfully. Please check your email to verify your account.',
    });
    const { name, options } = authCookieOptions();
    res.cookies.set(name, token, options);
    return res;
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.errors }, { status: 400 });
    }

    // Record failed attempt for certain errors
    if (
      error instanceof Error &&
      (error.message.includes('already registered') || error.message.includes('validation failed'))
    ) {
      const identifier = getClientIdentifier(req);
      await recordFailedAttempt(identifier);
    }

    console.error('Signup error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Signup failed' },
      { status: 400 }
    );
  }
}
