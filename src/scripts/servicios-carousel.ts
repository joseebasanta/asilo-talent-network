// Carrusel de testimonios: una tarjeta a la vista, flechas que dan la vuelta y un punto por tarjeta.
// Uso: un contenedor `data-carousel` con hijos `[data-slide]`, botones `[data-dot]` (uno por tarjeta),
// `[data-prev]` y `[data-next]`. El HTML ya llega con la primera tarjeta visible; esto solo maneja el cambio.
// No avanza solo, así nadie pierde la lectura a medias.

export interface CarouselOptions {
  // Se llama después de cambiar de tarjeta, para animar el paso. `direction` es 1 hacia adelante y -1 hacia atrás.
  onChange?: (from: HTMLElement, to: HTMLElement, direction: 1 | -1) => void;
}

export function initCarousel(root: HTMLElement, options: CarouselOptions = {}): void {
  const slides = Array.from(root.querySelectorAll<HTMLElement>("[data-slide]"));
  const dots = Array.from(root.querySelectorAll<HTMLButtonElement>("[data-dot]"));
  if (slides.length < 2) return;

  let current = Math.max(0, slides.findIndex((slide) => !slide.hidden));

  const show = (index: number, direction: 1 | -1) => {
    const previous = current;
    current = (index + slides.length) % slides.length;
    if (current === previous) return;
    slides.forEach((slide, i) => (slide.hidden = i !== current));
    dots.forEach((dot, i) => {
      if (i === current) dot.setAttribute("aria-current", "true");
      else dot.removeAttribute("aria-current");
    });
    options.onChange?.(slides[previous], slides[current], direction);
  };

  root.querySelector("[data-prev]")?.addEventListener("click", () => show(current - 1, -1));
  root.querySelector("[data-next]")?.addEventListener("click", () => show(current + 1, 1));
  dots.forEach((dot, i) => dot.addEventListener("click", () => show(i, i > current ? 1 : -1)));
}
