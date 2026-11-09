// Video de proyecto: la tarjeta muestra su imagen y, encima, un recorrido en video aparece con un fundido y se
// reproduce en bucle (silenciado). Al terminar se pausa, se desvanece y vuelve al inicio.
// - Con mouse (hover: hover y pointer: fine): se reproduce mientras el mouse está sobre la tarjeta.
// - En pantallas táctiles (sin hover): se reproduce sola mientras la imagen está a la vista (al menos un 60 %).
// Con prefers-reduced-motion no se reproduce nunca y queda la imagen fija. El video aparece recién cuando ya hay
// cuadros ("playing"), así nunca se ve un marco vacío; mientras carga sigue la imagen. Se precarga cuando la tarjeta
// se acerca a la pantalla.

const CAN_HOVER = "(hover: hover) and (pointer: fine)";
const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";
// Lo mismo que dura el fundido en CSS: recién entonces se rebobina, para que no salte mientras se desvanece.
const FADE_MS = 300;
// Parte de la imagen que tiene que verse en pantallas táctiles para que el video arranque.
export const IN_VIEW_RATIO = 0.6;

export function initProjectVideos(root: ParentNode = document, win: Window & typeof globalThis = window): void {
  const matches = (query: string) => win.matchMedia?.(query).matches ?? false;
  const canAnimate = () => !matches(REDUCED_MOTION);
  const canHover = () => matches(CAN_HOVER);
  const videos = Array.from(root.querySelectorAll<HTMLVideoElement>("video[data-project-video]"));
  const hasObserver = typeof win.IntersectionObserver !== "undefined";

  const warm = (video: HTMLVideoElement) => {
    if (video.preload !== "auto") video.preload = "auto";
  };
  const preloader = hasObserver
    ? new win.IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (!entry.isIntersecting || !canAnimate()) continue;
            warm(entry.target as HTMLVideoElement);
            preloader?.unobserve(entry.target);
          }
        },
        { rootMargin: "200px 0px" },
      )
    : null;

  for (const video of videos) {
    const card = video.closest<HTMLElement>(".s-project");
    if (!card) continue;
    let active = false;
    let rewind: ReturnType<typeof setTimeout> | undefined;

    const start = () => {
      active = true;
      clearTimeout(rewind);
      warm(video);
      video.play()?.catch(() => {
        // Si el navegador no deja reproducir, la imagen sigue a la vista.
      });
    };
    const stop = () => {
      if (!active) return;
      active = false;
      video.classList.remove("is-playing");
      video.pause();
      clearTimeout(rewind);
      rewind = setTimeout(() => {
        if (!active) video.currentTime = 0;
      }, FADE_MS);
    };

    preloader?.observe(video);
    video.addEventListener("playing", () => {
      if (active) video.classList.add("is-playing");
    });

    // Con mouse: hover.
    card.addEventListener("mouseenter", () => {
      if (canHover() && canAnimate()) start();
    });
    card.addEventListener("mouseleave", () => {
      if (canHover()) stop();
    });

    // Sin hover (móvil y tablet): cuando la imagen entra en pantalla.
    if (hasObserver) {
      new win.IntersectionObserver(
        (entries) => {
          if (canHover()) return;
          for (const entry of entries) {
            if (entry.isIntersecting && entry.intersectionRatio >= IN_VIEW_RATIO && canAnimate()) start();
            else stop();
          }
        },
        { threshold: [0, IN_VIEW_RATIO] },
      ).observe(video);
    }
  }
}
