import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { sendWelcomeEmail } from '@/lib/email';
import { verifyEmail } from '@/lib/user-store';

const verifyEmailSchema = z.object({
  token: z.string().min(1, 'Token is required'),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { token } = verifyEmailSchema.parse(body);

    const verifiedEmail = await verifyEmail(token);

    if (!verifiedEmail) {
      return NextResponse.json({ error: 'Invalid or expired verification token' }, { status: 400 });
    }

    // Send welcome email (best-effort)
    try {
      await sendWelcomeEmail(verifiedEmail);
    } catch (_) {
      // non-fatal in dev
    }

    return NextResponse.json({
      message: 'Email verified successfully',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.errors }, { status: 400 });
    }

    console.error('Email verification error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
