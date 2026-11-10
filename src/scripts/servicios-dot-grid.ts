// Grilla de puntos interactiva del CTA final: una retícula de puntos pequeños; donde pasa el mouse, los puntos se
// "estiran" en segmentos hacia sus vecinos y forman una grilla azul (blanca en el centro) que se apaga detrás del
// cursor como una estela. En pantallas sin hover (móvil y tablet) un cursor fantasma recorre la sección despacio
// mientras está a la vista. Con prefers-reduced-motion solo se dibujan los puntos, quietos.
// Se dibuja en un <canvas> del tamaño del fondo de la sección; solo anima mientras la sección está a la vista y hay
// algo encendido. Los colores salen de --dot-color, --line-from y --line-to del canvas.

export interface DotNode {
  x: number;
  y: number;
  /** Activación de 0 a 1: cuánto se estiran sus segmentos. */
  a: number;
}

/** Distancia entre puntos. */
export const GAP = 48;
/** Radio de influencia del cursor. */
export const RADIUS = 180;
/** Tiempo que tarda un punto encendido en apagarse del todo (la estela). */
export const FADE_MS = 900;
/** Espacio libre alrededor de cada punto antes de que empiece su segmento. */
const DOT_GAP = 6;

type RGB = [number, number, number];

/** Retícula centrada en el área: una fila y una columna de puntos cada GAP px, cubriendo todo el ancho y el alto. */
export function buildNodes(width: number, height: number, gap = GAP): { nodes: DotNode[]; cols: number; rows: number } {
  const cols = Math.floor(width / gap) + 1;
  const rows = Math.floor(height / gap) + 1;
  const offsetX = (width - (cols - 1) * gap) / 2;
  const offsetY = (height - (rows - 1) * gap) / 2;
  const nodes: DotNode[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) nodes.push({ x: offsetX + c * gap, y: offsetY + r * gap, a: 0 });
  }
  return { nodes, cols, rows };
}

/** Intensidad según la distancia al cursor: 1 justo debajo, 0 desde el borde del radio, con una curva suave. */
export function falloff(distance: number, radius = RADIUS): number {
  if (distance >= radius) return 0;
  const t = 1 - distance / radius;
  return t * t * (3 - 2 * t);
}

/** La estela: la activación baja de forma lineal hasta 0 en FADE_MS. */
export const decay = (a: number, dt: number, fade = FADE_MS): number => Math.max(0, a - dt / fade);

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const easeOut = (t: number) => 1 - (1 - t) ** 3;

/** Largo del segmento entre dos puntos vecinos: crece con la activación, dejando libre el entorno de cada punto. */
export const edgeLength = (a: number, gap = GAP): number => (gap - 2 * DOT_GAP) * easeOut(clamp01(a));

/** Color del segmento: del azul de marca (poca activación, borde del efecto) al azul claro (centro), con opacidad creciente. */
export function edgeColor(a: number, from: RGB, to: RGB): string {
  const t = clamp01(a);
  const mix = from.map((v, i) => Math.round(v + (to[i]! - v) * t));
  const alpha = Math.min(1, 0.15 + t * 0.95);
  return `rgba(${mix[0]}, ${mix[1]}, ${mix[2]}, ${alpha.toFixed(3)})`;
}

/** Lee un color #rgb o #rrggbb; si no se puede, usa el de respaldo. */
export function parseHex(value: string, fallback: RGB): RGB {
  const hex = value.trim().replace("#", "");
  const full = hex.length === 3 ? hex.split("").map((h) => h + h).join("") : hex;
  if (!/^[0-9a-f]{6}$/i.test(full)) return fallback;
  return [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16)) as RGB;
}

