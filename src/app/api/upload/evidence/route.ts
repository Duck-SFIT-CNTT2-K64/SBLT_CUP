import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { saveUploadedFile } from "@/lib/upload";
import { processEvidence } from "@/lib/image";

const MAX_FILES = 3;

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const files: File[] = [];

    for (let i = 0; i < MAX_FILES; i++) {
      const file = formData.get(`file${i}`) as File | null;
      if (file) files.push(file);
    }

    if (files.length === 0) {
      return NextResponse.json({ error: "Không tìm thấy file" }, { status: 400 });
    }

    if (files.length > MAX_FILES) {
      return NextResponse.json({ error: `Tối đa ${MAX_FILES} file` }, { status: 400 });
    }

    const results = [];
    for (const file of files) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const processedBuffer = await processEvidence(buffer);

      const processedFile = new File([new Uint8Array(processedBuffer)], "evidence.webp", {
        type: "image/webp",
      });

      const result = await saveUploadedFile(processedFile, "disputes", {
        maxSizeMB: 10,
      });
      results.push({ filename: file.name, url: result.url });
    }

    return NextResponse.json({ files: results });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Đã xảy ra lỗi khi tải file lên";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
