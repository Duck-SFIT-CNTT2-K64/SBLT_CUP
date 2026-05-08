import sharp from "sharp";

export async function processAvatar(buffer: Buffer): Promise<Buffer> {
  return sharp(buffer)
    .resize(256, 256, { fit: "cover", position: "center" })
    .webp({ quality: 80 })
    .toBuffer();
}

export async function processEvidence(buffer: Buffer): Promise<Buffer> {
  return sharp(buffer)
    .resize(1920, null, { fit: "inside", withoutEnlargement: true })
    .webp({ quality: 85 })
    .toBuffer();
}
