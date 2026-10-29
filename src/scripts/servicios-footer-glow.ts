// Brillo escalonado del footer (como en la referencia): desde que asoma el footer se ve una línea fina pegada
// al borde inferior de la pantalla; se mantiene así mientras sube el contenido y, en el último tramo
// (mientras entra el espacio reservado al pie), se expande hasta el arco completo al llegar al final.
// Motion usa la animación por scroll nativa del navegador cuando existe y un respaldo en JS cuando no.
// Sin JS o con prefers-reduced-motion el arco se ve completo y quieto (es el estado del CSS).

import { animate, scroll } from "motion";

// Alto de la línea fina mientras el footer entra.
export const GLOW_START_SCALE = 0.04;
// 0 cuando el espacio reservado asoma por abajo (antes, la línea se queda fina); 1 al final de la página.
export const GLOW_SCROLL_OFFSET = ["start end", "end end"] as const;

export function initFooterGlow(glow: HTMLElement): () => void {
  const bars = glow.querySelector<HTMLElement>("[data-footer-glow-bars]");
  const space = glow.parentElement?.querySelector<HTMLElement>("[data-footer-glow-space]");
  if (!bars || !space || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return () => {};
  const rise = animate(bars, { transform: [`scaleY(${GLOW_START_SCALE})`, "scaleY(1)"] }, { ease: "linear" });
  return scroll(rise, { target: space, offset: [...GLOW_SCROLL_OFFSET] });
}
