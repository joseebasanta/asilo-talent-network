// Stack de pantallas: cada cierto tiempo la de adelante se desvanece hacia el frente,
// las demás avanzan un puesto y la que salió reaparece al fondo.
// Uso: un contenedor `data-phone-stack` con hijos `[data-stack-card]` y `style="--slot: N"` (0 = adelante).
// Solo corre mientras el stack está a la vista (si el servicio está cerrado no se ve) y nunca con
// prefers-reduced-motion: ahí queda quieto, igual que sin JS.

const STEP_MS = 3200;
// Debe coincidir con la duración de la transición de .l-stack-card en landing.css.
const MOVE_MS = 900;

function initPhoneStack(root: HTMLElement): void {
  let order = Array.from(root.querySelectorAll<HTMLElement>("[data-stack-card]"));
  if (order.length < 2) return;

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const setSlot = (card: HTMLElement, slot: number) => card.style.setProperty("--slot", String(slot));
  let timer = 0;
  let inView = false;

  const step = () => {
    const [front, ...rest] = order;
    if (!front) return;
    // La de adelante sale hacia el frente mientras se desvanece; las demás avanzan.
    front.dataset.leaving = "";
    rest.forEach((card, i) => setSlot(card, i));
    window.setTimeout(() => {
      // Detrás de la última, invisible y sin transición; desde ahí entra al fondo del stack.
      front.style.transition = "none";
      delete front.dataset.leaving;
      front.dataset.hidden = "";
      setSlot(front, order.length);
      void front.offsetWidth;
      front.style.transition = "";
      setSlot(front, order.length - 1);
      delete front.dataset.hidden;
    }, MOVE_MS);
    order = [...rest, front];
  };

  const update = () => {
    window.clearInterval(timer);
    timer = 0;
    if (inView && !reduceMotion.matches && !document.hidden) timer = window.setInterval(step, STEP_MS);
  };

  new IntersectionObserver(
    ([entry]) => {
      inView = Boolean(entry?.isIntersecting);
      update();
    },
    { threshold: 0.3 },
  ).observe(root);
  document.addEventListener("visibilitychange", update);
  reduceMotion.addEventListener("change", update);
}

document.querySelectorAll<HTMLElement>("[data-phone-stack]").forEach(initPhoneStack);

export {};
