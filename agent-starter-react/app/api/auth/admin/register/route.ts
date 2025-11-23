import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    // Get the request body
    const body = await req.json();
    console.log('Received registration request:', body);

    // Forward the request to the FastAPI backend
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:8000';
    console.log('Forwarding to backend:', `${backendUrl}/api/auth/admin/register`);

    const response = await fetch(`${backendUrl}/api/auth/admin/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    console.log('Backend response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Backend error response:', errorText);
      return NextResponse.json(
        { detail: `Backend error: ${errorText}` },
        { status: response.status }
      );
    }

    // Get the response data
    const data = await response.json();
    console.log('Backend response data:', data);

    // Return the response with the same status code
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Admin registration error:', error);

    // Check if it's a connection error
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return NextResponse.json(
        {
          detail:
            'Cannot connect to backend server. Make sure FastAPI is running on http://localhost:8000',
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      {
        detail: `Internal server error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      },
      { status: 500 }
    );
  }
}
