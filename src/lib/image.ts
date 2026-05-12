import sharp from "sharp";

export async function processAvatar(buffer: Buffer): Promise<Buffer> {
  return sharp(buffer)
    .resize(256, 256, { fit: "cover", position: "center" })
    .webp({ quality: 80 })
    .toBuffer();
}

/**
 * Download an image from a URL and process it as an avatar (256x256 WebP).
 * Returns null on any failure — should not block login flow.
 */
export async function downloadAndProcessAvatar(url: string): Promise<Buffer | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const res = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": "SBLT-CUP/1.0" },
    });
    clearTimeout(timeout);

    if (!res.ok) return null;

    const contentType = res.headers.get("content-type");
    if (!contentType?.startsWith("image/")) return null;

    const arrayBuffer = await res.arrayBuffer();
    if (arrayBuffer.byteLength > 10 * 1024 * 1024) return null; // Max 10MB

    const buffer = Buffer.from(arrayBuffer);
    return await processAvatar(buffer);
  } catch {
    return null;
  }
}

export async function processEvidence(buffer: Buffer): Promise<Buffer> {
  return sharp(buffer)
    .resize(1920, null, { fit: "inside", withoutEnlargement: true })
    .webp({ quality: 85 })
    .toBuffer();
}
