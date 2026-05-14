import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { saveUploadedFile, deleteUploadedFile } from "@/lib/upload";
import { processAvatar } from "@/lib/image";
import { invalidateLeaderboard } from "@/lib/cache-invalidate";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "Không tìm thấy file" }, { status: 400 });
    }

    // Process image (resize, crop, convert to WebP)
    const buffer = Buffer.from(await file.arrayBuffer());
    const processedBuffer = await processAvatar(buffer);

    // Create a new File from processed buffer
    const processedFile = new File([new Uint8Array(processedBuffer)], "avatar.webp", {
      type: "image/webp",
    });

    // Save file
    const result = await saveUploadedFile(processedFile, "avatars", {
      maxSizeMB: 5,
    });

    // Get old avatar URL before updating
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { avatar: true },
    });

    // Update user avatar first (before deleting old file)
    await prisma.user.update({
      where: { id: session.user.id },
      data: { avatar: result.url },
    });

    // Delete old avatar after DB is updated
    if (currentUser?.avatar) {
      await deleteUploadedFile(currentUser.avatar);
    }

    await invalidateLeaderboard();

    return NextResponse.json({ avatarUrl: result.url });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Đã xảy ra lỗi khi tải ảnh lên";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
