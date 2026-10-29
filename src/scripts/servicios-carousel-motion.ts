// Transiciones del carrusel de testimonios con Motion. Prototipo con cuatro variantes para elegir
// (data-transition="a" | "b" | "c" | "d" en el contenedor del carrusel); se queda solo la elegida.
import { animate, stagger } from "motion";

type Direction = 1 | -1;
type Controls = { stop: () => void };

const running = new WeakMap<HTMLElement, Controls[]>();
const spring = { type: "spring", bounce: 0.15, duration: 0.6 } as const;
const ease = [0.22, 1, 0.36, 1] as const;

const parts = (slide: HTMLElement) =>
  Array.from(slide.querySelectorAll<HTMLElement>(".s-testimonial-logo, .s-testimonial-quote, .s-testimonial-author"));

// Mientras sale, la tarjeta anterior tiene que seguir visible aunque ya esté marcada como hidden.
function keepVisible(slide: HTMLElement) {
  slide.style.visibility = "visible";
}
function release(slide: HTMLElement) {
  slide.style.visibility = "";
}

function stopAll(...slides: HTMLElement[]) {
  for (const slide of slides) {
    running.get(slide)?.forEach((c) => c.stop());
    running.delete(slide);
  }
}

export function animateSwap(root: HTMLElement, from: HTMLElement, to: HTMLElement, direction: Direction): void {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  stopAll(from, to);
  const variant = root.dataset.transition ?? "a";
  const d = direction;
  keepVisible(from);
  const track: Controls[] = [];

  if (variant === "a") {
    track.push(animate(from, { x: [0, -48 * d], opacity: [1, 0] }, { duration: 0.35, ease }));
    track.push(animate(to, { x: [48 * d, 0], opacity: [0, 1] }, { ...spring, delay: 0.08 }));
  } else if (variant === "b") {
    track.push(animate(from, { x: [0, -64 * d], opacity: [1, 0], scale: [1, 0.96], filter: ["blur(0px)", "blur(10px)"] }, { duration: 0.4, ease }));
    track.push(animate(to, { x: [64 * d, 0], opacity: [0, 1], scale: [0.96, 1], filter: ["blur(10px)", "blur(0px)"] }, { duration: 0.6, ease, delay: 0.1 }));
  } else if (variant === "c") {
    track.push(animate(from, { x: [0, -24 * d], opacity: [1, 0] }, { duration: 0.3, ease }));
    track.push(animate(to, { x: [24 * d, 0], opacity: [0, 1] }, { duration: 0.45, ease, delay: 0.1 }));
    track.push(
      animate(parts(to), { y: [16, 0], opacity: [0, 1], filter: ["blur(4px)", "blur(0px)"] }, { duration: 0.5, ease, delay: stagger(0.08, { startDelay: 0.18 }) }),
    );
  } else {
    track.push(animate(from, { rotateY: [0, 14 * d], x: [0, -60 * d], opacity: [1, 0] }, { duration: 0.45, ease, transformPerspective: 1200 } as never));
    track.push(animate(to, { rotateY: [-14 * d, 0], x: [60 * d, 0], opacity: [0, 1] }, { ...spring, duration: 0.7, delay: 0.1 }));
  }

  running.set(to, track);
  Promise.all(track.map((c) => (c as unknown as Promise<void>))).finally(() => {
    release(from);
    from.style.opacity = "";
    from.style.transform = "";
    from.style.filter = "";
  });
}
