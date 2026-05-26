import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { resolveTournamentId } from "@/lib/tournament-resolve";

const BASE_URL = process.env.NEXTAUTH_URL || "https://sbltcup.com";

interface Props {
  params: Promise<{ id: string }>;
  children: React.ReactNode;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id: slugOrId } = await params;
  const id = await resolveTournamentId(slugOrId);

  if (!id) {
    return { title: "Giải đấu không tồn tại" };
  }

  const tournament = await prisma.tournament.findUnique({
    where: { id },
    select: { slug: true, name: true, season: true, description: true, startDate: true, endDate: true, prizePool: true },
  });

  if (!tournament) {
    return { title: "Giải đấu không tồn tại" };
  }

  const title = `${tournament.name} - Mùa ${tournament.season}`;
  const description = tournament.description ||
    `Giải đấu TFT ${tournament.name} Mùa ${tournament.season}. Giải thưởng ${new Intl.NumberFormat("vi-VN").format(tournament.prizePool)} VNĐ.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${BASE_URL}/tournaments/${tournament.slug}`,
      type: "website",
      images: [{ url: "/og-image.png", width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default function TournamentLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
