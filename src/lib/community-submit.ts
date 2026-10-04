import { z } from "zod";

const required = (max: number) => z.string().trim().min(1, "Completa este campo.").max(max, `Usa como máximo ${max} caracteres.`);
export const communitySchema = z.object({
  email: required(254).pipe(z.email("Ingresa un email válido.")),
  name: required(150),
  location: required(150),
  whatsapp: required(40).refine(v => /^\+[1-9][\d ()-]{6,30}$/.test(v) && v.replace(/\D/g, "").length >= 7 && v.replace(/\D/g, "").length <= 15, "Incluye el código de país, por ejemplo +58 412 1234567."),
  linkedin: required(500).refine(v => {
    try { const u = new URL(v); return u.protocol === "https:" && (u.hostname === "linkedin.com" || u.hostname.endsWith(".linkedin.com")) && u.pathname.length > 1 && !u.username && !u.password; } catch { return false; }
  }, "Ingresa una URL de LinkedIn válida (https://www.linkedin.com/in/...)."),
  role: required(150),
  project: required(200),
  description: z.string().trim().max(3000, "Usa como máximo 3000 caracteres.").default(""),
});
export const COMMUNITY_HEADERS = ["Fecha", "Email", "Nombre y apellido", "Ciudad, país", "WhatsApp", "LinkedIn", "Rol", "Nombre del proyecto", "Descripción", "Estado"];
export function normalizeCommunityHeader(value: unknown): string {
  return String(value ?? "").trim().replace(/\s+/g, " ").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}
export function isCommunityHeaderRow(row: unknown): boolean {
  if (!Array.isArray(row) || row.length !== COMMUNITY_HEADERS.length) return false;
  return COMMUNITY_HEADERS.every((name, index) => normalizeCommunityHeader(row[index]) === normalizeCommunityHeader(name));
}
export function communityRow(value: z.infer<typeof communitySchema>) {
  return [new Date().toISOString(), value.email, value.name, value.location, value.whatsapp, value.linkedin, value.role, value.project, value.description, "PENDIENTE"];
}
