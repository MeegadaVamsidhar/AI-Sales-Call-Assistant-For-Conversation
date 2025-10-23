import { NextResponse } from 'next/server';
import { authCookieOptions } from '@/lib/auth';

export async function POST() {
  const res = NextResponse.json({ ok: true });
  const { name, options } = authCookieOptions();
  res.cookies.set(name, '', { ...options, maxAge: 0 });
  // Clear NextAuth session cookies as well
  res.cookies.set('next-auth.session-token', '', { path: '/', httpOnly: true, maxAge: 0 });
  res.cookies.set('__Secure-next-auth.session-token', '', {
    path: '/',
    httpOnly: true,
    maxAge: 0,
    secure: true,
  });
  res.cookies.set('next-auth.csrf-token', '', { path: '/', maxAge: 0 });
  return res;
}
