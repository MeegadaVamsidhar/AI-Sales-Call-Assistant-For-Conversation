import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  checkRateLimit,
  getClientIdentifier,
  recordFailedAttempt,
  recordSuccessfulAttempt,
} from '@/lib/rate-limit';
import { resetPassword } from '@/lib/user-store';

const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { token, password } = resetPasswordSchema.parse(body);

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

    const success = await resetPassword(token, password);

    if (!success) {
      await recordFailedAttempt(identifier);
      return NextResponse.json({ error: 'Invalid or expired reset token' }, { status: 400 });
    }

    // Record successful attempt
    await recordSuccessfulAttempt(identifier);

    return NextResponse.json({
      message: 'Password reset successfully',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.errors }, { status: 400 });
    }

    console.error('Password reset error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
