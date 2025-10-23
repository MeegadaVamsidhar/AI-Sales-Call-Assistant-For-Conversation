import Link from 'next/link';

export default async function AuthErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  const error = params?.error || 'Unknown error';

  return (
    <div className="flex min-h-[60vh] items-center justify-center p-6">
      <div className="w-full max-w-md space-y-6 text-center">
        <h1 className="text-3xl font-semibold">Authentication Error</h1>
        <p className="text-muted-foreground text-sm">{error}</p>
        <div className="flex items-center justify-center gap-3">
          <Link href="/auth/login" className="rounded-md border px-4 py-2">
            Back to Login
          </Link>
          <Link href="/" className="rounded-md border px-4 py-2">
            Home
          </Link>
        </div>
      </div>
    </div>
  );
}
