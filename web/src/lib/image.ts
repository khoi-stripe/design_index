import { writeFile, mkdir } from "fs/promises";
import path from "path";
import sharp from "sharp";

const THUMB_SIZE = 800;

export async function processAndStoreImage(
  buffer: Buffer,
  filename: string,
  thumbFilename: string
): Promise<{ dominantColor: string }> {
  const uploadDir = path.join(process.cwd(), "public", "uploads");
  await mkdir(uploadDir, { recursive: true });

  await writeFile(path.join(uploadDir, filename), buffer);

  const thumbBuffer = await sharp(buffer)
    .resize({
      width: THUMB_SIZE,
      height: THUMB_SIZE,
      fit: "inside",
      withoutEnlargement: true,
    })
    .png({ quality: 85 })
    .toBuffer();

  await writeFile(path.join(uploadDir, thumbFilename), thumbBuffer);

  const { dominant } = await sharp(thumbBuffer).stats();
  const { r, g, b } = dominant;
  const dominantColor = `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;

  return { dominantColor };
}
