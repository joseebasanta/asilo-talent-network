// Menú burger del nav en móvil: un botón abre y cierra el panel de enlaces (aria-expanded + data-open).
// Se cierra al elegir un enlace, al pulsar Escape (devolviendo el foco al botón), al tocar fuera y al pasar a
// escritorio. Marca <html> con s-menu-js: sin JS el panel queda visible bajo el logo y el botón no aparece.

const DESKTOP = "(min-width: 768px)";

export function initNavMenu(nav: HTMLElement, win: Window & typeof globalThis = window): void {
  const toggle = nav.querySelector<HTMLButtonElement>("[data-nav-toggle]");
  const menu = nav.querySelector<HTMLElement>("[data-nav-menu]");
  if (!toggle || !menu) return;

  const doc = nav.ownerDocument;
  doc.documentElement.classList.add("s-menu-js");

  const setOpen = (open: boolean) => {
    if (open) nav.setAttribute("data-open", "");
    else nav.removeAttribute("data-open");
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Cerrar menú" : "Abrir menú");
  };
  const isOpen = () => nav.hasAttribute("data-open");

  toggle.addEventListener("click", () => setOpen(!isOpen()));
  menu.addEventListener("click", (event) => {
    if ((event.target as Element).closest("a")) setOpen(false);
  });
  doc.addEventListener("keydown", (event) => {
    if (event.key !== "Escape" || !isOpen()) return;
    setOpen(false);
    toggle.focus();
  });
  doc.addEventListener("click", (event) => {
    if (isOpen() && !nav.contains(event.target as Node)) setOpen(false);
  });
  win.matchMedia?.(DESKTOP).addEventListener?.("change", (event) => {
    if (event.matches) setOpen(false);
  });
}
