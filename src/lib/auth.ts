import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "").split(",").map((e) => e.trim().toLowerCase());

export const { handlers, signIn, signOut, auth } = NextAuth({
  session: { strategy: "jwt" },
  trustHost: true,
  pages: {
    signIn: "/auth/login",
  },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        });

        if (!user) return null;

        const isValid = await bcrypt.compare(credentials.password as string, user.password);
        if (!isValid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          passwordChangedAt: user.passwordChangedAt?.getTime() ?? 0,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.id = user.id;
        token.passwordChangedAt = (user as any).passwordChangedAt ?? 0;
      }

      // Invalidate session if password was changed after token was issued
      if (token.id && typeof token.passwordChangedAt === "number") {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { passwordChangedAt: true },
        });
        if (dbUser?.passwordChangedAt) {
          const changedAt = dbUser.passwordChangedAt.getTime();
          if (changedAt > (token.passwordChangedAt as number)) {
            return null; // Force re-login
          }
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role as string;
        session.user.id = token.id as string;
      }
      return session;
    },
  },
});
