import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { sendPasswordResetEmail } from '@/lib/email';
import {
  checkRateLimit,
  getClientIdentifier,
  recordFailedAttempt,
  recordSuccessfulAttempt,
} from '@/lib/rate-limit';
import { createPasswordResetToken } from '@/lib/user-store';

const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email format'),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email } = forgotPasswordSchema.parse(body);

    const identifier = getClientIdentifier(req);

    // Check rate limit
    const rateLimit = await checkRateLimit(identifier);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: 'Too many password reset attempts. Please try again later.',
          resetTime: rateLimit.resetTime,
        },
        { status: 429 }
      );
    }

    const resetToken = await createPasswordResetToken(email);

    if (!resetToken) {
      // User doesn't exist, but we don't want to reveal this
      await recordFailedAttempt(identifier);
      return NextResponse.json({
        message: 'If an account exists, a password reset link has been sent.',
      });
    }

    // Send password reset email
    await sendPasswordResetEmail(email, resetToken);

    // Record successful attempt
    await recordSuccessfulAttempt(identifier);

    return NextResponse.json({
      message: 'If an account exists, a password reset link has been sent.',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.errors }, { status: 400 });
    }

    console.error('Forgot password error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
