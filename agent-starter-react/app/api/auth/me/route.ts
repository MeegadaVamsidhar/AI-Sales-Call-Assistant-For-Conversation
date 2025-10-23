import { getServerSession } from 'next-auth';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { authCookieOptions, verifyAuthToken } from '@/lib/auth';
import { authOptions } from '@/lib/nextauth';
import { getUserById } from '@/lib/user-store';

export async function GET() {
  const cookieStore = await cookies();
  const { name } = authCookieOptions();
  const token = cookieStore.get(name)?.value;
  if (!token) {
    // Fall back to NextAuth session
    try {
      const session = await getServerSession(authOptions);
      if (session?.user?.email) {
        return NextResponse.json({ user: { id: session.user.email, email: session.user.email } });
      }
    } catch {}
    return NextResponse.json({ user: null });
  }
  try {
    const payload = await verifyAuthToken(token);
    const user = await getUserById(payload.sub);
    // Fall back to JWT data if in-memory store has been reset
    const email = user?.email ?? payload.email;
    const id = user?.id ?? payload.sub;
    return NextResponse.json({ user: email ? { id, email } : null });
  } catch {
    return NextResponse.json({ user: null });
  }
}