export function initDotGrid(canvas: HTMLCanvasElement): void {
  const host = canvas.parentElement;
  const section = canvas.closest<HTMLElement>("section") ?? host;
  const ctx = canvas.getContext("2d");
  if (!host || !section || !ctx) return;

  const style = getComputedStyle(canvas);
  const dotColor = style.getPropertyValue("--dot-color").trim() || "#737373";
  const from = parseHex(style.getPropertyValue("--line-from"), [0, 102, 255]);
  const to = parseHex(style.getPropertyValue("--line-to"), [153, 194, 255]);

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const noHover = window.matchMedia("(hover: none)");

  let grid = buildNodes(0, 0);
  let width = 0;
  let height = 0;
  let raf = 0;
  let last = 0;
  let inView = false;
  let ghostTime = 0;
  const pointer = { x: 0, y: 0, inside: false };

  const ghostOn = () => noHover.matches && !reduceMotion.matches && inView;

  const energize = (px: number, py: number) => {
    for (const n of grid.nodes) {
      const d = Math.hypot(n.x - px, n.y - py);
      if (d < RADIUS) n.a = Math.max(n.a, falloff(d));
    }
  };

  const draw = () => {
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = dotColor;
    for (const n of grid.nodes) ctx.fillRect(n.x - 0.75, n.y - 0.75, 1.5, 1.5);
    if (reduceMotion.matches) return;
    const { nodes, cols, rows } = grid;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const n = nodes[r * cols + c]!;
        // Segmento hacia la derecha y hacia abajo, centrado entre los dos puntos.
        if (c < cols - 1) {
          const m = nodes[r * cols + c + 1]!;
          const ea = (n.a + m.a) / 2;
          if (ea > 0.01) {
            const len = edgeLength(ea);
            ctx.fillStyle = edgeColor(ea, from, to);
            ctx.fillRect(n.x + GAP / 2 - len / 2, n.y - 0.5, len, 1);
          }
        }
        if (r < rows - 1) {
          const m = nodes[(r + 1) * cols + c]!;
          const ea = (n.a + m.a) / 2;
          if (ea > 0.01) {
            const len = edgeLength(ea);
            ctx.fillStyle = edgeColor(ea, from, to);
            ctx.fillRect(n.x - 0.5, n.y + GAP / 2 - len / 2, 1, len);
          }
        }
      }
    }
  };

  const step = (now: number) => {
    const dt = last ? Math.min(64, now - last) : 16;
    last = now;
    let any = false;
    for (const n of grid.nodes) {
      n.a = decay(n.a, dt);
      if (n.a > 0) any = true;
    }
    if (pointer.inside) energize(pointer.x, pointer.y);
    if (ghostOn()) {
      // Cursor fantasma: una curva de Lissajous lenta que recorre casi toda la sección.
      ghostTime += dt;
      energize(width * (0.5 + 0.4 * Math.sin(ghostTime / 2600)), height * (0.5 + 0.35 * Math.sin(ghostTime / 1700 + 1)));
      any = true;
    }
    draw();
    if (inView && (pointer.inside || any)) raf = requestAnimationFrame(step);
    else {
      raf = 0;
      last = 0;
    }
  };

  const kick = () => {
    if (raf || !inView || reduceMotion.matches) return;
    raf = requestAnimationFrame(step);
  };

  const build = () => {
    const rect = host.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = Math.floor(rect.width);
    height = Math.floor(rect.height);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    grid = buildNodes(width, height);
    draw();
  };

  section.addEventListener("pointermove", (e) => {
    if (e.pointerType !== "mouse" || reduceMotion.matches) return;
    const rect = canvas.getBoundingClientRect();
    pointer.x = e.clientX - rect.left;
    pointer.y = e.clientY - rect.top;
    pointer.inside = true;
    kick();
  });
  section.addEventListener("pointerleave", () => {
    pointer.inside = false;
  });

  new ResizeObserver(() => {
    build();
    kick();
  }).observe(host);
  new IntersectionObserver(([entry]) => {
    inView = entry!.isIntersecting;
    if (inView) kick();
    else {
      cancelAnimationFrame(raf);
      raf = 0;
      last = 0;
    }
  }).observe(host);
  reduceMotion.addEventListener("change", () => {
    draw();
    kick();
  });
}
