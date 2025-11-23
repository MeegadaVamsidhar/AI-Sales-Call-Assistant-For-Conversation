'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';

export default function VerifyEmailPage() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('No verification token provided');
      return;
    }

    const verifyEmail = async () => {
      try {
        const response = await fetch('/api/auth/verify-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });

        const data = await response.json();

        if (response.ok) {
          setStatus('success');
          setMessage('Your email has been verified successfully!');
        } else {
          setStatus('error');
          setMessage(data.error || 'Verification failed');
        }
      } catch {
        setStatus('error');
        setMessage('An error occurred during verification');
      }
    };

    verifyEmail();
  }, [token]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">Email Verification</h2>
        </div>

        <div className="mt-8 space-y-6">
          {status === 'loading' && (
            <div className="text-center">
              <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"></div>
              <p className="mt-4 text-gray-600">Verification in progress...</p>
            </div>
          )}

          {status === 'success' && (
            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                <svg
                  className="h-6 w-6 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <p className="mt-4 text-green-600">{message}</p>
              <div className="mt-6">
                <Link href="/auth/login">
                  <Button className="w-full">Continue to Login</Button>
                </Link>
              </div>
            </div>
          )}

          {status === 'error' && (
            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                <svg
                  className="h-6 w-6 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </div>
              <p className="mt-4 text-red-600">{message}</p>
              <div className="mt-6 space-y-3">
                <Link href="/auth/login">
                  <Button variant="outline" className="w-full">
                    Back to Login
                  </Button>
                </Link>
                <Link href="/auth/signup">
                  <Button className="w-full">Create New Account</Button>
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
