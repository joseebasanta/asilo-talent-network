export type DemoContact = "phone" | "contactEmail" | "linkedin" | "x";

export type DemoProfile = {
  name: string;
  role: string;
  city: string;
  country: string;
  bio: string;
  inWhatsappGroup: boolean;
  photo: string | null;
  accessStatus: "unchanged" | "updated";
  contacts: Record<DemoContact, { value: string; visible: boolean }>;
};

const initial: DemoProfile = {
  name: "Lucía Demo",
  role: "Founder",
  city: "Caracas",
  country: "Venezuela",
  bio: "Construyo herramientas sencillas para negocios pequeños.",
  inWhatsappGroup: false,
  photo: null,
  accessStatus: "unchanged",
  contacts: {
    phone: { value: "+58 412 0000000", visible: true },
    contactEmail: { value: "hola@panapay.example", visible: true },
    linkedin: { value: "https://www.linkedin.com/in/lucia-demo", visible: true },
    x: { value: "", visible: false },
  },
};

export const DEMO_PROFILE: DemoProfile = structuredClone(initial);

export function updateDemoProfile(patch: Partial<Pick<DemoProfile, "name" | "role" | "city" | "country" | "bio" | "inWhatsappGroup">>) {
  Object.assign(DEMO_PROFILE, patch);
  return { ok: true as const, profile: DEMO_PROFILE };
}

export function updateDemoContact(key: DemoContact, value: string, visible: boolean) {
  DEMO_PROFILE.contacts[key] = { value: value.trim(), visible };
  return { ok: true as const, profile: DEMO_PROFILE };
}

export function updateDemoPhoto(photo: string | null) {
  DEMO_PROFILE.photo = photo;
  return { ok: true as const, profile: DEMO_PROFILE };
}

export function updateDemoAccess() {
  DEMO_PROFILE.accessStatus = "updated";
  return { ok: true as const, profile: DEMO_PROFILE };
}

export function resetDemoProfile(): void {
  Object.assign(DEMO_PROFILE, structuredClone(initial));
}
