import { NextAuthOptions } from 'next-auth';
import GitHubProvider from 'next-auth/providers/github';
import GoogleProvider from 'next-auth/providers/google';
import bcrypt from 'bcryptjs';
import { getDatabase } from './database';

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === 'google' || account?.provider === 'github') {
        try {
          const db = await getDatabase();
          const users = db.collection('users');

          const existingUser = await users.findOne({ email: user.email });

          if (!existingUser) {
            const randomPassword = Math.random().toString(36).slice(-12);
            const passwordHash = await bcrypt.hash(randomPassword, 12);

            await users.insertOne({
              email: user.email,
              passwordHash,
              emailVerified: true,
              createdAt: new Date(),
              updatedAt: new Date(),
            });
          } else if (!existingUser.emailVerified) {
            await users.updateOne(
              { email: user.email },
              { $set: { emailVerified: true, updatedAt: new Date() } }
            );
          }

          return true;
        } catch (error) {
          console.error('OAuth sign in error:', error);
          return false;
        }
      }
      return true;
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        (session.user as { id?: string }).id = token.id as string;
        session.user.email = token.email as string;
      }
      return session;
    },
  },
  pages: {
    signIn: '/auth/login',
    error: '/auth/error',
  },
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET,
};
