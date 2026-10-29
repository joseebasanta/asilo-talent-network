// Fondo de píxeles del hero (adaptado de "pixel-perfect-hero"): una grilla de píxeles diminutos que
// aparecen en onda desde el centro y luego titilan. Se dibuja en un <canvas> del tamaño del hero; solo
// anima mientras el hero está a la vista. Con prefers-reduced-motion se dibuja una vez, quieta.
// Los colores salen de las variables CSS --pixel-muted y --pixel-accent del canvas (4 de 5 son muted).

export interface Pixel {
  x: number;
  y: number;
  color: string;
  speed: number;
  size: number;
  sizeStep: number;
  minSize: number;
  maxSize: number;
  delay: number;
  counter: number;
  counterStep: number;
  isReverse: boolean;
  isShimmer: boolean;
}

// Los píxeles se centran en una celda de 2px, como en el original.
const CELL = 2;
export const GAP = 6;
// Velocidad del original (speed = 30) ya convertida: 30 × 0,001.
const BASE_SPEED = 0.03;

export function createPixel(
  x: number,
  y: number,
  color: string,
  delay: number,
  area: { width: number; height: number },
  rand = Math.random,
): Pixel {
  const between = (min: number, max: number) => rand() * (max - min) + min;
  return {
    x,
    y,
    color,
    speed: between(0.08, 0.4) * BASE_SPEED,
    size: 0,
    sizeStep: between(0.12, 0.28),
    minSize: 0.5,
    maxSize: between(0.5, 2),
    delay,
    counter: 0,
    counterStep: between(1.8, 3.2) + (area.width + area.height) * 0.008,
    isReverse: false,
    isShimmer: false,
  };
}

// La onda: cuanto más lejos del centro, más tarda en aparecer.
export const rippleDelay = (x: number, y: number, width: number, height: number) =>
  Math.hypot(x - width / 2, y - height / 2) * 0.65;

// Un cuadro de la animación de entrada. Devuelve si el píxel ya se ve (y hay que dibujarlo).
export function appear(p: Pixel): boolean {
  if (p.counter <= p.delay) {
    p.counter += p.counterStep;
    return false;
  }
  if (p.size >= p.maxSize) p.isShimmer = true;
  if (p.isShimmer) {
    if (p.size >= p.maxSize) p.isReverse = true;
    else if (p.size <= p.minSize) p.isReverse = false;
    p.size += p.isReverse ? -p.speed : p.speed;
  } else {
    p.size += p.sizeStep;
  }
  return true;
}

export function buildGrid(width: number, height: number, colors: string[], rand = Math.random): Pixel[] {
  const pixels: Pixel[] = [];
  for (let x = 0; x < width; x += GAP) {
    for (let y = 0; y < height; y += GAP) {
      const color = colors[Math.floor(rand() * colors.length)];
      pixels.push(createPixel(x, y, color, rippleDelay(x, y, width, height), { width, height }, rand));
    }
  }
  return pixels;
}

export function initPixels(canvas: HTMLCanvasElement): void {
  const host = canvas.parentElement;
  const ctx = canvas.getContext("2d");
  if (!host || !ctx) return;

  const style = getComputedStyle(canvas);
  const muted = style.getPropertyValue("--pixel-muted").trim() || "#a3a3a3";
  const accent = style.getPropertyValue("--pixel-accent").trim() || "#0066ff";
  const colors = [muted, muted, muted, muted, accent];

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const frameInterval = 1000 / 60;
  // Agrupados por color para cambiar fillStyle una vez por color y no una vez por píxel.
  let groups: Pixel[][] = [];
  let width = 0;
  let height = 0;
  let raf = 0;
  let last = 0;
  let inView = false;

  const fill = (p: Pixel) => {
    const offset = CELL * 0.5 - p.size * 0.5;
    ctx.fillRect(p.x + offset, p.y + offset, p.size, p.size);
  };

  const build = () => {
    const rect = host.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = Math.floor(rect.width);
    height = Math.floor(rect.height);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const pixels = buildGrid(width, height, colors);
    groups = colors
      .filter((c, i) => colors.indexOf(c) === i)
      .map((c) => pixels.filter((p) => p.color === c));
  };

  const drawStatic = () => {
    ctx.clearRect(0, 0, width, height);
    for (const group of groups) {
      if (!group.length) continue;
      ctx.fillStyle = group[0].color;
      for (const p of group) {
        p.size = p.maxSize;
        fill(p);
      }
    }
  };

  const loop = (now: number) => {
    raf = requestAnimationFrame(loop);
    const elapsed = now - last;
    if (elapsed < frameInterval) return;
    last = now - (elapsed % frameInterval);
    ctx.clearRect(0, 0, width, height);
    for (const group of groups) {
      if (!group.length) continue;
      ctx.fillStyle = group[0].color;
      for (const p of group) if (appear(p)) fill(p);
    }
  };

  const sync = () => {
    cancelAnimationFrame(raf);
    raf = 0;
    if (reduceMotion.matches) drawStatic();
    else if (inView) raf = requestAnimationFrame(loop);
  };

  new ResizeObserver(() => {
    build();
    sync();
  }).observe(host);
  new IntersectionObserver(([entry]) => {
    inView = entry.isIntersecting;
    sync();
  }).observe(host);
  reduceMotion.addEventListener("change", sync);
}
