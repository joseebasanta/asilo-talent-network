import { useEffect } from "react";

/**
 * CursorTrail
 * -----------
 * A wake of flickering ASCII glyphs + pixel blocks that follows the pointer
 * while it moves over a bounds element (the hero). Spawn rate is distance-based
 * — slow moves give a sparse dotted path, fast flicks throw a dense glitchy
 * spray. Particles re-roll their glyph as they age and die within ~0.8s; the
 * loop sleeps entirely when the trail is empty (idle cost is zero).
 *
 * Renders in Electric Lime on a fixed full-viewport canvas above the page; the
 * native cursor stays visible. Disabled on touch/coarse pointers and under
 * prefers-reduced-motion.
 *
 * Pass `boundsRef` (a ref to the hero element) to scope the trail to it; omit
 * to trail across the whole viewport.
 */
export default function CursorTrail({ boundsRef, ink = "#CEE2FF" }) {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(hover: none), (pointer: coarse)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const INK = ink;
    const GLYPHS = "!<>-_/\\[]{}=+*^?#%&$:;.";
    const BLOCKS = "█▓▒░";
    const MAX_PARTICLES = 140;

    const canvas = document.createElement("canvas");
    canvas.setAttribute("aria-hidden", "true");
    canvas.style.cssText =
      "position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:9999;";
    document.body.appendChild(canvas);
    const ctx = canvas.getContext("2d");

    let dpr = Math.min(window.devicePixelRatio || 1, 2);
    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(window.innerWidth * dpr);
      canvas.height = Math.round(window.innerHeight * dpr);
    }
    resize();
    window.addEventListener("resize", resize);

    let particles = [];
    let last = null;
    let carry = 0;
    let running = false;
    let prevT = 0;
    let rafId = 0;

    function inBounds(x, y) {
      const el = boundsRef && boundsRef.current;
      if (!el) return true;
      const r = el.getBoundingClientRect();
      return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
    }
    function randChar() {
      if (Math.random() < 0.22) return BLOCKS[(Math.random() * BLOCKS.length) | 0];
      return GLYPHS[(Math.random() * GLYPHS.length) | 0];
    }
    function spawn(x, y, speed) {
      if (particles.length >= MAX_PARTICLES) particles.shift();
      const big = speed > 2.2 && Math.random() < 0.25;
      particles.push({
        x: x + (Math.random() - 0.5) * 10,
        y: y + (Math.random() - 0.5) * 10,
        vx: (Math.random() - 0.5) * 14,
        vy: (Math.random() - 0.5) * 14 - 6,
        ch: randChar(),
        born: prevT,
        life: 500 + Math.random() * 350,
        size: big ? 22 : 12 + Math.random() * 6,
        square: Math.random() < 0.12,
      });
    }

    function onMove(e) {
      if (e.pointerType && e.pointerType !== "mouse") return;
      const x = e.clientX, y = e.clientY;
      if (!inBounds(x, y)) { last = null; return; }
      if (!last) { last = { x, y }; return; }
      const dx = x - last.x, dy = y - last.y;
      const dist = Math.hypot(dx, dy);
      const step = 14;
      const n = Math.floor((dist + carry) / step);
      carry = (dist + carry) - n * step;
      for (let i = 1; i <= n; i++) {
        const t = (i * step - carry) / dist;
        spawn(last.x + dx * t, last.y + dy * t, dist / 16);
      }
      last = { x, y };
      if (!running && particles.length) {
        running = true;
        prevT = performance.now();
        rafId = requestAnimationFrame(tick);
      }
    }
    window.addEventListener("pointermove", onMove, { passive: true });

    function tick(now) {
      const dt = Math.min(50, now - prevT);
      prevT = now;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      ctx.textBaseline = "middle";
      ctx.textAlign = "center";
      let alive = 0;
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        const age = now - p.born;
        if (age >= p.life) continue;
        alive++;
        const k = age / p.life;
        p.x += (p.vx * dt) / 1000;
        p.y += (p.vy * dt) / 1000;
        if (Math.random() < 0.06 + k * 0.3) p.ch = randChar();
        ctx.globalAlpha = k < 0.7 ? 1 : 1 - (k - 0.7) / 0.3;
        ctx.fillStyle = INK;
        if (p.square || (k > 0.55 && Math.random() < 0.3)) {
          const s = Math.max(3, p.size * 0.55 * (1 - k * 0.4));
          ctx.fillRect(p.x - s / 2, p.y - s / 2, s, s);
        } else {
          ctx.font = p.size + "px ui-monospace, monospace";
          ctx.fillText(p.ch, p.x, p.y);
        }
      }
      ctx.globalAlpha = 1;
      if (alive * 2 < particles.length)
        particles = particles.filter((p) => now - p.born < p.life);
      if (alive) {
        rafId = requestAnimationFrame(tick);
      } else {
        particles.length = 0;
        running = false;
        ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      }
    }

    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("resize", resize);
      if (rafId) cancelAnimationFrame(rafId);
      canvas.remove();
    };
  }, [boundsRef, ink]);

  return null;
}
