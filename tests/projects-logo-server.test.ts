import { describe, expect, it } from "vitest";
import sharp from "sharp";
import { prepareLogo } from "../src/lib/projects-logo-server";
import { validateLogo } from "../src/lib/projects-logo";

const image = () => sharp({ create: { width: 8, height: 8, channels: 4, background: "red" } });
const file = (buffer: Buffer, name = "logo.png", type = "image/png") => new File([new Uint8Array(buffer)], name, { type });

describe("logo content validation", () => {
  it.each(["png", "jpeg", "webp"] as const)("decodes %s and produces a clean WebP", async (format) => {
    const input = await image().toFormat(format).toBuffer();
    const result = await prepareLogo(file(input, `logo.${format}`, `image/${format}`));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const metadata = await sharp(result.buffer).metadata();
    expect(metadata.format).toBe("webp");
    expect(metadata.width).toBe(8);
    expect(metadata.exif).toBeUndefined();
    expect(result.filename).toBe("logo.webp");
  });

  it("rejects fake image contents, truncated images and mismatched formats", async () => {
    expect((await prepareLogo(file(Buffer.from("<script>alert(1)</script>")))).ok).toBe(false);
    const png = await image().png().toBuffer();
    expect((await prepareLogo(file(png.subarray(0, 40)))).ok).toBe(false);
    expect((await prepareLogo(file(png, "logo.jpg", "image/jpeg"))).ok).toBe(false);
  });

  it("rejects oversized dimensions even for a tiny compressed file", async () => {
    const png = await sharp({ create: { width: 4097, height: 1, channels: 3, background: "red" } }).png().toBuffer();
    expect((await prepareLogo(file(png))).ok).toBe(false);
  });

  it("rejects total pixel counts above 16 MP even when each dimension is allowed", async () => {
    const input = await sharp({ create: { width: 4001, height: 4000, channels: 3, background: "red" } }).png().toBuffer();
    expect((await prepareLogo(file(input))).ok).toBe(false);
  });

  it("removes metadata that was actually present in the uploaded image", async () => {
    const input = await image().withExif({ IFD0: { Artist: "Private author", Copyright: "Private copyright" } }).jpeg().toBuffer();
    expect((await sharp(input).metadata()).exif).toBeDefined();
    const result = await prepareLogo(file(input, "logo.jpeg", "image/jpeg"));
    expect(result.ok).toBe(true);
    if (result.ok) expect((await sharp(result.buffer).metadata()).exif).toBeUndefined();
  });

  it("rejects real animated WebP input", async () => {
    const raw = Buffer.concat([Buffer.alloc(8 * 8 * 3, 20), Buffer.alloc(8 * 8 * 3, 180)]);
    const input = await sharp(raw, { raw: { width: 8, height: 16, channels: 3, pageHeight: 8 } })
      .webp({ loop: 0, delay: [100, 100] }).toBuffer();
    expect((await sharp(input).metadata()).pages).toBe(2);
    expect((await prepareLogo(file(input, "logo.webp", "image/webp"))).ok).toBe(false);
  });

  it("rejects APNG even when the image decoder only exposes its default frame", async () => {
    // A valid single-frame APNG: insert animation and frame controls before IDAT.
    const chunk = (type: string, data: Buffer) => {
      const payload = Buffer.concat([Buffer.from(type), data]);
      let crc = 0xffffffff;
      for (const byte of payload) {
        crc ^= byte;
        for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0);
      }
      const size = Buffer.alloc(4);
      size.writeUInt32BE(data.length);
      const checksum = Buffer.alloc(4);
      checksum.writeUInt32BE((crc ^ 0xffffffff) >>> 0);
      return Buffer.concat([size, payload, checksum]);
    };
    const png = await image().png().toBuffer();
    const animation = Buffer.alloc(8);
    animation.writeUInt32BE(1, 0);
    const frame = Buffer.alloc(26);
    frame.writeUInt32BE(8, 4);
    frame.writeUInt32BE(8, 8);
    frame.writeUInt16BE(1, 20);
    frame.writeUInt16BE(10, 22);
    const apng = Buffer.concat([png.subarray(0, 33), chunk("acTL", animation), chunk("fcTL", frame), png.subarray(33)]);
    expect((await sharp(apng).metadata()).format).toBe("png");
    expect(await prepareLogo(file(apng))).toEqual({ ok: false, error: "Usá un logo sin animación." });
  });

  it("rejects empty files and inconsistent extensions before decoding", () => {
    expect(validateLogo({ name: "logo.png", type: "image/png", size: 0 }).ok).toBe(false);
    expect(validateLogo({ name: "logo.jpg", type: "image/png", size: 100 }).ok).toBe(false);
    expect(validateLogo({ name: "", type: "image/png", size: 100 }).ok).toBe(false);
  });
});
