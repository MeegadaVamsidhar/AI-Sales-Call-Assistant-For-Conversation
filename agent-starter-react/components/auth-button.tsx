'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface User {
  id: string;
  email: string;
}

export function AuthButton() {
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled) setLoggedIn(Boolean(d?.user));
      })
      .catch(() => {
        if (!cancelled) setLoggedIn(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (loggedIn === null) return null;

  if (!loggedIn) {
    return (
      <Link href="/auth/login" className="text-sm">
        <Button size="sm" variant="outline">
          Login
        </Button>
      </Link>
    );
  }

  return (
    <Button
      size="sm"
      variant="outline"
      onClick={async () => {
        await fetch('/api/auth/logout', { method: 'POST' });
        window.location.href = '/auth/login';
      }}
    >
      Logout
    </Button>
  );
}
