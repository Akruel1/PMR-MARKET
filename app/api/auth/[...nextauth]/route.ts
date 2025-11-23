import NextAuth, { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { prisma } from '@/lib/prisma';
import { generateUniqueAccountCode } from '@/lib/account-code';

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    }),
  ],
  callbacks: {
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
        // Get user data from database
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: { role: true, banned: true, licenseAccepted: true },
        });
        if (dbUser) {
          (session.user as any).role = dbUser.role;
          (session.user as any).banned = dbUser.banned;
          (session.user as any).licenseAccepted = dbUser.licenseAccepted;
        }
      }
      return session;
    },
    async signIn({ user, account, profile }) {
      // Generate account code for new users
      if (user.id) {
        try {
          // Check if accountCode field exists in database
          const existingUser = await prisma.user.findUnique({
            where: { id: user.id },
            select: { 
              id: true,
              accountCode: true,
            },
          });
          
          if (existingUser && !existingUser.accountCode) {
            const accountCode = await generateUniqueAccountCode();
            await prisma.user.update({
              where: { id: user.id },
              data: { accountCode },
            });
          }
        } catch (error: any) {
          // If accountCode field doesn't exist yet (migration not applied), log and continue
          if (error.message?.includes('accountCode') || error.message?.includes('Unknown field')) {
            console.warn('AccountCode field not found. Please apply migration: npx prisma migrate dev');
          } else {
            console.error('Error generating account code:', error);
          }
          // Continue with sign in even if account code generation fails
        }
      }
      return true;
    },
    async jwt({ token, user, account }) {
      // Update license acceptance if coming from license page
      if (user) {
        // This will be handled on the frontend after successful login
      }
      return token;
    },
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  session: {
    strategy: 'database',
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };

