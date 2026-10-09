/**
 * Case-, whitespace- and accent-insensitive form of a sheet header or cell:
 * "Descripción  Corta" → "descripcion corta". Lives in its own module so the
 * loader, the submit logic and project identity can share it without import
 * cycles.
 */
export function normalizeHeader(raw: string): string {
  return raw
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}
