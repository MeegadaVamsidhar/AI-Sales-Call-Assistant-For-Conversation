'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Github } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('login');
  const [userType, setUserType] = useState('customer'); // 'customer' or 'admin'

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({
          email,
          password,
          employee_id: employeeId,
          userType,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Login failed');
      
      // Redirect based on user type using Next.js router
      if (userType === 'admin') {
        router.push('/admin/dashboard');
      } else {
        router.push('/');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="mb-2 text-xl font-semibold text-gray-900">
          {userType === 'admin' ? ' Admin Access' : 'Welcome'}
        </h2>
        <p className="text-sm text-gray-600">
          {userType === 'admin'
            ? 'Sign in to access the admin dashboard and manage orders'
            : 'Sign in to your account or create a new one'}
        </p>
      </div>

      {/* User Type Selector */}
      <div className="mb-4 flex rounded-lg bg-gray-100 p-1">
        <button
          type="button"
          onClick={() => setUserType('customer')}
          className={`flex flex-1 items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
            userType === 'customer'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          👤 Customer
        </button>
        <button
          type="button"
          onClick={() => setUserType('admin')}
          className={`flex flex-1 items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
            userType === 'admin'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          🛡️ Admin
        </button>
      </div>

      {/* Tab Switcher */}
      <div className="mb-6 flex rounded-lg bg-gray-100 p-1">
        <button
          type="button"
          onClick={() => setActiveTab('login')}
          className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'login'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Login
        </button>
        <Link
          href="/auth/signup"
          className="flex-1 rounded-md px-4 py-2 text-center text-sm font-medium text-gray-600 transition-colors hover:text-gray-900"
        >
          Sign Up
        </Link>
      </div>

      {error && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-4">
        {userType === 'admin' ? (
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Employee ID</label>
            <input
              type="text"
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              placeholder="EMP20241023ABC"
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-orange-500 focus:outline-none"
              required
              disabled={loading}
            />
          </div>
        ) : (
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500 focus:outline-none"
              required
              disabled={loading}
            />
          </div>
        )}

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500 focus:outline-none"
            required
            disabled={loading}
          />
        </div>

        <Button
          type="submit"
          className={`w-full py-2.5 text-white transition-all duration-300 ${
            userType === 'admin'
              ? 'bg-gradient-to-r from-red-600 via-orange-600 to-yellow-600 hover:from-red-700 hover:via-orange-700 hover:to-yellow-700'
              : 'bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-700 hover:via-purple-700 hover:to-pink-700'
          }`}
          disabled={loading}
        >
          {loading ? 'Please wait...' : userType === 'admin' ? '🛡️ Admin Sign In' : 'Sign In'}
        </Button>
      </form>

      {/* Social Auth Buttons - Only for customers */}
      {userType === 'customer' && (
        <>
          {/* Divider */}
          <div className="my-6 flex items-center">
            <div className="flex-1 border-t border-gray-300"></div>
            <span className="px-3 text-sm text-gray-500">or continue with</span>
            <div className="flex-1 border-t border-gray-300"></div>
          </div>

          <div className="space-y-3">
            <Button
              type="button"
              onClick={() => signIn('google', { callbackUrl: '/' })}
              variant="outline"
              className="flex w-full items-center justify-center gap-3 border-gray-300 py-2.5 hover:bg-gray-50"
              disabled={loading}
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Continue with Google
            </Button>

            <Button
              type="button"
              onClick={() => signIn('github', { callbackUrl: '/' })}
              variant="outline"
              className="flex w-full items-center justify-center gap-3 border-gray-300 py-2.5 hover:bg-gray-50"
              disabled={loading}
            >
              <Github className="h-5 w-5" />
              Continue with GitHub
            </Button>
          </div>
        </>
      )}

      {/* Footer Links */}
      <div className="mt-6 text-center">
        {userType === 'admin' ? (
          <div>
            <p className="text-sm text-gray-600">
              Need to create an admin account?{' '}
              <Link
                href="/auth/admin-signup"
                className="bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text font-medium text-transparent transition-all duration-300 hover:from-red-700 hover:to-orange-700"
              >
                Register as Admin
              </Link>
            </p>
            <Link
              href="/auth/forgot-password"
              className="mt-2 block bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-sm font-medium text-transparent transition-all duration-300 hover:from-red-700 hover:to-orange-700"
            >
              Forgot your password?
            </Link>
          </div>
        ) : (
          <div>
            <p className="text-sm text-gray-600">
              Don&apos;t have an account?{' '}
              <Link
                href="/auth/signup"
                className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text font-medium text-transparent transition-all duration-300 hover:from-blue-700 hover:to-purple-700"
              >
                Sign up
              </Link>
            </p>
            <Link
              href="/auth/forgot-password"
              className="mt-2 block bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-sm font-medium text-transparent transition-all duration-300 hover:from-blue-700 hover:to-purple-700"
            >
              Forgot your password?
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
