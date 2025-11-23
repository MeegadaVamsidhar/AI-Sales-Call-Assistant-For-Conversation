'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [token, setToken] = useState<string | null>(null);
  const searchParams = useSearchParams();

  useEffect(() => {
    const tokenParam = searchParams.get('token');
    if (!tokenParam) {
      setError('No reset token provided');
    } else {
      setToken(tokenParam);
    }
  }, [searchParams]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setMessage('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    // Password validation
    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    if (!/[A-Z]/.test(password)) {
      setError('Password must contain at least one uppercase letter');
      return;
    }

    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      setError('Password must contain at least one special character');
      return;
    }

    if (!token) {
      setError('No reset token provided');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage('Password reset successfully! You can now log in with your new password.');
      } else {
        setError(data.error || 'Failed to reset password');
      }
    } catch (err: unknown) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  if (!token && !error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">Reset Password</h2>
          <p className="mt-2 text-sm text-gray-600">Enter your new password below.</p>
        </div>

        {message ? (
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
        ) : (
          <form onSubmit={onSubmit} className="mt-8 space-y-6">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                New Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="relative mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-blue-500 focus:outline-none sm:text-sm"
                placeholder="Enter new password"
              />
              <div className="mt-2 text-xs text-gray-500">
                <p>Password must contain:</p>
                <ul className="list-inside list-disc space-y-1">
                  <li>At least 6 characters</li>
                  <li>One uppercase letter (A-Z)</li>
                  <li>One special character (!@#$%^&*)</li>
                </ul>
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="relative mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-blue-500 focus:outline-none sm:text-sm"
                placeholder="Confirm new password"
              />
            </div>

            {error && <div className="text-center text-sm text-red-600">{error}</div>}

            <div>
              <Button
                type="submit"
                disabled={loading}
                className="group relative flex w-full justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none disabled:opacity-50"
              >
                {loading ? 'Resetting...' : 'Reset Password'}
              </Button>
            </div>

            <div className="text-center">
              <Link href="/auth/login" className="font-medium text-blue-600 hover:text-blue-500">
                Back to Login
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
