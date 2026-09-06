const CATEGORY_ICONS: Record<string, string> = {
  "Inteligencia Artificial": "/icons/pixelarticons/ai-view.svg",
  Fintech: "/icons/pixelarticons/wallet.svg",
  Marketplace: "/icons/pixelarticons/wallet.svg",
  "Blockchain & Crypto": "/icons/pixelarticons/wallet.svg",
  Web3: "/icons/pixelarticons/wallet.svg",
  "E-commerce": "/icons/pixelarticons/wallet.svg",
  Edtech: "/icons/pixelarticons/code.svg",
  SaaS: "/icons/pixelarticons/code.svg",
  "DevTools & APIs": "/icons/pixelarticons/code.svg",
  "No-Code & CMS": "/icons/pixelarticons/code.svg",
  Ciberseguridad: "/icons/pixelarticons/shield.svg",
  Healthtech: "/icons/pixelarticons/heart.svg",
  Agritech: "/icons/pixelarticons/box.svg",
  "Energía & Clima": "/icons/pixelarticons/box.svg",
  Logística: "/icons/pixelarticons/truck.svg",
  Movilidad: "/icons/pixelarticons/car.svg",
  "Data Science": "/icons/pixelarticons/chart.svg",
  "Business Analytics": "/icons/pixelarticons/chart.svg",
  Gaming: "/icons/pixelarticons/gamepad.svg",
  "AR / VR": "/icons/pixelarticons/gamepad.svg",
  "Diseño & Creatividad": "/icons/pixelarticons/gamepad.svg",
  "Social & Comunidad": "/icons/pixelarticons/heart.svg",
  "Hardware & IoT": "/icons/pixelarticons/box.svg",
};

const DEFAULT_ICON = "/icons/pixelarticons/box.svg";

/** Chooses one stable local Pixelarticons SVG from the project's first category. */
export function projectIconUrl(tags: string[]): string {
  return CATEGORY_ICONS[tags[0] ?? ""] ?? DEFAULT_ICON;
}
