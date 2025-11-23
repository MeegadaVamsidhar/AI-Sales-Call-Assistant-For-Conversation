import { NextRequest } from 'next/server';
import { ObjectId } from 'mongodb';
import { getDatabase } from './database';

interface RateLimitConfig {
  maxAttempts: number;
  windowMs: number;
  blockDurationMs: number;
}

const defaultConfig: RateLimitConfig = {
  maxAttempts: 5,
  windowMs: 15 * 60 * 1000, // 15 minutes
  blockDurationMs: 60 * 60 * 1000, // 1 hour
};

export async function checkRateLimit(
  identifier: string,
  config: RateLimitConfig = defaultConfig
): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
  const now = new Date();
  const windowStart = new Date(now.getTime() - config.windowMs);

  try {
    const db = await getDatabase();
    const sessions = db.collection('user_sessions');

    const sessionData = await sessions.findOne(
      { $or: [{ ipAddress: identifier }, { userId: identifier }] },
      { sort: { createdAt: -1 } }
    );

    if (!sessionData) {
      try {
        await sessions.insertOne({
          ipAddress: identifier,
          userId: identifier,
          attempts: 0,
          lastAttempt: now,
          lockedUntil: null,
          createdAt: now,
        });
      } catch (error) {
        console.error('Failed to insert session:', error);
        // Continue without inserting, allow the request
      }
      return {
        allowed: true,
        remaining: config.maxAttempts,
        resetTime: now.getTime() + config.windowMs,
      };
    }

    // Check if currently blocked
    if (sessionData.locked_until && new Date(sessionData.locked_until) > now) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: new Date(sessionData.locked_until).getTime(),
      };
    }

    // Reset attempts if window has passed
    if (new Date(sessionData.lastAttempt) < windowStart) {
      await sessions.updateOne(
        { _id: sessionData._id },
        { $set: { attempts: 0, lastAttempt: now, lockedUntil: null } }
      );
      return {
        allowed: true,
        remaining: config.maxAttempts,
        resetTime: now.getTime() + config.windowMs,
      };
    }

    const remaining = Math.max(0, config.maxAttempts - (sessionData.attempts || 0));
    const allowed = (sessionData.attempts || 0) < config.maxAttempts;

    return {
      allowed,
      remaining,
      resetTime: new Date(sessionData.lastAttempt).getTime() + config.windowMs,
    };
  } catch (error) {
    console.error('Rate limit check failed:', error);
    // Fail open - allow request if rate limiting fails
    return {
      allowed: true,
      remaining: config.maxAttempts,
      resetTime: now.getTime() + config.windowMs,
    };
  }
}

export async function recordFailedAttempt(
  identifier: string,
  config: RateLimitConfig = defaultConfig
) {
  const now = new Date();

  try {
    const db = await getDatabase();
    const sessions = db.collection('user_sessions');
    const sessionData = await sessions.findOne(
      { $or: [{ ipAddress: identifier }, { userId: identifier }] },
      { sort: { createdAt: -1 } }
    );

    if (!sessionData) {
      await sessions.insertOne({
        ipAddress: identifier,
        userId: identifier,
        attempts: 1,
        lastAttempt: now,
        lockedUntil: null,
        createdAt: now,
      });
      return;
    }

    const newAttempts = (sessionData.attempts || 0) + 1;
    if (newAttempts >= config.maxAttempts) {
      const blockUntil = new Date(now.getTime() + config.blockDurationMs);
      await sessions.updateOne(
        { _id: sessionData._id },
        { $set: { attempts: newAttempts, lastAttempt: now, lockedUntil: blockUntil } }
      );
    } else {
      await sessions.updateOne(
        { _id: sessionData._id },
        { $set: { attempts: newAttempts, lastAttempt: now } }
      );
    }
  } catch (error) {
    console.error('Failed to record failed attempt:', error);
  }
}

export async function recordSuccessfulAttempt(identifier: string) {
  try {
    const db = await getDatabase();
    const sessions = db.collection('user_sessions');
    await sessions.updateMany(
      { $or: [{ ipAddress: identifier }, { userId: identifier }] },
      { $set: { attempts: 0, lockedUntil: null } }
    );
  } catch (error) {
    console.error('Failed to record successful attempt:', error);
  }
}

export function getClientIdentifier(req: NextRequest): string {
  // Try to get user ID from JWT token first
  const token = req.cookies.get('auth_token')?.value;
  if (token) {
    try {
      // You would verify the JWT here and extract user ID
      // For now, we'll use IP address
    } catch (error) {
      // Invalid token, fall back to IP
    }
  }

  // Fall back to IP address
  const forwarded = req.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0] : 'unknown';
  return ip;
}
