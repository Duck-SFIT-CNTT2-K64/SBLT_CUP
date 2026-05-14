import NextAuth from "next-auth";
import type { AdapterUser } from "@auth/core/adapters";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { downloadAndProcessAvatar } from "@/lib/image";
import { saveAvatarBuffer } from "@/lib/upload";
import { logger } from "@/lib/logger";

const prismaAdapter = PrismaAdapter(prisma);

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: {
    ...prismaAdapter,
    async createUser(profile): Promise<AdapterUser> {
      const p = profile as unknown as Record<string, unknown>;
      const { image, ...rest } = p;
      const user = await prisma.user.create({
        data: { ...rest, avatar: image ?? null } as never,
      });
      return { ...user, emailVerified: null } as AdapterUser;
    },
    async updateUser(profile): Promise<AdapterUser> {
      const p = profile as unknown as Record<string, unknown>;
      const { image, ...rest } = p;
      if (image !== undefined) {
        const user = await prisma.user.update({
          where: { id: rest.id as string },
          data: { ...rest, avatar: image } as never,
        });
        return { ...user, emailVerified: null } as AdapterUser;
      }
      return prismaAdapter.updateUser!(profile);
    },
  },
  session: { strategy: "jwt", maxAge: 24 * 60 * 60 },
  trustHost: true,
  pages: {
    signIn: "/auth/login",
  },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      // allowDangerousEmailAccountLinking removed — prevents account takeover via Google OAuth
    }),
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

        if (!user || !user.password) return null;

        const isValid = await bcrypt.compare(credentials.password as string, user.password);
        if (!isValid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          avatar: user.avatar,
          passwordChangedAt: user.passwordChangedAt?.getTime() ?? 0,
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      // Download Google avatar on first sign-in
      const imageUrl = profile && "image" in profile ? (profile as { image?: string }).image : undefined;
      if (account?.provider === "google" && imageUrl && user.id) {
        try {
          const existingUser = await prisma.user.findUnique({
            where: { id: user.id },
            select: { avatar: true },
          });
          // Only download if user doesn't have an avatar yet
          if (!existingUser?.avatar) {
            const buffer = await downloadAndProcessAvatar(imageUrl);
            if (buffer) {
              const avatarUrl = await saveAvatarBuffer(buffer);
              await prisma.user.update({
                where: { id: user.id },
                data: { avatar: avatarUrl },
              });
              user.avatar = avatarUrl;
            }
          }
        } catch (err) {
          // Avatar download failure should not block login
          logger.error("Failed to download Google avatar", err instanceof Error ? err : new Error(String(err)));
        }
      }
      return true;
    },
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.role = user.role;
        token.id = user.id;
        token.avatar = (user as { avatar?: string | null }).avatar ?? null;
        token.passwordChangedAt = (user as unknown as { passwordChangedAt?: number }).passwordChangedAt ?? 0;
      }

      // Handle session update (e.g., after avatar upload)
      if (trigger === "update" && session?.avatar !== undefined) {
        token.avatar = session.avatar;
      }

      // Invalidate session if password was changed after token was issued
      if (token.id && typeof token.passwordChangedAt === "number" && token.passwordChangedAt > 0) {
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
        session.user.avatar = token.avatar as string | null;
      }
      return session;
    },
  },
});
