// Brillo escalonado del footer: nueve columnas con el mismo degradado que suben, ligadas al scroll,
// desde una línea fina hasta el arco completo al llegar al final de la página. Motion usa la animación
// por scroll nativa del navegador cuando existe y un respaldo en JS cuando no.
// Sin JS o con prefers-reduced-motion el arco se ve completo y quieto (es el estado del CSS).

import { animate, scroll } from "motion";

// Alto de partida: una línea fina, como en la referencia.
export const GLOW_START_SCALE = 0.04;

// El brillo es sticky al borde inferior de la pantalla, pero no puede subir por encima del contenido del
// footer: queda pegado abajo recién cuando asoman el padding superior del footer y el alto del brillo.
// Desde ese punto (0) hasta el final de la página (1) crece, así la línea se ve desde el primer momento.
export function glowScrollOffset(paddingTop: number, glowHeight: number): [`${number}px end`, "end end"] {
  return [`${Math.round(paddingTop + glowHeight)}px end`, "end end"];
}

export function initFooterGlow(glow: HTMLElement): () => void {
  const bars = glow.querySelector<HTMLElement>("[data-footer-glow-bars]");
  const footer = glow.closest("footer");
  if (!bars || !footer || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return () => {};

  let stop = () => {};
  const bind = () => {
    stop();
    const offset = glowScrollOffset(parseFloat(getComputedStyle(footer).paddingTop) || 0, glow.offsetHeight);
    const rise = animate(bars, { transform: [`scaleY(${GLOW_START_SCALE})`, "scaleY(1)"] }, { ease: "linear" });
    stop = scroll(rise, { target: footer, offset });
  };
  bind();
  // El alto del brillo y el padding del footer cambian con el ancho de la pantalla.
  let frame = 0;
  const onResize = () => {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(bind);
  };
  window.addEventListener("resize", onResize);
  return () => {
    window.removeEventListener("resize", onResize);
    stop();
  };
}
