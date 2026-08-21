import { useEffect, useRef } from "react";

/**
 * AsciiBackground
 * ---------------
 * Renders a source image as a grid of breathing ASCII glyphs on a <canvas>,
 * absolutely positioned to sit behind foreground content (z-0).
 *
 * Technique (from the mushenzhen ascii-portrait): sample the source into a
 * coarse luminance grid, draw one glyph per cell chosen by brightness, and add
 * a small time-varying wobble so the picture shimmers without moving. The
 * expensive resample is done once per size; each frame only re-picks glyphs.
 *
 * Source:
 *   - Pass `src` (an image URL) to render a real photo — e.g. El Ávila. The
 *     luminance mapping self-adjusts to photographs.
 *   - Omit `src` to render the built-in procedural Caracas + El Ávila skyline
 *     (no asset needed), which is what ships by default.
 *
 * The loop runs only while the tab is foregrounded and the canvas has size,
 * and not at all under prefers-reduced-motion (one static render instead).
 */
export default function AsciiBackground({
  src,
  ink = "#6f7075",
  background = "#0a0a0b",
  cell = 11,
  className = "",
}) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !canvas.getContext) return;

    const CONFIG = {
      cell,
      ramp: " .·-+=*#", // darkest→brightest; leading blank stays black
      color: ink,
      background,
      gamma: 0.85,
      minScale: 1.0,
      maxScale: 1.5,
      fps: 24,
      wave: 0.05,
      twinkle: 0.05,
      revealMs: 1400,
      revealAmp: 0.55,
    };

    const ctx = canvas.getContext("2d");
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");

    // ---- Source (photo or procedural skyline), resolved to ImageData ----
    let SRC = null; // { data, w, h }
    let disposed = false;

    function mulberry32(a) {
      return function () {
        a |= 0;
        a = (a + 0x6d2b79f5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      };
    }

    // A grayscale El Ávila + Caracas scene. Brighter = more ink; sky/ground
    // stay black so they read as empty and the skyline reads as a silhouette.
    function buildScene(W, H) {
      const cv = document.createElement("canvas");
      cv.width = W;
      cv.height = H;
      const g = cv.getContext("2d");
      g.fillStyle = "#000";
      g.fillRect(0, 0, W, H);

      const rnd = mulberry32(20261120);
      const horizon = H * 0.82;
      const cl = (l) => ((l = l | 0), l < 0 ? 0 : l > 255 ? 255 : l);
      const put = (x, y, l) => {
        if (x < 0 || y < 0 || x >= W || y >= H) return;
        g.fillStyle = `rgb(${cl(l)},${cl(l)},${cl(l)})`;
        g.fillRect(x, y, 1, 1);
      };
      const box = (x, y, w, h, l) => {
        g.fillStyle = `rgb(${cl(l)},${cl(l)},${cl(l)})`;
        g.fillRect(x | 0, y | 0, w, h);
      };

      const ridgeY = (x) => {
        const t = x / W;
        const a = Math.sin(t * Math.PI * 1.15 + 0.5);
        const b = Math.sin(t * Math.PI * 3.1 + 1.2) * 0.3;
        const c = Math.sin(t * Math.PI * 7.0) * 0.05;
        return H * 0.4 - (a * 0.13 + b * 0.13 + c) * H;
      };

      // El Ávila: faint mass, dark base, with a crisp ridgeline edge
      for (let x = 0; x < W; x++) {
        const ry = ridgeY(x);
        for (let y = Math.floor(ry); y < horizon; y++) {
          const depth = (y - ry) / (horizon - ry);
          let l = 44 - depth * 32 + (rnd() * 2 - 1) * 7;
          if (((x * 5) & 31) < 1) l += 14; // faint "quebrada" streaks
          put(x, y, l);
        }
      }
      for (let x = 0; x < W; x++) {
        const rr = Math.floor(ridgeY(x));
        put(x, rr, 112);
        put(x, rr + 1, 72);
      }

      // Caracas skyline: overlapping buildings on the horizon
      let bx = -10;
      while (bx < W + 10) {
        const bw = 8 + Math.floor(rnd() * 30);
        const bh = 30 + Math.floor(rnd() * rnd() * 160);
        const top = horizon - bh;
        box(bx, top, bw, bh, 90 + rnd() * 45);
        for (let wy = top + 4; wy < horizon - 3; wy += 5) {
          for (let wx = bx + 3; wx < bx + bw - 2; wx += 4) {
            if (rnd() < 0.5) box(wx, wy, 2, 2, 205 + rnd() * 50);
          }
        }
        box(bx, top, bw, 1, 220); // roofline
        bx += bw + (rnd() < 0.35 ? Math.floor(rnd() * 6) : 0);
      }
      // landmark towers
      for (let t = 0; t < 5; t++) {
        const tx = 60 + Math.floor(rnd() * (W - 120));
        const tw = 6 + Math.floor(rnd() * 8);
        const th = 160 + Math.floor(rnd() * 150);
        box(tx, horizon - th, tw, th, 110);
        for (let yy = horizon - th + 6; yy < horizon - 4; yy += 6)
          box(tx + tw / 2 - 1, yy, 2, 2, 245);
        box(tx + tw / 2 - 1, horizon - th - 6, 2, 6, 210); // antenna
      }

      box(0, horizon, W, H - horizon, 0); // ground: black

      for (let s = 0; s < 70; s++) {
        const sx = Math.floor(rnd() * W);
        const sy = Math.floor(rnd() * ridgeY(sx) * 0.9);
        put(sx, sy, 70 + rnd() * 80);
      }

      return { data: g.getImageData(0, 0, W, H).data, w: W, h: H };
    }

    // ---- Glyph grid state ----
    let grid = null;
    let cssW = 0,
      cssH = 0,
      cols = 0,
      rows = 0;
    const STEPS = 8;
    let fonts = null,
      bufX = null,
      bufY = null,
      bufC = null,
      bufN = null,
      chars = null;

    function buildGrid(w, h) {
      const off = document.createElement("canvas");
      off.width = w;
      off.height = h;
      const g = off.getContext("2d", { willReadFrequently: true });
      const tmp = document.createElement("canvas");
      tmp.width = SRC.w;
      tmp.height = SRC.h;
      tmp
        .getContext("2d")
        .putImageData(
          new ImageData(new Uint8ClampedArray(SRC.data), SRC.w, SRC.h),
          0,
          0
        );
      g.imageSmoothingEnabled = true;
      g.imageSmoothingQuality = "high";
      const scale = Math.max(w / SRC.w, h / SRC.h);
      const dw = SRC.w * scale,
        dh = SRC.h * scale;
      g.drawImage(tmp, (w - dw) / 2, (h - dh) / 2, dw, dh);

      const data = g.getImageData(0, 0, w, h).data;
      const lum = new Float32Array(w * h);
      for (let i = 0; i < lum.length; i++) {
        const o = i * 4;
        lum[i] =
          (data[o] * 0.299 + data[o + 1] * 0.587 + data[o + 2] * 0.114) / 255;
      }
      // Normalise + gentle contrast/gamma. Keeps the authored silhouette's
      // black areas black instead of equalising them up into mid-ink.
      let maxL = 0;
      for (let m = 0; m < lum.length; m++) if (lum[m] > maxL) maxL = lum[m];
      const inv = maxL > 0 ? 1 / maxL : 1;
      for (let k = 0; k < lum.length; k++) {
        let v = lum[k] * inv;
        v = (v - 0.04) / 0.96;
        if (v < 0) v = 0;
        if (v > 1) v = 1;
        lum[k] = Math.pow(v, CONFIG.gamma);
      }
      const phase = new Float32Array(w * h);
      for (let p = 0; p < phase.length; p++) phase[p] = Math.random() * 6.2831853;
      grid = { w, h, lum, phase };
    }

    function layout() {
      const w = canvas.clientWidth,
        h = canvas.clientHeight;
      if (!w || !h || !SRC) return false;
      if (w === cssW && h === cssH && grid) return true;
      cssW = w;
      cssH = h;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cols = Math.ceil(w / CONFIG.cell);
      rows = Math.ceil(h / CONFIG.cell);
      buildGrid(cols, rows);
      const n = cols * rows;
      fonts = new Array(STEPS);
      bufX = new Array(STEPS);
      bufY = new Array(STEPS);
      bufC = new Array(STEPS);
      bufN = new Int32Array(STEPS);
      for (let s = 0; s < STEPS; s++) {
        const mid = (s + 0.5) / STEPS;
        const size =
          CONFIG.cell *
          (CONFIG.minScale + mid * (CONFIG.maxScale - CONFIG.minScale));
        fonts[s] = size.toFixed(2) + 'px "JetBrains Mono", ui-monospace, monospace';
        bufX[s] = new Float32Array(n);
        bufY[s] = new Float32Array(n);
        bufC[s] = new Uint8Array(n);
      }
      chars = CONFIG.ramp.split("");
      return true;
    }

    function paint(t, extra) {
      ctx.fillStyle = CONFIG.background;
      ctx.fillRect(0, 0, cssW, cssH);
      ctx.fillStyle = CONFIG.color;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      const cellSz = CONFIG.cell,
        half = cellSz / 2,
        lum = grid.lum,
        phase = grid.phase,
        gw = grid.w;
      const last = CONFIG.ramp.length - 1,
        nRamp = CONFIG.ramp.length,
        waveAmp = CONFIG.wave,
        twAmp = CONFIG.twinkle + extra;
      for (let s = 0; s < STEPS; s++) bufN[s] = 0;
      for (let r = 0; r < rows; r++) {
        const y = r * cellSz + half,
          wa = r * 0.09 - t * 1.6,
          wb = -r * 0.13 + t * 1.1,
          base = r * gw;
        for (let c = 0; c < cols; c++) {
          const i = base + c;
          let v =
            lum[i] +
            waveAmp *
              (Math.sin(c * 0.16 + wa) * 0.6 + Math.sin(c * 0.07 + wb) * 0.4) +
            twAmp * Math.sin(t * 2.6 + phase[i]);
          if (v <= 0) continue;
          if (v > 0.999) v = 0.999;
          let idx = (v * nRamp) | 0;
          if (idx > last) idx = last;
          if (idx === 0) continue;
          let step = (v * STEPS) | 0;
          if (step > STEPS - 1) step = STEPS - 1;
          const m = bufN[step]++;
          bufX[step][m] = c * cellSz + half;
          bufY[step][m] = y;
          bufC[step][m] = idx;
        }
      }
      for (let k = 0; k < STEPS; k++) {
        const count = bufN[k];
        if (!count) continue;
        ctx.font = fonts[k];
        const xs = bufX[k],
          ys = bufY[k],
          cs = bufC[k];
        for (let m = 0; m < count; m++) ctx.fillText(chars[cs[m]], xs[m], ys[m]);
      }
    }

    let running = false,
      rafId = 0,
      startedAt = 0,
      lastFrame = 0;
    function frame(now) {
      if (!running) {
        rafId = 0;
        return;
      }
      rafId = requestAnimationFrame(frame);
      if (now - lastFrame < 1000 / CONFIG.fps - 1) return;
      lastFrame = now;
      const elapsed = now - startedAt;
      const p = Math.min(1, elapsed / CONFIG.revealMs);
      const extra = p >= 1 ? 0 : CONFIG.revealAmp * Math.pow(1 - p, 2.2);
      paint(elapsed / 1000, extra);
    }
    function start() {
      if (running || !layout()) return;
      running = true;
      startedAt = performance.now();
      lastFrame = 0;
      rafId = requestAnimationFrame(frame);
    }
    function stop() {
      running = false;
      if (rafId) cancelAnimationFrame(rafId);
      rafId = 0;
    }
    function sync() {
      if (disposed) return;
      if (reduced.matches) {
        stop();
        if (layout()) paint(0, 0);
        return;
      }
      if (document.visibilityState === "visible" && canvas.clientWidth > 0) start();
      else stop();
    }

    // ---- Boot: build the source, then wire observers ----
    function boot() {
      if (disposed) return;
      // Source resolution ~ hero aspect; buildGrid resamples to the glyph grid.
      SRC = SRC || buildSceneOrImage();
      if (layout()) paint(0, 0);
      document.addEventListener("visibilitychange", sync);
      if (reduced.addEventListener) reduced.addEventListener("change", sync);
      let lastW = 0,
        lastH = 0;
      ro = new ResizeObserver(() => {
        const w = canvas.clientWidth,
          h = canvas.clientHeight;
        if (w === lastW && h === lastH) return;
        lastW = w;
        lastH = h;
        if (!layout()) return;
        if (running) return;
        sync();
        if (!running) paint(0, 0);
      });
      ro.observe(canvas);
      sync();
    }

    let ro = null;
    let img = null;
    function buildSceneOrImage() {
      return buildScene(900, 460);
    }

    if (src) {
      // Render a real photo: draw it to an offscreen canvas → ImageData.
      img = new Image();
      img.crossOrigin = "anonymous";
      img.decoding = "async";
      img.onload = () => {
        const W = img.naturalWidth,
          H = img.naturalHeight;
        const cv = document.createElement("canvas");
        cv.width = W;
        cv.height = H;
        const g = cv.getContext("2d");
        g.drawImage(img, 0, 0);
        SRC = { data: g.getImageData(0, 0, W, H).data, w: W, h: H };
        boot();
      };
      img.onerror = () => {
        SRC = buildScene(900, 460); // fall back to the procedural skyline
        boot();
      };
      img.src = src;
    } else {
      boot();
    }

    return () => {
      disposed = true;
      stop();
      document.removeEventListener("visibilitychange", sync);
      if (reduced.removeEventListener) reduced.removeEventListener("change", sync);
      if (ro) ro.disconnect();
      if (img) {
        img.onload = null;
        img.onerror = null;
      }
    };
  }, [src, ink, background, cell]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={`absolute inset-0 h-full w-full ${className}`}
      style={{ zIndex: 0 }}
    />
  );
}
