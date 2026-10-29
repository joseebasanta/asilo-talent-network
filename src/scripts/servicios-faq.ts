// Acordeón del FAQ: una sola pregunta abierta a la vez. El HTML usa <details name="faq">, que ya es
// exclusivo sin JavaScript; este script toma el control para animar con Motion la respuesta que se abre y
// la que se cierra al mismo tiempo. Con movimiento reducido el cambio es instantáneo.
import { animate } from "motion";

const ease = [0.33, 1, 0.68, 1] as const;
const duration = 0.45;

export interface FaqOptions {
  // Si es false se abre y cierra sin animar (movimiento reducido y tests).
  animated?: boolean;
}

export function initFaq(list: HTMLElement, options: FaqOptions = {}): void {
  const items = Array.from(list.querySelectorAll<HTMLDetailsElement>("details"));
  if (!items.length) return;
  const animated = () =>
    options.animated ?? !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  // Animación en curso y número de cambio por respuesta: solo el último cambio limpia los estilos, así una
  // ráfaga de clics no deja alturas ni opacidades pegadas.
  const running = new WeakMap<HTMLElement, { stop: () => void }>();
  const generation = new WeakMap<HTMLElement, number>();

  // Sin el atributo name, el navegador ya no cierra las demás de golpe: lo hace este script, animado.
  for (const item of items) item.removeAttribute("name");

  const wrapOf = (item: HTMLDetailsElement) => item.querySelector<HTMLElement>(".s-faq-answer-wrap");

  const start = (wrap: HTMLElement) => {
    running.get(wrap)?.stop();
    const id = (generation.get(wrap) ?? 0) + 1;
    generation.set(wrap, id);
    return id;
  };
  const clear = (wrap: HTMLElement) => {
    wrap.style.height = "";
    wrap.style.opacity = "";
  };

  const open = (item: HTMLDetailsElement) => {
    const wrap = wrapOf(item);
    item.removeAttribute("data-closing");
    item.open = true;
    if (!wrap) return;
    const id = start(wrap);
    if (!animated()) return clear(wrap);
    const height = wrap.scrollHeight;
    const controls = animate(wrap, { height: [0, height], opacity: [0, 1] }, { duration, ease });
    running.set(wrap, controls);
    controls.finished.then(() => {
      if (generation.get(wrap) === id) clear(wrap);
    });
  };

  const close = (item: HTMLDetailsElement) => {
    const wrap = wrapOf(item);
    if (item.hasAttribute("data-closing")) return;
    if (!wrap || !animated()) {
      if (wrap) {
        start(wrap);
        clear(wrap);
      }
      item.open = false;
      return;
    }
    const id = start(wrap);
    item.setAttribute("data-closing", "");
    const controls = animate(wrap, { height: [wrap.offsetHeight, 0], opacity: [1, 0] }, { duration, ease });
    running.set(wrap, controls);
    controls.finished.then(() => {
      // Si mientras se cerraba se volvió a abrir, ese cambio es más nuevo y se encarga de los estilos.
      if (generation.get(wrap) !== id) return;
      item.open = false;
      item.removeAttribute("data-closing");
      clear(wrap);
    });
  };

  for (const item of items) {
    item.querySelector("summary")?.addEventListener("click", (event) => {
      event.preventDefault();
      const isOpen = item.open && !item.hasAttribute("data-closing");
      if (isOpen) {
        close(item);
        return;
      }
      for (const other of items) if (other !== item && other.open) close(other);
      open(item);
    });
  }
}
