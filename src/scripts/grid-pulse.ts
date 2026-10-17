// GridPulse: cuadrícula fina que toma color donde pasa el puntero y lo suelta un momento después,
// con algunas celdas que se encienden solas. El espectro recorre el campo de arriba abajo como una
// carta de color impresa, así un barrido revela una banda de color coherente y no confeti.
// Port en vanilla TS del componente GridPulse de React, con sus mismos valores.
// Uso: un contenedor `data-grid-pulse` (posicionado, debajo del contenido) con un `<canvas>` dentro.
// Opciones por atributo: data-cell, data-reach, data-ambient, data-max-lit, data-avoid.
// Es solo decoración: oculta a tecnologías de asistencia, transparente al puntero, dibujada en un
// canvas que duerme cuando nada está encendido, en pausa fuera de pantalla y quieta con
// prefers-reduced-motion.

/** Tono arriba del campo y cuánto gira hasta abajo: amarillo, naranja, rojo, magenta y azul, a verde. */
const HUE_TOP = 60;
const HUE_SPAN = 270;
/**
 * Cada celda toma una de estas luminosidades, así un barrido se lee como un campo de tintes y no
 * como un color plano. Sobre fondo oscuro el extremo pálido se iría a gris, por eso empieza más hondo.
 */
const TINTS = [88, 80, 72, 64, 56];
const TINTS_DARK = [72, 65, 58, 51, 44];
/** Qué tan tenue queda una celda justo detrás de una línea de texto. */
const FAINT = 0.13;
/** Cuántas celdas tarda en volver a toda su fuerza. */
const FADE = 2.2;
/** Margen libre alrededor de cada línea de texto, en px. */
const PAD = 5;
const FADE_IN = 160;
const FADE_OUT = 750;

type Cell = {
  col: number;
  row: number;
  colour: string;
  /** Cuánto de su color se le permite a la celda, de 0 a 1. */
  dim: number;
  born: number;
  /** Cuándo empieza a apagarse. */
  until: number;
};

const easeOut = (t: number) => 1 - (1 - t) ** 2;
const easeIn = (t: number) => t * t;
const num = (el: HTMLElement, key: string, fallback: number): number => {
  const value = Number(el.dataset[key]);
  return el.dataset[key] !== undefined && Number.isFinite(value) ? value : fallback;
};

