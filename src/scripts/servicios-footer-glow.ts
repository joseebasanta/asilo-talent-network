// Brillo escalonado del footer (como en la referencia): desde que asoma el footer se ve una línea fina pegada
// al borde inferior de la pantalla; se mantiene así mientras sube el contenido y, en el último tramo
// (mientras entra el espacio reservado al pie), se expande hasta el arco completo al llegar al final.
// Motion usa la animación por scroll nativa del navegador cuando existe y un respaldo en JS cuando no.
// Sin JS o con prefers-reduced-motion el arco se ve completo y quieto (es el estado del CSS).

import { animate, scroll } from "motion";

// Alto de la línea mientras el footer entra (10 %; con el desenfoque se ve como una franja suave).
export const GLOW_START_SCALE = 0.1;
// 0 cuando el espacio reservado asoma por abajo (antes, la línea se queda fina); 1 al final de la página.
export const GLOW_SCROLL_OFFSET = ["start end", "end end"] as const;
// La línea aparece con un fundido durante los primeros 200px del footer, en vez de saltar a la vista.
export const GLOW_FADE_OFFSET = ["start end", "200px end"] as const;
// La expansión arranca y termina suave (ease-in-out) en vez de ir a ritmo constante.
export const GLOW_EASE = [0.65, 0, 0.35, 1] as const;

export function initFooterGlow(glow: HTMLElement): () => void {
  const rise = glow.querySelector<HTMLElement>("[data-footer-glow-rise]");
  const footer = glow.closest("footer");
  const space = footer?.querySelector<HTMLElement>("[data-footer-glow-space]");
  if (!rise || !footer || !space || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return () => {};
  const grow = animate(rise, { transform: [`scaleY(${GLOW_START_SCALE})`, "scaleY(1)"] }, { ease: [...GLOW_EASE] });
  const fade = animate(glow, { opacity: [0, 1] }, { ease: "linear" });
  const stopGrow = scroll(grow, { target: space, offset: [...GLOW_SCROLL_OFFSET] });
  const stopFade = scroll(fade, { target: footer, offset: [...GLOW_FADE_OFFSET] });
  return () => {
    stopGrow();
    stopFade();
  };
}
