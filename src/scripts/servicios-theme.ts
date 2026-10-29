// Botón de tema del nav: alterna entre modo oscuro (por defecto) y claro. El tema vive en
// <html data-theme="light">; sin el atributo la página está en oscuro. La elección se guarda en
// localStorage y el script inline del <head> (servicios.astro) la aplica antes del primer pintado.

export type Theme = "dark" | "light";

export const THEME_STORAGE_KEY = "asilo-theme";
export const THEME_CHANGE_EVENT = "servicios:themechange";
// Mismo color que el fondo de cada tema, para la barra del navegador en móvil.
export const THEME_COLORS: Record<Theme, string> = { dark: "#0f0f0f", light: "#f7f7f7" };
// La etiqueta dice lo que hace el botón, no el estado actual.
const LABELS: Record<Theme, string> = { dark: "Cambiar a modo claro", light: "Cambiar a modo oscuro" };

export const readTheme = (root: HTMLElement): Theme => (root.dataset.theme === "light" ? "light" : "dark");

export function applyTheme(theme: Theme, root: HTMLElement): void {
  if (theme === "light") root.dataset.theme = "light";
  else delete root.dataset.theme;
  root.ownerDocument.querySelector('meta[name="theme-color"]')?.setAttribute("content", THEME_COLORS[theme]);
}

// En modo privado o con almacenamiento bloqueado, acceder a localStorage puede lanzar un error.
function defaultStorage(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function initThemeToggle(
  button: HTMLButtonElement,
  { root = document.documentElement, storage = defaultStorage() }: { root?: HTMLElement; storage?: Storage | null } = {},
): void {
  const doc = root.ownerDocument;
  const syncLabel = () => button.setAttribute("aria-label", LABELS[readTheme(root)]);
  syncLabel();

  button.addEventListener("click", () => {
    const next: Theme = readTheme(root) === "light" ? "dark" : "light";
    const swap = () => {
      applyTheme(next, root);
      syncLabel();
      doc.dispatchEvent(new CustomEvent(THEME_CHANGE_EVENT, { detail: { theme: next } }));
    };
    const reduceMotion = doc.defaultView?.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    // Fundido corto de toda la página donde hay View Transitions; si no, el cambio es inmediato.
    if (!reduceMotion && typeof doc.startViewTransition === "function") doc.startViewTransition(swap);
    else swap();
    try {
      storage?.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // Sin almacenamiento el tema dura hasta recargar.
    }
  });
}
