/** Field validation for the account screens. Messages are Spanish, in tuteo. */

export type FieldErrors = Record<string, string>;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function isEmail(value: string): boolean {
  return value.length <= 254 && EMAIL.test(value);
}

export function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

export function normalizeUrl(value: string): string {
  const v = value.trim();
  if (!v) return "";
  return /^https?:\/\//i.test(v) ? v : `https://${v}`;
}

export function isUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return (url.protocol === "http:" || url.protocol === "https:") && url.hostname.includes(".");
  } catch {
    return false;
  }
}

export const PASSWORD_MIN = 8;

export function validateSignUp(input: { name: string; email: string; password: string; human: boolean }): FieldErrors {
  const errors: FieldErrors = {};
  if (input.name.trim().length < 2) errors.name = "Escribe tu nombre y apellido.";
  if (!isEmail(normalizeEmail(input.email))) errors.email = "Escribe un correo válido.";
  if (input.password.length < PASSWORD_MIN) errors.password = `La contraseña debe tener al menos ${PASSWORD_MIN} caracteres.`;
  if (!input.human) errors.human = "Confirma que no eres un robot.";
  return errors;
}

export function validateSignIn(input: { email: string; password: string }): FieldErrors {
  const errors: FieldErrors = {};
  if (!isEmail(normalizeEmail(input.email))) errors.email = "Escribe un correo válido.";
  if (!input.password) errors.password = "Escribe tu contraseña.";
  return errors;
}

export function validateProfile(input: { city: string; country: string; role: string; bio: string }): FieldErrors {
  const errors: FieldErrors = {};
  if (!input.city.trim()) errors.city = "Indica tu ciudad.";
  if (!input.country.trim()) errors.country = "Indica tu país.";
  if (!input.role) errors.role = "Elige tu rol.";
  if (input.bio.length > 280) errors.bio = "La bio admite hasta 280 caracteres.";
  return errors;
}

export function validateProjectInfo(input: { name: string; website: string; short: string; logo: string | null }): FieldErrors {
  const errors: FieldErrors = {};
  if (input.name.trim().length < 2) errors.name = "Escribe el nombre del proyecto.";
  if (!isUrl(normalizeUrl(input.website))) errors.website = "Escribe una web válida, por ejemplo tuproyecto.com.";
  const short = input.short.trim();
  if (short.length < 10) errors.short = "Describe tu proyecto en una frase (mínimo 10 caracteres).";
  else if (short.length > 140) errors.short = "La descripción corta admite hasta 140 caracteres.";
  if (!input.logo) errors.logo = "Sube el logo de tu proyecto.";
  return errors;
}

export function validateProjectDetails(input: { sector: string; stage: string }): FieldErrors {
  const errors: FieldErrors = {};
  if (!input.sector) errors.sector = "Elige el sector.";
  if (!input.stage) errors.stage = "Elige la etapa.";
  return errors;
}
