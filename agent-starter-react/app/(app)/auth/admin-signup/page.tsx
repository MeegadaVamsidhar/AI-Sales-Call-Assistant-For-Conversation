'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Building, Lock, Mail, Shield, User } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AdminSignupPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    department: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/admin/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          department: formData.department || null,
        }),
      });

      if (!response.ok) {
        let errorMessage = 'Registration failed';
        const contentType = response.headers.get('content-type');

        try {
          if (contentType && contentType.includes('application/json')) {
            const errorData = await response.json();
            errorMessage = errorData?.detail || errorMessage;
          } else {
            const responseText = await response.text();
            errorMessage = responseText || errorMessage;
          }
        } catch {
          errorMessage = 'Registration failed';
        }

        throw new Error(errorMessage);
      }

      const data = await response.json();
      setSuccess(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg">
          <Shield className="h-8 w-8 text-white" />
        </div>

        <h2 className="mb-4 text-2xl font-bold text-gray-900">
          Admin Account Created Successfully!
        </h2>

        <p className="mb-6 text-gray-600">
          Your admin account has been created and is pending verification. You will receive an email
          with your Employee ID once approved by the administrator.
        </p>

        <div className="mb-6 rounded-lg border border-green-200 bg-green-50 p-4">
          <div className="mb-2 flex items-center gap-2">
            <Shield className="h-5 w-5 text-green-600" />
            <h4 className="font-semibold text-green-800">Account Details</h4>
          </div>
          <div className="text-sm text-green-700">
            <p>
              <strong>Name:</strong> {formData.name}
            </p>
            <p>
              <strong>Email:</strong> {formData.email}
            </p>
            {formData.department && (
              <p>
                <strong>Department:</strong> {formData.department}
              </p>
            )}
            <p className="mt-2 text-orange-600">
              <strong>Note:</strong> Employee ID will be assigned after verification by
              administrator.
            </p>
          </div>
        </div>

        <Link
          href="/auth/login"
          className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-red-600 via-orange-600 to-yellow-600 px-6 py-3 font-medium text-white transition-all duration-300 hover:from-red-700 hover:via-orange-700 hover:to-yellow-700"
        >
          <Shield className="h-5 w-5" />
          Go to Admin Login
        </Link>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <div className="mb-4 flex items-center gap-3">
          <Link href="/auth/login" className="rounded-lg p-2 transition-colors hover:bg-gray-100">
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </Link>
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-red-500 via-orange-500 to-yellow-500 shadow-lg">
            <Shield className="h-6 w-6 text-white" />
          </div>
        </div>

        <h2 className="mb-2 text-2xl font-bold text-gray-900">Create Admin Account</h2>
        <p className="text-sm text-gray-600">
          Register as an administrator to manage the BookWise system
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-4">
        {/* Employee ID */}
        <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 p-3">
          <div className="mb-1 flex items-center gap-2">
            <User className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-800">Employee ID Assignment</span>
          </div>
          <p className="text-xs text-blue-700">
            Your Employee ID will be automatically assigned by the administrator after account
            verification.
          </p>
        </div>

        {/* Full Name */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Full Name *</label>
          <div className="relative">
            <User className="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 transform text-gray-400" />
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="John Doe"
              className="w-full rounded-md border border-gray-300 py-2 pr-3 pl-10 focus:border-transparent focus:ring-2 focus:ring-orange-500 focus:outline-none"
              required
              disabled={loading}
            />
          </div>
        </div>

        {/* Email */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Email Address *</label>
          <div className="relative">
            <Mail className="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 transform text-gray-400" />
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="john.doe@bookwise.com"
              className="w-full rounded-md border border-gray-300 py-2 pr-3 pl-10 focus:border-transparent focus:ring-2 focus:ring-orange-500 focus:outline-none"
              required
              disabled={loading}
            />
          </div>
        </div>

        {/* Department */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Department</label>
          <div className="relative">
            <Building className="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 transform text-gray-400" />
            <input
              type="text"
              name="department"
              value={formData.department}
              onChange={handleInputChange}
              placeholder="Sales, IT, Management, etc."
              className="w-full rounded-md border border-gray-300 py-2 pr-3 pl-10 focus:border-transparent focus:ring-2 focus:ring-orange-500 focus:outline-none"
              disabled={loading}
            />
          </div>
        </div>

        {/* Password */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Password *</label>
          <div className="relative">
            <Lock className="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 transform text-gray-400" />
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              placeholder="••••••••"
              className="w-full rounded-md border border-gray-300 py-2 pr-3 pl-10 focus:border-transparent focus:ring-2 focus:ring-orange-500 focus:outline-none"
              required
              disabled={loading}
              minLength={6}
            />
          </div>
          <p className="mt-1 text-xs text-gray-500">Minimum 6 characters</p>
        </div>

        {/* Confirm Password */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Confirm Password *</label>
          <div className="relative">
            <Lock className="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 transform text-gray-400" />
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              placeholder="••••••••"
              className="w-full rounded-md border border-gray-300 py-2 pr-3 pl-10 focus:border-transparent focus:ring-2 focus:ring-orange-500 focus:outline-none"
              required
              disabled={loading}
            />
          </div>
        </div>

        <Button
          type="submit"
          className="w-full bg-gradient-to-r from-red-600 via-orange-600 to-yellow-600 py-2.5 text-white transition-all duration-300 hover:from-red-700 hover:via-orange-700 hover:to-yellow-700"
          disabled={loading}
        >
          {loading ? 'Creating Account...' : '🛡️ Create Admin Account'}
        </Button>
      </form>

      {/* Footer Links */}
      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600">
          Already have an admin account?{' '}
          <Link
            href="/auth/login"
            className="bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text font-medium text-transparent transition-all duration-300 hover:from-red-700 hover:to-orange-700"
          >
            Sign in here
          </Link>
        </p>
      </div>
    </div>
  );
}
