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
  accent = "#0066FF",
  cell = 9,
  className = "",
}) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !canvas.getContext) return;

    const CONFIG = {
      cell,
      ramp: " .·:-=+*#%@", // darkest→brightest; leading blank stays black
      color: ink,
      blue: accent, // a few of the brightest glyphs glow this color
      blueFrac: 0.06,
      background,
      gamma: 0.82,
      minScale: 1.0,
      maxScale: 1.5,
      fps: 24,
      wave: 0.045,
      twinkle: 0.045,
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

    // A grayscale El Ávila + Caracas scene, layered front-to-back and filling
    // the full height. Brighter = more ink; sky stays black so it reads empty.
    function buildScene(W, H) {
      const cv = document.createElement("canvas");
      cv.width = W;
      cv.height = H;
      const g = cv.getContext("2d");
      g.fillStyle = "#000";
      g.fillRect(0, 0, W, H);

      const rnd = mulberry32(20261120);
      const cl = (l) => ((l = l | 0), l < 0 ? 0 : l > 255 ? 255 : l);
      const put = (x, y, l) => {
        if (x < 0 || y < 0 || x >= W || y >= H) return;
        g.fillStyle = `rgb(${cl(l)},${cl(l)},${cl(l)})`;
        g.fillRect(x | 0, y | 0, 1, 1);
      };
      const box = (x, y, w, h, l) => {
        g.fillStyle = `rgb(${cl(l)},${cl(l)},${cl(l)})`;
        g.fillRect(x | 0, y | 0, Math.max(1, w | 0), Math.max(1, h | 0));
      };
      const line = (x0, y0, x1, y1, l) => {
        const dx = x1 - x0, dy = y1 - y0;
        const n = Math.max(1, Math.max(Math.abs(dx), Math.abs(dy)));
        for (let k = 0; k <= n; k++) put(x0 + (dx * k) / n, y0 + (dy * k) / n, l);
      };
      const blob = (cx, cy, r, l) => {
        for (let yy = -r; yy <= r; yy++)
          for (let xx = -r; xx <= r; xx++)
            if (xx * xx + yy * yy <= r * r && rnd() < 0.72)
              put(cx + xx, cy + yy, l * (0.55 + rnd() * 0.45));
      };

      const street = H * 0.7; // where buildings meet the ground

      // A building with bright edges (outline) and floors of windows.
      const building = (bx, bw, top, body, winL, floor, gap) => {
        box(bx, top, bw, street - top, body);
        box(bx, top, 1, street - top, body + 45);
        box(bx + bw - 1, top, 1, street - top, body + 45);
        box(bx, top, bw, 1, body + 75);
        for (let wy = top + 3; wy < street - 2; wy += floor)
          for (let wx = bx + 2; wx < bx + bw - 2; wx += gap)
            if (rnd() < 0.72)
              box(wx, wy, Math.max(1, gap - 2), Math.max(1, floor - 2), winL - (rnd() < 0.3 ? 55 : 0));
      };

      const ridgeY = (x) => {
        const t = x / W;
        const a = Math.sin(t * Math.PI * 1.1 + 0.6);
        const b = Math.sin(t * Math.PI * 3.0 + 1.2) * 0.28;
        const c = Math.sin(t * Math.PI * 6.5) * 0.06;
        return H * 0.3 - (a * 0.13 + b * 0.12 + c) * H;
      };

      // El Ávila: faint mass behind the city, with a crisp ridgeline
      for (let x = 0; x < W; x++) {
        const ry = ridgeY(x);
        for (let y = Math.floor(ry); y < street; y++) {
          const d = (y - ry) / (street - ry);
          put(x, y, 34 - d * 28 + (rnd() * 2 - 1) * 5);
        }
      }
      for (let x = 0; x < W; x++) {
        const rr = Math.floor(ridgeY(x));
        put(x, rr, 92);
        put(x, rr + 1, 58);
      }

      // Background skyline: many thin, faint towers
      let bx = -6;
      while (bx < W + 6) {
        const bw = 6 + Math.floor(rnd() * 16);
        const bh = 40 + Math.floor(rnd() * rnd() * (H * 0.42));
        building(bx, bw, Math.max(H * 0.14, street - bh), 44 + rnd() * 22, 120 + rnd() * 40, 4, 3);
        bx += bw + Math.floor(rnd() * 3);
      }
      // Midground skyline: taller, brighter, more detailed
      bx = -8;
      while (bx < W + 8) {
        const bw2 = 14 + Math.floor(rnd() * 30);
        const bh2 = 70 + Math.floor(rnd() * rnd() * (H * 0.6));
        const top2 = Math.max(H * 0.08, street - bh2);
        building(bx, bw2, top2, 78 + rnd() * 28, 190 + rnd() * 45, 6, 5);
        if (rnd() < 0.4) box(bx + bw2 / 2 - 1, top2 - 8 - Math.floor(rnd() * 10), 2, 12, 150);
        bx += bw2 + Math.floor(rnd() * 10);
      }
      // Signature towers
      for (let t = 0; t < 6; t++) {
        const tx = 40 + Math.floor(rnd() * (W - 80));
        const tw = 8 + Math.floor(rnd() * 10);
        const th = H * 0.42 + Math.floor(rnd() * H * 0.32);
        building(tx, tw, Math.max(H * 0.05, street - th), 95, 235, 6, 4);
        box(tx + tw / 2 - 1, street - th - 14, 2, 14, 210);
      }
      // Billboards / signage
      for (let s = 0; s < 10; s++) {
        const sx = 20 + Math.floor(rnd() * (W - 140)),
          sy = H * 0.18 + rnd() * H * 0.35,
          sw = 26 + rnd() * 48,
          sh = 12 + rnd() * 20;
        box(sx, sy, 1, sh, 200);
        box(sx + sw - 1, sy, 1, sh, 200);
        box(sx, sy, sw, 1, 200);
        box(sx, sy + sh - 1, sw, 1, 200);
        for (let yy = sy + 3; yy < sy + sh - 2; yy += 3)
          for (let xx = sx + 3; xx < sx + sw - 2; xx += 2) if (rnd() < 0.5) put(xx, yy, 150);
      }

      // Elevated rail / boulevard across the scene
      const railY = street - 7;
      box(0, railY, W, 3, 120);
      for (let rx = 0; rx < W; rx += 6) put(rx, railY + 1, 205);
      for (let sp = 20; sp < W; sp += 94) box(sp, railY + 3, 3, street - (railY + 3), 88);

      // ===== Foreground — fills to the bottom edge =====
      box(0, street, W, H - street, 15);
      const vpx = W * 0.5,
        vpy = street + 3;
      for (let i = -6; i <= 6; i++) line(vpx, vpy, vpx + i * W * 0.095, H, 58 + (i % 2 ? 0 : 22));
      for (let ly = street + 18; ly < H; ly += Math.max(7, (ly - street) * 0.13))
        box(vpx - 1, ly, 2, Math.max(2, (ly - street) * 0.05), 175);
      for (let cw = 0; cw < W; cw += 28) {
        box(cw, H * 0.88, 13, 6, 195);
        box(cw + 6, H * 0.985, 15, 7, 150);
      }
      for (let gy = street + 6; gy < H; gy += 3)
        for (let gx = 0; gx < W; gx += 4)
          if (rnd() < (gy > H * 0.85 ? 0.32 : 0.14)) put(gx, gy, 28 + rnd() * 34);
      for (let pty = H - Math.floor(H * 0.15); pty < H; pty += 7) box(0, pty, W, 1, 36);

      for (let tr = 0; tr < 30; tr++) {
        const trx = rnd() * W,
          try_ = street + 10 + rnd() * (H - street - 18),
          rad = 5 + rnd() * 11;
        blob(trx, try_, rad, 66 + rnd() * 30);
        box(trx - 1, try_ + rad, 2, rad * 0.6, 58);
      }
      for (let sl = 0; sl < 16; sl++) {
        const slx = rnd() * W,
          sly = street + 12 + rnd() * (H - street - 44),
          slh = 18 + rnd() * 16;
        box(slx, sly - slh, 2, slh, 118);
        put(slx + 2, sly - slh, 220);
        put(slx + 3, sly - slh, 175);
      }
      for (let ca = 0; ca < 9; ca++) {
        const cx = rnd() * W,
          cyy = street + 30 + rnd() * (H - street - 42),
          cwd = 14 + rnd() * 10;
        box(cx, cyy, cwd, 6, 88);
        box(cx + 2, cyy - 3, cwd - 6, 3, 66);
        put(cx + cwd - 1, cyy + 2, 230);
        put(cx, cyy + 2, 200);
        put(cx + 2, cyy + 6, 140);
        put(cx + cwd - 3, cyy + 6, 140);
      }

      for (let st = 0; st < 130; st++) {
        const stx = rnd() * W,
          sty = rnd() * ridgeY(stx) * 0.85;
        put(stx, sty, 50 + rnd() * 90);
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
    const equalize = !!src; // photos self-adjust; the procedural scene doesn't
    let fonts = null,
      bufX = null,
      bufY = null,
      bufC = null,
      bufN = null,
      bufBX = null,
      bufBY = null,
      bufBC = null,
      bufBN = null,
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
      if (equalize) {
        // Histogram equalisation — for real photographs (self-adjusts).
        const BINS = 256;
        const hist = new Uint32Array(BINS);
        for (let hb = 0; hb < lum.length; hb++)
          hist[Math.min(255, (lum[hb] * 255) | 0)]++;
        const cdf = new Float32Array(BINS);
        let run = 0;
        for (let b = 0; b < BINS; b++) {
          run += hist[b];
          cdf[b] = run / lum.length;
        }
        for (let k = 0; k < lum.length; k++)
          lum[k] = Math.pow(cdf[Math.min(255, (lum[k] * 255) | 0)], CONFIG.gamma);
      } else {
        // Authored silhouette — keep black areas black (normalise + contrast).
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
      }
      const phase = new Float32Array(w * h);
      for (let p = 0; p < phase.length; p++) phase[p] = Math.random() * 6.2831853;
      const blue = new Uint8Array(w * h);
      for (let q = 0; q < blue.length; q++) blue[q] = Math.random() < CONFIG.blueFrac ? 1 : 0;
      grid = { w, h, lum, phase, blue };
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
      bufBX = new Array(STEPS);
      bufBY = new Array(STEPS);
      bufBC = new Array(STEPS);
      bufBN = new Int32Array(STEPS);
      for (let s = 0; s < STEPS; s++) {
        const mid = (s + 0.5) / STEPS;
        const size =
          CONFIG.cell *
          (CONFIG.minScale + mid * (CONFIG.maxScale - CONFIG.minScale));
        fonts[s] = size.toFixed(2) + 'px ui-monospace, "SFMono-Regular", Menlo, monospace';
        bufX[s] = new Float32Array(n);
        bufY[s] = new Float32Array(n);
        bufC[s] = new Uint8Array(n);
        bufBX[s] = new Float32Array(n);
        bufBY[s] = new Float32Array(n);
        bufBC[s] = new Uint8Array(n);
      }
      chars = CONFIG.ramp.split("");
      return true;
    }

    function paint(t, extra) {
      ctx.fillStyle = CONFIG.background;
      ctx.fillRect(0, 0, cssW, cssH);
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      const cellSz = CONFIG.cell,
        half = cellSz / 2,
        lum = grid.lum,
        phase = grid.phase,
        blue = grid.blue,
        gw = grid.w;
      const last = CONFIG.ramp.length - 1,
        nRamp = CONFIG.ramp.length,
        waveAmp = CONFIG.wave,
        twAmp = CONFIG.twinkle + extra;
      const blueMin = last - 2; // only the brightest few glyphs may go blue
      for (let s = 0; s < STEPS; s++) {
        bufN[s] = 0;
        bufBN[s] = 0;
      }
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
          const x = c * cellSz + half;
          if (blue[i] && idx >= blueMin) {
            const mb = bufBN[step]++;
            bufBX[step][mb] = x;
            bufBY[step][mb] = y;
            bufBC[step][mb] = idx;
          } else {
            const m = bufN[step]++;
            bufX[step][m] = x;
            bufY[step][m] = y;
            bufC[step][m] = idx;
          }
        }
      }
      for (let k = 0; k < STEPS; k++) {
        const count = bufN[k],
          cb = bufBN[k];
        if (!count && !cb) continue;
        ctx.font = fonts[k];
        if (count) {
          ctx.fillStyle = CONFIG.color;
          const xs = bufX[k], ys = bufY[k], cs = bufC[k];
          for (let m = 0; m < count; m++) ctx.fillText(chars[cs[m]], xs[m], ys[m]);
        }
        if (cb) {
          ctx.fillStyle = CONFIG.blue;
          const xb = bufBX[k], yb = bufBY[k], cbs = bufBC[k];
          for (let nb = 0; nb < cb; nb++) ctx.fillText(chars[cbs[nb]], xb[nb], yb[nb]);
        }
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
      return buildScene(1500, 760);
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
        SRC = buildScene(1500, 760); // fall back to the procedural skyline
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
  }, [src, ink, background, accent, cell]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={`absolute inset-0 h-full w-full ${className}`}
      style={{ zIndex: 0 }}
    />
  );
}
