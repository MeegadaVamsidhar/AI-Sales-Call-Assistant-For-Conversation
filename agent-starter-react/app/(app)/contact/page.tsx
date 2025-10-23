'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';

export default function ContactPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setStatus(null);
    setError(null);
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, message }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Failed to send');
      setStatus('Thanks! We will get back to you.');
      setName('');
      setEmail('');
      setMessage('');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to send message');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-[70vh] items-center justify-center p-6">
      <div className="w-full max-w-2xl rounded-lg border p-6 shadow-sm">
        <h1 className="mb-2 text-2xl font-semibold">Contact us</h1>
        <p className="mb-6 text-sm text-neutral-600">
          We usually respond within 1–2 business days.
        </p>
        {status && (
          <div className="mb-4 rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700 dark:border-green-900/40 dark:bg-green-900/20 dark:text-green-300">
            {status}
          </div>
        )}
        {error && (
          <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-300">
            {error}
          </div>
        )}
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium" htmlFor="name">
              Name
            </label>
            <input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={loading}
              className="bg-background focus:border-ring focus:ring-ring/20 w-full rounded-md border px-3 py-2 text-sm transition-colors outline-none focus:ring-2 disabled:opacity-60"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              required
              disabled={loading}
              className="bg-background focus:border-ring focus:ring-ring/20 w-full rounded-md border px-3 py-2 text-sm transition-colors outline-none focus:ring-2 disabled:opacity-60"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium" htmlFor="message">
              Message
            </label>
            <textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
              rows={5}
              disabled={loading}
              className="bg-background focus:border-ring focus:ring-ring/20 w-full rounded-md border px-3 py-2 text-sm transition-colors outline-none focus:ring-2 disabled:opacity-60"
            />
          </div>
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Sending…' : 'Send message'}
          </Button>
        </form>
      </div>
    </div>
  );
}
