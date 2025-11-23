import { NextRequest, NextResponse } from 'next/server';

const AUTH_COOKIE = 'auth_token';

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Public paths
  const isAuthPath = pathname.startsWith('/auth');
  const isApi = pathname.startsWith('/api');
  const isAsset =
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    /\.[a-zA-Z0-9]+$/.test(pathname); // allow static files like /Main.svg, .png, .css
  const isAdminPath = pathname.startsWith('/admin');
  const isContactPath = pathname.startsWith('/contact');

  // Public routes: api, assets, admin, and contact
  // Allow admin paths without auth (can add auth check later if needed)
  if (isApi || isAsset || isAdminPath || isContactPath) return NextResponse.next();

  const token = req.cookies.get(AUTH_COOKIE)?.value;
  // Accept NextAuth session cookie as authenticated as well
  const nextAuthCookieName =
    process.env.NODE_ENV === 'production'
      ? '__Secure-next-auth.session-token'
      : 'next-auth.session-token';
  const hasNextAuthSession = Boolean(req.cookies.get(nextAuthCookieName)?.value);

  // Allow unauthenticated users to access auth pages
  if (isAuthPath && !token && !hasNextAuthSession) {
    return NextResponse.next();
  }

  if (!token && !hasNextAuthSession) {
    const url = new URL('/auth/login', req.url);
    url.searchParams.set('next', pathname);
    return NextResponse.redirect(url);
  }

  if ((token || hasNextAuthSession) && isAuthPath) {
    const nextUrl = req.nextUrl.searchParams.get('next') || '/';
    return NextResponse.redirect(new URL(nextUrl, req.url));
  }

  return NextResponse.next();
}

export const config = {
  // Exclude: API routes, Next.js internals, static files, and favicon
  // This ensures NextAuth OAuth callbacks work properly
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|favicon.svg|.*\\..*).*)'],
};
