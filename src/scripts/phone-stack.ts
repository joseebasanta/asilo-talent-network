// Stack de pantallas en cascada: cada STEP_MS todo el stack avanza un puesto en diagonal.
// La de adelante cae fuera del marco y una copia suya entra por arriba, al fondo del stack,
// así el ciclo no termina nunca y no hay dos copias quietas a la vez.
// Uso: un contenedor `data-phone-stack` con hijos `[data-stack-card]` y `style="--slot: N"` (0 = adelante).
// Solo corre mientras el stack está a la vista (si el servicio está cerrado no se ve) y nunca con
// prefers-reduced-motion: ahí queda quieto, igual que sin JS.

// Ritmo y duración medidos en el video de referencia: avanza cada 2,4 s y se mueve durante ~0,9 s.
const STEP_MS = 2400;
// Debe coincidir con la duración de la transición de .l-stack-card en landing.css.
const MOVE_MS = 900;

function initPhoneStack(root: HTMLElement): void {
  const list = root.querySelector<HTMLElement>("[data-stack-card]")?.parentElement;
  let order = Array.from(root.querySelectorAll<HTMLElement>("[data-stack-card]"));
  if (!list || order.length < 2) return;

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const setSlot = (card: HTMLElement, slot: number) => card.style.setProperty("--slot", String(slot));
  let timer = 0;
  let inView = false;

  const step = () => {
    const [front, ...rest] = order;
    if (!front) return;
    const last = order.length - 1;

    // La copia empieza fuera del marco, arriba y detrás de todas, sin transición.
    const entering = front.cloneNode(true) as HTMLElement;
    entering.style.transition = "none";
    entering.dataset.entering = "";
    setSlot(entering, last + 1);
    list.appendChild(entering);
    void entering.offsetWidth;
    entering.style.transition = "";

    // Todo avanza a la vez: la de adelante cae, las demás bajan un puesto y la copia entra al fondo.
    front.dataset.leaving = "";
    setSlot(front, -1);
    rest.forEach((card, i) => setSlot(card, i));
    delete entering.dataset.entering;
    setSlot(entering, last);

    window.setTimeout(() => front.remove(), MOVE_MS);
    order = [...rest, entering];
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
