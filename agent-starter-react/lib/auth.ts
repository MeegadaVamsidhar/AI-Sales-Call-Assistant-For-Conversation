import { SignJWT, jwtVerify } from 'jose';

const encoder = new TextEncoder();

const JWT_SECRET = process.env.JWT_SECRET || 'dev-insecure-secret-change-me';
const JWT_ISSUER = 'app-auth';

export interface JwtPayload {
  sub: string; // user id
  email: string;
}

export async function createAuthToken(payload: JwtPayload, expiresInSeconds = 60 * 60 * 24 * 7) {
  const secret = encoder.encode(JWT_SECRET);
  const token = await new SignJWT({ email: payload.email })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(payload.sub)
    .setIssuer(JWT_ISSUER)
    .setIssuedAt()
    .setExpirationTime(Math.floor(Date.now() / 1000) + expiresInSeconds)
    .sign(secret);
  return token;
}

export async function verifyAuthToken(token: string) {
  const secret = encoder.encode(JWT_SECRET);
  const { payload } = await jwtVerify(token, secret, { issuer: JWT_ISSUER });
  return {
    sub: payload.sub as string,
    email: (payload as { email?: string }).email as string,
  } as JwtPayload;
}

export function authCookieOptions() {
  return {
    name: 'auth_token',
    options: {
      httpOnly: true as const,
      sameSite: 'lax' as const,
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7,
    },
  };
}
