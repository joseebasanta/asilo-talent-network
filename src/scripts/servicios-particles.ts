// Fondo de partículas del hero (adaptado de "hero-minimalism"): rayitas de luz que suben despacio y se
// desvanecen. Se dibuja en un <canvas> del tamaño del hero; solo anima mientras el hero está a la vista
// y nunca con prefers-reduced-motion (ahí el canvas queda vacío y solo se ven las líneas).

export interface Particle {
  x: number;
  y: number;
  speed: number;
  opacity: number;
  // Milisegundos que la partícula queda visible antes de empezar a desvanecerse.
  life: number;
}

// Densidad del original: una partícula cada 7.000 px².
export const particleCount = (width: number, height: number) => Math.floor((width * height) / 7000);

export function spawn(particle: Partial<Particle>, width: number, height: number, rand = Math.random): Particle {
  return Object.assign(particle, {
    x: rand() * width,
    y: rand() * height,
    speed: rand() / 5 + 0.1,
    opacity: 0.7,
    life: rand() * 600 + 100,
  });
}

// Avanza una partícula `dt` milisegundos. El original movía y apagaba por cuadro (60 fps); aquí se
// escala por el tiempo real para que en pantallas de 120 Hz no vaya al doble de rápido.
export function step(p: Particle, dt: number, width: number, height: number, rand = Math.random): void {
  const frames = dt / (1000 / 60);
  p.y -= p.speed * frames;
  // Lo que sobra de la vida en este cuadro ya cuenta como desvanecimiento.
  p.life -= dt;
  if (p.life < 0) {
    p.opacity -= (0.008 * -p.life) / (1000 / 60);
    p.life = 0;
  }
  if (p.y < 0 || p.opacity <= 0) spawn(p, width, height, rand);
}

export function initParticles(canvas: HTMLCanvasElement): void {
  const host = canvas.parentElement;
  const ctx = canvas.getContext("2d");
  if (!host || !ctx) return;

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let particles: Particle[] = [];
  let width = 0;
  let height = 0;
  let raf = 0;
  let last = 0;
  let inView = false;

  const resize = () => {
    const rect = host.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = rect.width;
    height = rect.height;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    particles = Array.from({ length: particleCount(width, height) }, () => spawn({}, width, height));
  };

  const draw = (now: number) => {
    const dt = last ? Math.min(now - last, 100) : 1000 / 60;
    last = now;
    ctx.clearRect(0, 0, width, height);
    for (const p of particles) {
      step(p, dt, width, height);
      ctx.fillStyle = `rgba(250, 250, 250, ${p.opacity})`;
      ctx.fillRect(p.x, p.y, 0.6, Math.random() * 2 + 1);
    }
    raf = requestAnimationFrame(draw);
  };

  const sync = () => {
    cancelAnimationFrame(raf);
    raf = 0;
    last = 0;
    if (inView && !reduceMotion.matches) raf = requestAnimationFrame(draw);
    else if (reduceMotion.matches) ctx.clearRect(0, 0, width, height);
  };

  new ResizeObserver(() => {
    resize();
    sync();
  }).observe(host);
  new IntersectionObserver(([entry]) => {
    inView = entry.isIntersecting;
    sync();
  }).observe(host);
  reduceMotion.addEventListener("change", sync);
}
