import bcrypt from 'bcryptjs';
import { ObjectId } from 'mongodb';
import crypto from 'node:crypto';
import { query } from './database';

export interface UserRecord {
  _id?: ObjectId;
  id: string;
  email: string;
  passwordHash: string;
  emailVerified: boolean;
  emailVerificationToken?: string;
  emailVerificationExpires?: Date;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Password validation
export function validatePassword(password: string): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (password.length < 6) {
    errors.push('Password must be at least 6 characters long');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// Email validation
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
}

export async function createUser(email: string, password: string): Promise<UserRecord> {
  const normalized = email.trim().toLowerCase();

  // Validate email format
  if (!validateEmail(normalized)) {
    throw new Error('Invalid email format');
  }

  // Validate password
  const passwordValidation = validatePassword(password);
  if (!passwordValidation.isValid) {
    throw new Error(`Password validation failed: ${passwordValidation.errors.join(', ')}`);
  }

  // Check if user already exists
  const existingUser = await getUserByEmail(normalized);
  if (existingUser) {
    throw new Error('Email already registered');
  }

  const passwordHash = await hashPassword(password);
  const emailVerificationToken = crypto.randomBytes(32).toString('hex');
  const emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
  const now = new Date();

  const userData = {
    email: normalized,
    passwordHash,
    emailVerified: false,
    emailVerificationToken,
    emailVerificationExpires,
    createdAt: now,
    updatedAt: now,
  };

  const result = await query('users', 'insertOne', userData);

  if (!result || typeof result !== 'object' || !('insertedId' in result)) {
    throw new Error('Failed to create user');
  }

  return {
    _id: result.insertedId,
    id: result.insertedId.toString(),
    email: userData.email,
    passwordHash: userData.passwordHash,
    emailVerified: userData.emailVerified,
    emailVerificationToken: userData.emailVerificationToken,
    emailVerificationExpires: userData.emailVerificationExpires,
    createdAt: userData.createdAt,
    updatedAt: userData.updatedAt,
  };
}

export async function verifyUser(email: string, password: string): Promise<UserRecord | null> {
  const normalized = email.trim().toLowerCase();
  const user = await getUserByEmail(normalized);

  if (!user) return null;

  const isValid = await bcrypt.compare(password, user.passwordHash);
  return isValid ? user : null;
}

export async function getUserById(id: string): Promise<UserRecord | null> {
  const result = await query('users', 'findOne', { _id: new ObjectId(id) });

  if (!result || typeof result !== 'object' || !('_id' in result)) return null;

  return {
    _id: result._id,
    id: result._id.toString(),
    email: result.email,
    passwordHash: result.passwordHash,
    emailVerified: result.emailVerified,
    emailVerificationToken: result.emailVerificationToken,
    emailVerificationExpires: result.emailVerificationExpires,
    passwordResetToken: result.passwordResetToken,
    passwordResetExpires: result.passwordResetExpires,
    createdAt: result.createdAt,
    updatedAt: result.updatedAt,
  };
}

export async function getUserByEmail(email: string): Promise<UserRecord | null> {
  const result = await query('users', 'findOne', { email });

  if (!result || typeof result !== 'object' || !('_id' in result)) return null;

  return {
    _id: result._id,
    id: result._id.toString(),
    email: result.email,
    passwordHash: result.passwordHash,
    emailVerified: result.emailVerified,
    emailVerificationToken: result.emailVerificationToken,
    emailVerificationExpires: result.emailVerificationExpires,
    passwordResetToken: result.passwordResetToken,
    passwordResetExpires: result.passwordResetExpires,
    createdAt: result.createdAt,
    updatedAt: result.updatedAt,
  };
}

export async function verifyEmail(token: string): Promise<string | null> {
  // Mark verified and return the user's email to trigger a welcome email
  const result = await query('users', 'findOne', {
    emailVerificationToken: token,
    emailVerificationExpires: { $gt: new Date() },
  });

  if (!result || typeof result !== 'object' || !('_id' in result)) return null;

  await query(
    'users',
    'updateOne',
    { _id: new ObjectId(result._id) },
    {
      $set: {
        emailVerified: true,
        emailVerificationToken: null,
        emailVerificationExpires: null,
        updatedAt: new Date(),
      },
    }
  );

  return result.email as string;
}

export async function createPasswordResetToken(email: string): Promise<string | null> {
  const user = await getUserByEmail(email);
  if (!user) return null;

  const resetToken = crypto.randomBytes(32).toString('hex');
  const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await query(
    'users',
    'updateOne',
    { _id: new ObjectId(user.id) },
    {
      $set: {
        passwordResetToken: resetToken,
        passwordResetExpires: resetExpires,
        updatedAt: new Date(),
      },
    }
  );

  return resetToken;
}

export async function resetPassword(token: string, newPassword: string): Promise<boolean> {
  // Validate new password
  const passwordValidation = validatePassword(newPassword);
  if (!passwordValidation.isValid) {
    throw new Error(`Password validation failed: ${passwordValidation.errors.join(', ')}`);
  }

  const passwordHash = await hashPassword(newPassword);

  const result = await query(
    'users',
    'updateOne',
    {
      passwordResetToken: token,
      passwordResetExpires: { $gt: new Date() },
    },
    {
      $set: {
        passwordHash,
        passwordResetToken: null,
        passwordResetExpires: null,
        updatedAt: new Date(),
      },
    }
  );

  return result && typeof result === 'object' && 'modifiedCount' in result
    ? result.modifiedCount > 0
    : false;
}
