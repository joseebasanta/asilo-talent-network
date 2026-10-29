// Transición del carrusel de testimonios con Motion: giro 3D. La tarjeta que sale gira ~14° sobre su eje
// vertical y se desliza hacia el lado al que se avanza; la que entra llega desde el lado opuesto con un
// resorte suave. La perspectiva la pone .s-carousel-slides. Con movimiento reducido no se anima.
import { animate } from "motion";

type Direction = 1 | -1;
type Controls = ReturnType<typeof animate>;

const ease = [0.22, 1, 0.36, 1] as const;
// Animaciones en curso por tarjeta, para cortarlas si se cambia rápido varias veces seguidas.
const running = new WeakMap<HTMLElement, Controls[]>();

function stop(...slides: HTMLElement[]) {
  for (const slide of slides) {
    running.get(slide)?.forEach((controls) => controls.stop());
    running.delete(slide);
  }
}

export function animateSwap(from: HTMLElement, to: HTMLElement, direction: Direction): void {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  stop(from, to);

  // La tarjeta anterior ya está marcada como hidden: se mantiene visible mientras sale.
  from.style.visibility = "visible";
  const exit = animate(from, { rotateY: [0, 14 * direction], x: [0, -60 * direction], opacity: [1, 0] }, { duration: 0.45, ease });
  const enter = animate(
    to,
    { rotateY: [-14 * direction, 0], x: [60 * direction, 0], opacity: [0, 1] },
    { type: "spring", bounce: 0.15, duration: 0.7, delay: 0.1 },
  );
  running.set(from, [exit]);
  running.set(to, [enter]);

  exit.finished.then(() => {
    from.style.visibility = "";
    from.style.opacity = "";
    from.style.transform = "";
  });
}
