import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const { name, email, message } = await req.json();
  if (!name || !email || !message) {
    return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
  }
  // For demo: log the submission. In production, send email or store in DB.
  console.log('Contact message:', { name, email, message });
  return NextResponse.json({ ok: true });
}
