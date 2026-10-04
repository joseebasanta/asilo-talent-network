import sharp from "sharp";
import { LOGO_MAX_BYTES, LOGO_MAX_DIMENSION, LOGO_MAX_PIXELS, validateLogo } from "./projects-logo";

/** Decode untrusted pixels and store a fresh static WebP, without embedded metadata. */
export async function prepareLogo(file: File): Promise<
  { ok: true; buffer: Buffer; filename: string } | { ok: false; error: string }
> {
  const check = validateLogo(file);
  if (!check.ok) return check;
  try {
    const input = Buffer.from(await file.arrayBuffer());
    // Reject other parsers (such as SVG) before handing bytes to the decoder.
    const signatureMatches = file.type === "image/png"
      ? input.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
      : file.type === "image/jpeg"
        ? input[0] === 255 && input[1] === 216 && input[2] === 255
        : input.toString("ascii", 0, 4) === "RIFF" && input.toString("ascii", 8, 12) === "WEBP";
    if (!signatureMatches) return { ok: false, error: "El contenido del logo no coincide con su formato." };
    // APNG is sometimes decoded as its first frame; reject its animation control chunk explicitly.
    if (file.type === "image/png") {
      for (let offset = 8; offset + 12 <= input.length;) {
        if (input.toString("ascii", offset + 4, offset + 8) === "acTL") {
          return { ok: false, error: "Usá un logo sin animación." };
        }
        offset += input.readUInt32BE(offset) + 12;
      }
    }
    const image = sharp(input, {
      failOn: "warning", limitInputPixels: LOGO_MAX_PIXELS,
    });
    const metadata = await image.metadata();
    const expected = { "image/png": "png", "image/jpeg": "jpeg", "image/webp": "webp" };
    if (metadata.format !== expected[file.type as keyof typeof expected]) {
      return { ok: false, error: "El contenido del logo no coincide con su formato." };
    }
    if (!metadata.width || !metadata.height || metadata.width > LOGO_MAX_DIMENSION ||
      metadata.height > LOGO_MAX_DIMENSION || (metadata.pages ?? 1) > 1) {
      return { ok: false, error: "Usá un logo sin animación de hasta 4096 × 4096 píxeles (16 megapíxeles)." };
    }
    const buffer = await image.rotate().resize(1024, 1024, { fit: "inside", withoutEnlargement: true })
      .webp({ quality: 90 }).toBuffer();
    if (buffer.length > LOGO_MAX_BYTES) return { ok: false, error: "Reducí el tamaño o la resolución del logo." };
    return { ok: true, buffer, filename: "logo.webp" };
  } catch {
    return { ok: false, error: "No se pudo leer el logo. Usá una imagen válida de hasta 16 megapíxeles." };
  }
}
