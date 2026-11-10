// Íconos de "El problema" que se dibujan solos: cada trazo del ícono (path, rect, circle, line, con pathLength="1")
// se traza de principio a fin, uno tras otro. Pasa una vez cuando la tarjeta aparece en pantalla (también en móvil)
// y de nuevo cada vez que el mouse entra a la tarjeta. La animación vive en CSS (.is-drawing); este script solo la
// reinicia. Con prefers-reduced-motion no se anima y el ícono queda dibujado.

const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";
const CAN_HOVER = "(hover: hover) and (pointer: fine)";

/** Reinicia la animación de trazo del ícono (quitar la clase, forzar el reflujo y volver a ponerla). */
export function redraw(icon: HTMLElement): void {
  icon.classList.remove("is-drawing");
  void icon.offsetWidth;
  icon.classList.add("is-drawing");
}

export function initIconDraw(root: ParentNode = document, win: Window & typeof globalThis = window): void {
  const matches = (q: string) => win.matchMedia?.(q).matches ?? false;
  if (matches(REDUCED_MOTION)) return;

  const cards = Array.from(root.querySelectorAll<HTMLElement>("[data-icon-draw]"));
  const iconOf = (card: HTMLElement) => card.querySelector<HTMLElement>(".s-card-decorator-icon");

  // Al aparecer: se dibuja una vez, con el escalonado de la entrada de la tarjeta (--draw-delay en CSS).
  const seen = typeof win.IntersectionObserver === "undefined"
    ? null
    : new win.IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (!entry.isIntersecting) continue;
            const icon = iconOf(entry.target as HTMLElement);
            if (icon) {
              icon.classList.add("is-first-draw");
              redraw(icon);
            }
            seen?.unobserve(entry.target);
          }
        },
        // Los mismos umbrales que el revelado de las tarjetas (servicios-reveal.ts), para que el trazo acompañe su entrada.
        { threshold: 0.15, rootMargin: "0px 0px -8% 0px" },
      );

  for (const card of cards) {
    const icon = iconOf(card);
    if (!icon) continue;
    seen?.observe(card);
    // Al pasar el mouse: se vuelve a dibujar en el momento, sin el retraso de la entrada.
    card.addEventListener("mouseenter", () => {
      if (!matches(CAN_HOVER)) return;
      icon.classList.remove("is-first-draw");
      redraw(icon);
    });
  }
}
