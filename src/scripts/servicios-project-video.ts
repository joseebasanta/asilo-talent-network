// Video de proyecto al pasar el mouse: la tarjeta muestra su imagen y, en hover, un recorrido en video aparece con
// un fundido encima y se reproduce en bucle (silenciado). Al salir se pausa, se desvanece y vuelve al inicio.
// Solo con mouse (hover: hover y pointer: fine) y sin prefers-reduced-motion: en pantallas táctiles o con movimiento
// reducido queda la imagen fija. El video aparece recién cuando ya hay cuadros ("playing"), así nunca se ve un
// marco vacío; mientras carga sigue la imagen. Se precarga cuando la tarjeta se acerca a la pantalla.

const CAN_HOVER = "(hover: hover) and (pointer: fine)";
const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";
// Lo mismo que dura el fundido en CSS: recién entonces se rebobina, para que no salte mientras se desvanece.
const FADE_MS = 300;

export function initProjectVideos(root: ParentNode = document, win: Window & typeof globalThis = window): void {
  const canPlay = () => (win.matchMedia?.(CAN_HOVER).matches ?? false) && !(win.matchMedia?.(REDUCED_MOTION).matches ?? false);
  const videos = Array.from(root.querySelectorAll<HTMLVideoElement>("video[data-project-video]"));

  const warm = (video: HTMLVideoElement) => {
    if (video.preload !== "auto") video.preload = "auto";
  };
  const observer =
    typeof win.IntersectionObserver === "undefined"
      ? null
      : new win.IntersectionObserver(
          (entries) => {
            for (const entry of entries) {
              if (!entry.isIntersecting || !canPlay()) continue;
              warm(entry.target as HTMLVideoElement);
              observer?.unobserve(entry.target);
            }
          },
          { rootMargin: "200px 0px" },
        );

  for (const video of videos) {
    const card = video.closest<HTMLElement>(".s-project");
    if (!card) continue;
    let hovered = false;
    let rewind: ReturnType<typeof setTimeout> | undefined;

    observer?.observe(video);

    card.addEventListener("mouseenter", () => {
      if (!canPlay()) return;
      hovered = true;
      clearTimeout(rewind);
      warm(video);
      video.play()?.catch(() => {
        // Si el navegador no deja reproducir, la imagen sigue a la vista.
      });
    });
    video.addEventListener("playing", () => {
      if (hovered) video.classList.add("is-playing");
    });
    card.addEventListener("mouseleave", () => {
      hovered = false;
      video.classList.remove("is-playing");
      video.pause();
      clearTimeout(rewind);
      rewind = setTimeout(() => {
        if (!hovered) video.currentTime = 0;
      }, FADE_MS);
    });
  }
}