function initGridPulse(el: HTMLElement): void {
  const paper = el.querySelector("canvas");
  const ctx = paper?.getContext("2d");
  if (!paper || !ctx) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const cell = num(el, "cell", 24);
  const reach = num(el, "reach", 2.6);
  const ambient = num(el, "ambient", 2);
  const maxLit = num(el, "maxLit", 180);
  const avoid = el.dataset.avoid ?? "[data-grid-avoid]";
  el.style.setProperty("--grid-pulse-cell", `${cell}px`);

  let cols = 1;
  let rows = 1;
  let width = 0;
  let height = 0;
  let clear: DOMRect[] = [];
  let tints = TINTS;
  const cells = new Map<string, Cell>();

  // Fondo claro u oscuro, leído del color de texto que hereda la cuadrícula, así sigue cualquier
  // cambio de tema. Se resuelve a través de un píxel, porque el color calculado puede venir en oklch.
  const probe = document.createElement("canvas").getContext("2d", { willReadFrequently: true });
  const readTheme = () => {
    if (!probe) return;
    probe.clearRect(0, 0, 1, 1);
    probe.fillStyle = getComputedStyle(el).color;
    probe.fillRect(0, 0, 1, 1);
    const [r = 0, g = 0, b = 0] = probe.getImageData(0, 0, 1, 1).data;
    const light = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255 > 0.5;
    tints = light ? TINTS_DARK : TINTS;
  };

  // Protege las líneas de texto, no las cajas que las contienen: un párrafo con medida fija conserva
  // ese ancho en su última línea corta, y la caja dejaría una banda oscura donde no hay nada que leer.
  const measureText = () => {
    const bounds = el.getBoundingClientRect();
    const scope = el.parentElement ?? document;
    clear = [...scope.querySelectorAll(avoid)].flatMap((node) => {
      const range = document.createRange();
      range.selectNodeContents(node);
      const lines = [...range.getClientRects()].filter((r) => r.width > 0 && r.height > 0);
      const boxes = lines.length > 0 ? lines : [node.getBoundingClientRect()];
      return boxes.map(
        (r) =>
          new DOMRect(r.left - bounds.left - PAD, r.top - bounds.top - PAD, r.width + PAD * 2, r.height + PAD * 2),
      );
    });
  };

  const measure = () => {
    width = el.clientWidth;
    height = el.clientHeight;
    cols = Math.max(1, Math.ceil(width / cell));
    rows = Math.max(1, Math.ceil(height / cell));
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    paper.width = Math.round(width * dpr);
    paper.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    readTheme();
    measureText();
    wake();
  };

  /**
   * Qué tan brillante puede ser una celda según su distancia a la línea de texto más cercana. Detrás
   * de las palabras se vuelven tenues, no oscuras: un hueco en la cuadrícula se lee como un error,
   * una baja de brillo se lee como profundidad.
   */
  const brightness = (col: number, row: number) => {
    const x = col * cell + cell / 2;
    const y = row * cell + cell / 2;
    let nearest = Number.POSITIVE_INFINITY;
    for (const r of clear) {
      const dx = Math.max(r.left - x, 0, x - r.right);
      const dy = Math.max(r.top - y, 0, y - r.bottom);
      nearest = Math.min(nearest, Math.hypot(dx, dy));
      if (nearest === 0) break;
    }
    if (nearest === Number.POSITIVE_INFINITY) return 1;
    return FAINT + (1 - FAINT) * Math.min(1, nearest / (FADE * cell));
  };

  const ink = (row: number) => {
    const t = rows > 1 ? Math.min(1, row / (rows - 1)) : 0;
    const hue = (((HUE_TOP - t * HUE_SPAN) % 360) + 360) % 360;
    const tint = tints[Math.floor(Math.random() * tints.length)];
    return `hsl(${Math.round(hue)} 94% ${tint}%)`;
  };

  // Un solo bucle dibuja todas las celdas; corre solo mientras algo está encendido.
  let frame = 0;
  const draw = (now: number) => {
    frame = 0;
    ctx.clearRect(0, 0, width, height);
    for (const [key, c] of cells) {
      let alpha: number;
      if (now < c.until) {
        alpha = easeOut(Math.min(1, (now - c.born) / FADE_IN));
      } else {
        const t = (now - c.until) / FADE_OUT;
        if (t >= 1) {
          cells.delete(key);
          continue;
        }
        alpha = 1 - easeIn(t);
      }
      ctx.globalAlpha = alpha * c.dim;
      ctx.fillStyle = c.colour;
      // Con margen de una línea, para que la cuadrícula siga viéndose entre celdas encendidas.
      ctx.fillRect(c.col * cell + 1, c.row * cell + 1, cell - 1, cell - 1);
    }
    ctx.globalAlpha = 1;
    if (cells.size > 0) frame = requestAnimationFrame(draw);
  };
  function wake() {
    if (!frame) frame = requestAnimationFrame(draw);
  }

  /** Enciende una celda, salvo que esté fuera de la cuadrícula o ya encendida. */
  const light = (col: number, row: number, hold: number) => {
    if (col < 0 || row < 0 || col >= cols || row >= rows) return;
    if (cells.size >= maxLit) return;
    const key = `${col},${row}`;
    const now = performance.now();
    const lit = cells.get(key);
    if (lit && now < lit.until) return;
    // Una celda que se vuelve a tocar mientras se apaga sigue desde donde iba, sin parpadear.
    let born = now;
    if (lit) {
      const faded = 1 - easeIn(Math.min(1, (now - lit.until) / FADE_OUT));
      born = now - (1 - Math.sqrt(1 - faded)) * FADE_IN;
    }
    cells.set(key, {
      col,
      row,
      colour: lit?.colour ?? ink(row),
      dim: brightness(col, row),
      born,
      until: now + hold,
    });
    wake();
  };

  // El puntero pinta. Las celdas más lejos de él se encienden menos seguido, así el borde del
  // rastro se rompe en vez de moverse como un bloque.
  let pending = 0;
  let at: { x: number; y: number } | null = null;
  const paint = () => {
    pending = 0;
    if (!at) return;
    const cx = Math.floor(at.x / cell);
    const cy = Math.floor(at.y / cell);
    const span = Math.ceil(reach);
    for (let dy = -span; dy <= span; dy++) {
      for (let dx = -span; dx <= span; dx++) {
        const away = Math.hypot(dx, dy);
        if (away > reach) continue;
        if (Math.random() > 1 - away / (reach + 0.6)) continue;
        light(cx + dx, cy + dy, 260 + Math.random() * 900);
      }
    }
  };
  // Se escucha en la ventana, porque la cuadrícula está debajo del contenido y nunca recibe el puntero.
  const onMove = (event: PointerEvent) => {
    const bounds = el.getBoundingClientRect();
    at = { x: event.clientX - bounds.left, y: event.clientY - bounds.top };
    if (!pending) pending = requestAnimationFrame(paint);
  };

  // Algunas celdas se encienden solas, así la cuadrícula está viva al llegar y en pantallas sin
  // puntero. En pausa mientras no se ve.
  let visible = true;
  const drift = () => {
    window.setTimeout(drift, 1400 + Math.random() * 1800);
    if (!visible || document.hidden) return;
    for (let i = 0; i < ambient; i++) {
      light(Math.floor(Math.random() * cols), Math.floor(Math.random() * rows), 900 + Math.random() * 1600);
    }
  };
  window.setTimeout(drift, 500);

  new IntersectionObserver(([entry]) => {
    visible = entry?.isIntersecting ?? true;
  }).observe(el);
  new ResizeObserver(measure).observe(el);
  // Texto agregado, quitado o reescrito mueve las líneas que hay que respetar.
  let recheck = 0;
  new MutationObserver(() => {
    if (!recheck) {
      recheck = requestAnimationFrame(() => {
        recheck = 0;
        measureText();
      });
    }
  }).observe(el.parentElement ?? document.body, { childList: true, subtree: true, characterData: true });
  new MutationObserver(readTheme).observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class", "style", "data-theme"],
  });
  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", readTheme);
  measure();
  // Las líneas de texto se mueven cuando llegan las fuentes web.
  document.fonts?.ready.then(measureText).catch(() => {});
  window.addEventListener("pointermove", onMove, { passive: true });
}

document.querySelectorAll<HTMLElement>("[data-grid-pulse]").forEach(initGridPulse);

export {};
