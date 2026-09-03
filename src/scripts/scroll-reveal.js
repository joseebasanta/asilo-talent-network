
/* ==========================================================================
   Scroll reveal — fires once when an element scrolls into view.
   - [data-decode]  headings: a subtle left-to-right "decode" (glyph scramble
     that resolves into the real text), using the ASCII ramp glyphs.
   - [data-reveal]  items: a soft fade + slide-up, staggered by --reveal-i.
   Robust: the hidden start-state only applies once JS marks <html> with .js,
   so content is visible without JS; prefers-reduced-motion shows everything
   instantly with no motion. One IntersectionObserver, each target once.
   ========================================================================== */
(function () {
  "use strict";
  var root = document.documentElement;
  root.classList.add("js");
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)");

  // Capture each heading's final text before we start scrambling it.
  var decoders = document.querySelectorAll("[data-decode]");
  for (var d = 0; d < decoders.length; d++) decoders[d].dataset.decodeText = decoders[d].textContent;

  var GLYPHS = "!<>-_/\\[]{}=+*:;.".split("");

  function runDecode(el) {
    var final = el.dataset.decodeText || el.textContent;
    if (reduce.matches) { el.textContent = final; return; }
    var start = performance.now(), DUR = 700, len = final.length;   // subtle: ~0.7s
    function tick(now) {
      var p = Math.min(1, (now - start) / DUR);
      var reveal = Math.floor(p * len), out = "";
      for (var i = 0; i < len; i++) {
        var c = final[i];
        out += (c === " " || i < reveal) ? c : GLYPHS[(Math.random() * GLYPHS.length) | 0];
      }
      el.textContent = out;
      if (p < 1) requestAnimationFrame(tick); else el.textContent = final;
    }
    requestAnimationFrame(tick);
  }

  var io = new IntersectionObserver(function (entries) {
    for (var i = 0; i < entries.length; i++) {
      var e = entries[i];
      if (!e.isIntersecting) continue;
      var el = e.target;
      io.unobserve(el);   // first time only
      if (el.hasAttribute("data-decode")) runDecode(el);
      else el.classList.add("is-in");
    }
  }, { threshold: 0.25, rootMargin: "0px 0px -10% 0px" });

  var targets = document.querySelectorAll("[data-decode], [data-reveal]");
  for (var t = 0; t < targets.length; t++) io.observe(targets[t]);
})();
