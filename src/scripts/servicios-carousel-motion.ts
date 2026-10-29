// Transición del carrusel de testimonios con Motion: cinemática con cascada. La tarjeta que sale se desliza
// hacia el lado al que se avanza mientras se desenfoca, se achica un poco y se apaga; la que entra llega
// desde el lado opuesto enfocándose, y su logo, cita y autor aparecen uno tras otro desde abajo.
// Con movimiento reducido no se anima.
import { animate, stagger } from "motion";

type Direction = 1 | -1;
type Controls = ReturnType<typeof animate>;

// Curvas suaves: la salida acelera y frena de forma pareja; la entrada desacelera sin arranque brusco.
const easeExit = [0.65, 0, 0.35, 1] as const;
const easeEnter = [0.33, 1, 0.68, 1] as const;
// Animaciones en curso por tarjeta, para cortarlas si se cambia rápido varias veces seguidas.
const running = new WeakMap<HTMLElement, Controls[]>();

const parts = (slide: HTMLElement) =>
  Array.from(slide.querySelectorAll<HTMLElement>(".s-testimonial-logo, .s-testimonial-quote, .s-testimonial-author"));

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
  const exit = animate(
    from,
    { x: [0, -64 * direction], scale: [1, 0.96], opacity: [1, 0], filter: ["blur(0px)", "blur(10px)"] },
    { duration: 0.6, ease: easeExit },
  );
  const enter = animate(
    to,
    { x: [64 * direction, 0], scale: [0.96, 1], opacity: [0, 1], filter: ["blur(10px)", "blur(0px)"] },
    { duration: 0.9, ease: easeEnter, delay: 0.15 },
  );
  const cascade = animate(
    parts(to),
    { y: [16, 0], opacity: [0, 1], filter: ["blur(4px)", "blur(0px)"] },
    { duration: 0.7, ease: easeEnter, delay: stagger(0.12, { startDelay: 0.3 }) },
  );
  running.set(from, [exit]);
  running.set(to, [enter, cascade]);

  exit.finished.then(() => {
    from.style.visibility = "";
    from.style.opacity = "";
    from.style.transform = "";
    from.style.filter = "";
  });
}
