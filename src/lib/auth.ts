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
import { cacheGet, cacheSet } from "@/lib/cache";

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
      // Auto-create Player for OAuth users (Google, etc.)
      // Runs AFTER User is committed — no foreign key violation
      try {
        const baseIgn = (user.name || user.email?.split("@")[0] || "user")
          .replace(/[^a-zA-Z0-9]/g, "")
          .slice(0, 20);
        let ign = baseIgn;
        let counter = 1;
        while (await prisma.player.findFirst({ where: { ign } })) {
          ign = `${baseIgn}${counter++}`;
        }
        await prisma.player.create({
          data: { userId: user.id, ign },
        });
      } catch (err) {
        logger.error("Failed to auto-create Player in createUser", err instanceof Error ? err : new Error(String(err)));
      }
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
      if (account?.provider === "google" && user.id) {
        // Download Google avatar on first sign-in
        const imageUrl = profile && "image" in profile ? (profile as { image?: string }).image : undefined;
        if (imageUrl) {
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

      // Handle session update (e.g., after avatar upload or name change)
      if (trigger === "update") {
        if (session?.avatar !== undefined) {
          token.avatar = session.avatar;
        }
        if (session?.name !== undefined) {
          token.name = session.name;
        }
      }

      // Invalidate session if password was changed after token was issued
      if (token.id && typeof token.passwordChangedAt === "number") {
        const cacheKey = `user:pwd:${token.id}`;
        let changedAt = await cacheGet<number>(cacheKey);

        if (changedAt === null) {
          const dbUser = await prisma.user.findUnique({
            where: { id: token.id as string },
            select: { passwordChangedAt: true },
          });
          changedAt = dbUser?.passwordChangedAt?.getTime() ?? 0;
          await cacheSet(cacheKey, changedAt, 60);
        }

        if (changedAt > (token.passwordChangedAt as number)) {
          return null; // Force re-login
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
