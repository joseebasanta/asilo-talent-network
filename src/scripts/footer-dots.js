
/* ==========================================================================
   Footer dot-matrix — a decorative band that lives BELOW the footer content.
   A grid of cells clustered at the left/right edges that dissolves toward the
   centre (squares on the left, circles on the right), over a faint dot grid.
   Runs its own gentle twinkle loop; no pointer interaction. Cheap: capped
   fps, paused off-screen (IntersectionObserver), and static under
   prefers-reduced-motion.
   ========================================================================== */
(function () {
  "use strict";
  var canvas = document.querySelector(".footer-dots");
  if (!canvas || !canvas.getContext) return;
  var ctx = canvas.getContext("2d");
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)");

  function getVar(name, dflt){
    try { var v = getComputedStyle(document.documentElement).getPropertyValue(name).trim(); return v || dflt; }
    catch (e) { return dflt; }
  }
  var C500 = getVar("--blue-500", "#cee2ff");   // sky blue
  var C50  = getVar("--blue-50",  "#fafcff");   // near-white highlight

  var CELL = 14, INSET = 3;      // grid pitch (px) and dot inset within a cell
  var dpr = 1, cols = 0, rows = 0, cssW = 0, cssH = 0, cells = [];

  function smooth(t){ return t < 0 ? 0 : t > 1 ? 1 : t * t * (3 - 2 * t); }

  function build(){
    cssW = canvas.clientWidth; cssH = canvas.clientHeight;
    if (!cssW || !cssH) return false;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(cssW * dpr); canvas.height = Math.round(cssH * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    cols = Math.ceil(cssW / CELL); rows = Math.ceil(cssH / CELL);
    cells = [];
    for (var r = 0; r < rows; r++) {
      for (var c = 0; c < cols; c++) {
        var nx = cols > 1 ? c / (cols - 1) : 0;   // 0 left → 1 right
        var ny = rows > 1 ? r / (rows - 1) : 0;   // 0 top  → 1 bottom
        var d = Math.abs(nx - 0.5) * 2;           // 0 centre → 1 edges
        var p = smooth((d - 0.30) / 0.60);        // empty centre, dense edges
        p *= 0.5 + 0.5 * ny;                       // a touch denser toward the bottom
        cells.push({
          x: c * CELL + CELL / 2,
          y: r * CELL + CELL / 2,
          on: Math.random() < p,                   // static membership → jagged dissolve edge
          circle: nx >= 0.5,                       // left squares, right circles
          color: Math.random() < 0.22 ? C50 : C500,
          base: 0.34 + Math.random() * 0.5,        // resting alpha
          amp: 0.14 + Math.random() * 0.22,        // twinkle amplitude
          phase: Math.random() * 6.2831853,
          speed: 0.35 + Math.random() * 0.8,
          size: CELL - INSET * 2 - (Math.random() < 0.3 ? 2 : 0),
        });
      }
    }
    return true;
  }

  function draw(t){
    ctx.clearRect(0, 0, cssW, cssH);
    for (var i = 0; i < cells.length; i++) {
      var m = cells[i];
      if (!m.on) {
        ctx.globalAlpha = 0.05;                    // faint background dot grid
        ctx.fillStyle = C500;
        ctx.beginPath(); ctx.arc(m.x, m.y, 1, 0, 6.2831853); ctx.fill();
        continue;
      }
      var a = m.base + m.amp * Math.sin(t * m.speed + m.phase);
      ctx.globalAlpha = a < 0 ? 0 : a > 1 ? 1 : a;
      ctx.fillStyle = m.color;
      var s = m.size;
      if (m.circle) { ctx.beginPath(); ctx.arc(m.x, m.y, s / 2, 0, 6.2831853); ctx.fill(); }
      else { ctx.fillRect(m.x - s / 2, m.y - s / 2, s, s); }
    }
    ctx.globalAlpha = 1;
  }

  var running = false, raf = 0, startedAt = 0, lastFrame = 0, inView = true, FPS = 20;
  function frame(now){
    if (!running) { raf = 0; return; }
    raf = requestAnimationFrame(frame);
    if (now - lastFrame < 1000 / FPS - 1) return;
    lastFrame = now;
    draw((now - startedAt) / 1000);
  }
  function play(){ if (running || reduced.matches || !inView) return; if (!cells.length && !build()) return; running = true; startedAt = performance.now(); lastFrame = 0; raf = requestAnimationFrame(frame); }
  function stop(){ running = false; if (raf) cancelAnimationFrame(raf); raf = 0; }
  function sync(){ if (reduced.matches) { stop(); if (build()) draw(0); return; } if (document.visibilityState === "visible" && inView) play(); else stop(); }

  if (build()) draw(0);
  document.addEventListener("visibilitychange", sync);
  if (reduced.addEventListener) reduced.addEventListener("change", sync);
  var lw = cssW, lh = cssH;
  new ResizeObserver(function () { var w = canvas.clientWidth, h = canvas.clientHeight; if (w === lw && h === lh) return; lw = w; lh = h; if (build() && !running) draw(0); }).observe(canvas);
  if ("IntersectionObserver" in window) {
    inView = false;
    new IntersectionObserver(function (e) { inView = e[0].isIntersecting; sync(); }, { rootMargin: "120px" }).observe(canvas);
  }
  sync();
})();
