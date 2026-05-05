import { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

const BASE_URL = process.env.NEXTAUTH_URL || "https://sbltcup.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const tournaments = await prisma.tournament.findMany({
    select: { id: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    { url: `${BASE_URL}/tournaments`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE_URL}/rules`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE_URL}/announcements`, lastModified: new Date(), changeFrequency: "daily", priority: 0.7 },
  ];

  const tournamentRoutes: MetadataRoute.Sitemap = tournaments.flatMap((t) => [
    { url: `${BASE_URL}/tournaments/${t.id}`, lastModified: t.createdAt, changeFrequency: "daily" as const, priority: 0.8 },
    { url: `${BASE_URL}/tournaments/${t.id}/standings`, lastModified: t.createdAt, changeFrequency: "hourly" as const, priority: 0.7 },
    { url: `${BASE_URL}/tournaments/${t.id}/brackets`, lastModified: t.createdAt, changeFrequency: "hourly" as const, priority: 0.7 },
    { url: `${BASE_URL}/tournaments/${t.id}/results`, lastModified: t.createdAt, changeFrequency: "hourly" as const, priority: 0.7 },
  ]);

  return [...staticRoutes, ...tournamentRoutes];
}
