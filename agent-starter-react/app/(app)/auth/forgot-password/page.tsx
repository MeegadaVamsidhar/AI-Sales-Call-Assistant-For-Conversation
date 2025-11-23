'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage(data.message);
      } else {
        setError(data.error || 'Failed to send reset email');
      }
    } catch (err: unknown) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">Forgot Password</h2>
          <p className="mt-2 text-sm text-gray-600">Enter email to reset your password.</p>
        </div>

        <form onSubmit={onSubmit} className="mt-8 space-y-6">
          <div>
            <label htmlFor="email" className="sr-only">
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="relative block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-blue-500 focus:ring-blue-500 focus:outline-none sm:text-sm"
              placeholder="Email address"
            />
          </div>

          {error && <div className="text-center text-sm text-red-600">{error}</div>}

          {message && <div className="text-center text-sm text-green-600">{message}</div>}

          <div>
            <Button
              type="submit"
              disabled={loading}
              className="group relative flex w-full justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none disabled:opacity-50"
            >
              {loading ? 'Sending...' : 'Send Reset Link'}
            </Button>
          </div>

          <div className="text-center">
            <Link href="/auth/login" className="font-medium text-blue-600 hover:text-blue-500">
              Back to Login
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
