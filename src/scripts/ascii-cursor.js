
/* ==========================================================================
   ASCII cursor trail — a wake of flickering glyphs that follows the pointer
   across the whole page. Spawn rate is distance-based (slow = sparse,
   fast flicks = dense spray); particles re-roll their glyph as they age and
   die within ~0.8s. Idle cost is zero (the loop sleeps when empty).
   Disabled on touch/coarse pointers and under prefers-reduced-motion.
   ========================================================================== */
(function () {
  if (window.matchMedia("(hover: none), (pointer: coarse)").matches) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  var INK = "#CEE2FF"; // pale blue (matches the hero accent)
  var GLYPHS = "!<>-_/\\[]{}=+*^?#%&$:;.";
  var BLOCKS = "█▓▒░";
  var MAX_PARTICLES = 140;

  var canvas = document.createElement("canvas");
  canvas.setAttribute("aria-hidden", "true");
  canvas.style.cssText = "position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:9999;";
  document.body.appendChild(canvas);
  var ctx = canvas.getContext("2d");

  var dpr = Math.min(window.devicePixelRatio || 1, 2);
  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(window.innerWidth * dpr);
    canvas.height = Math.round(window.innerHeight * dpr);
  }
  resize();
  window.addEventListener("resize", resize);

  var particles = [], last = null, carry = 0, running = false, prevT = 0;

  function randChar() {
    if (Math.random() < 0.22) return BLOCKS[(Math.random() * BLOCKS.length) | 0];
    return GLYPHS[(Math.random() * GLYPHS.length) | 0];
  }
  function spawn(x, y, speed) {
    if (particles.length >= MAX_PARTICLES) particles.shift();
    var big = speed > 2.2 && Math.random() < 0.25;
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

  window.addEventListener("pointermove", function (e) {
    if (e.pointerType && e.pointerType !== "mouse") return;
    var x = e.clientX, y = e.clientY;
    if (!last) { last = { x: x, y: y }; return; }
    var dx = x - last.x, dy = y - last.y;
    var dist = Math.hypot(dx, dy);
    var step = 14;
    var n = Math.floor((dist + carry) / step);
    carry = (dist + carry) - n * step;
    for (var i = 1; i <= n; i++) {
      var t = (i * step - carry) / dist;
      spawn(last.x + dx * t, last.y + dy * t, dist / 16);
    }
    last = { x: x, y: y };
    if (!running && particles.length) { running = true; prevT = performance.now(); requestAnimationFrame(tick); }
  }, { passive: true });

  function tick(now) {
    var dt = Math.min(50, now - prevT);
    prevT = now;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    ctx.textBaseline = "middle";
    ctx.textAlign = "center";
    var alive = 0;
    for (var i = 0; i < particles.length; i++) {
      var p = particles[i];
      var age = now - p.born;
      if (age >= p.life) continue;
      alive++;
      var k = age / p.life;
      p.x += p.vx * dt / 1000;
      p.y += p.vy * dt / 1000;
      if (Math.random() < 0.06 + k * 0.3) p.ch = randChar();
      ctx.globalAlpha = k < 0.7 ? 1 : 1 - (k - 0.7) / 0.3;
      ctx.fillStyle = INK;
      if (p.square || (k > 0.55 && Math.random() < 0.3)) {
        var s = Math.max(3, p.size * 0.55 * (1 - k * 0.4));
        ctx.fillRect(p.x - s / 2, p.y - s / 2, s, s);
      } else {
        ctx.font = p.size + "px ui-monospace, monospace";
        ctx.fillText(p.ch, p.x, p.y);
      }
    }
    ctx.globalAlpha = 1;
    if (alive * 2 < particles.length) particles = particles.filter(function (p) { return now - p.born < p.life; });
    if (alive) { requestAnimationFrame(tick); }
    else { particles.length = 0; running = false; ctx.clearRect(0, 0, window.innerWidth, window.innerHeight); }
  }
})();
