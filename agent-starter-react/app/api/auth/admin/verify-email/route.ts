import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    // Get the token from query parameters
    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json({ detail: 'Verification token is required' }, { status: 400 });
    }

    // Forward the request to the FastAPI backend
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:8000';
    const response = await fetch(`${backendUrl}/api/auth/admin/verify-email?token=${token}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Get the response data
    const data = await response.json();

    // For successful verification, redirect to a success page or return JSON
    if (response.ok) {
      // You can redirect to a success page or return JSON
      return NextResponse.json(data, { status: response.status });
    } else {
      return NextResponse.json(data, { status: response.status });
    }
  } catch (error) {
    console.error('Admin verification error:', error);
    return NextResponse.json({ detail: 'Internal server error' }, { status: 500 });
  }
}
