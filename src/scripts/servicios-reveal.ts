// Revelado al hacer scroll: los elementos con [data-reveal] aparecen (fundido y subida suave) la primera vez
// que entran en pantalla. El escalonado sale de la variable --reveal-i que pone el marcado.
// Sin JS, o con prefers-reduced-motion, todo se ve de inmediato: el estado oculto solo existe cuando este script
// marca <html> con la clase s-js y el usuario no pidió menos movimiento.

export function initReveal(doc: Document = document, win: Window & typeof globalThis = window): void {
  const targets = Array.from(doc.querySelectorAll<HTMLElement>("[data-reveal]"));
  const reduceMotion = win.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;

  if (reduceMotion || typeof win.IntersectionObserver === "undefined") {
    for (const el of targets) el.classList.add("is-in");
    return;
  }

  doc.documentElement.classList.add("s-js");
  const observer = new win.IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add("is-in");
        observer.unobserve(entry.target);
      }
    },
    { threshold: 0.15, rootMargin: "0px 0px -8% 0px" },
  );
  for (const el of targets) observer.observe(el);
}
