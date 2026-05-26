import { prisma } from "@/lib/prisma";

export async function resolveTournamentId(slugOrId: string): Promise<string | null> {
  const bySlug = await prisma.tournament.findUnique({ where: { slug: slugOrId }, select: { id: true } });
  if (bySlug) return bySlug.id;
  const byId = await prisma.tournament.findUnique({ where: { id: slugOrId }, select: { id: true } });
  return byId?.id ?? null;
}

const VIETNAMESE_MAP: Record<string, string> = {
  à: "a", á: "a", ả: "a", ã: "a", ạ: "a",
  ă: "a", ằ: "a", ắ: "a", ẳ: "a", ẵ: "a", ặ: "a",
  â: "a", ầ: "a", ấ: "a", ẩ: "a", ẫ: "a", ậ: "a",
  đ: "d",
  è: "e", é: "e", ẻ: "e", ẽ: "e", ẹ: "e",
  ê: "e", ề: "e", ế: "e", ể: "e", ễ: "e", ệ: "e",
  ì: "i", í: "i", ỉ: "i", ĩ: "i", ị: "i",
  ò: "o", ó: "o", ỏ: "o", õ: "o", ọ: "o",
  ô: "o", ồ: "o", ố: "o", ổ: "o", ỗ: "o", ộ: "o",
  ơ: "o", ờ: "o", ớ: "o", ở: "o", ỡ: "o", ợ: "o",
  ù: "u", ú: "u", ủ: "u", ũ: "u", ụ: "u",
  ư: "u", ừ: "u", ứ: "u", ử: "u", ữ: "u", ự: "u",
  ỳ: "y", ý: "y", ỷ: "y", ỹ: "y", ỵ: "y",
};

export function generateSlug(name: string): string {
  let result = name.toLowerCase();
  for (const [char, replacement] of Object.entries(VIETNAMESE_MAP)) {
    result = result.replaceAll(char, replacement);
  }
  return result.replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}
