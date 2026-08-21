/* ==========================================================================
   Asilo Talent Network — landing interactions
   ========================================================================== */

/* -----------------------------------------------------------------------
   1) DESTINATIONS  ——  change these two lines when the real links exist.
   ----------------------------------------------------------------------- */
const APPLY_URL   = "#";  // TODO: paste the talent application form URL (Tally/Typeform/Google Form)
const COMPANY_URL = "mailto:hola@asilo.network?subject=Asilo%20%E2%80%94%20Empresa";

(function wireDestinations() {
  document.querySelectorAll("[data-apply]").forEach((el) => {
    el.setAttribute("href", APPLY_URL);
    if (APPLY_URL.startsWith("http")) { el.target = "_blank"; el.rel = "noopener"; }
  });
  document.querySelectorAll("[data-company]").forEach((el) => {
    el.setAttribute("href", COMPANY_URL);
    if (COMPANY_URL.startsWith("http")) { el.target = "_blank"; el.rel = "noopener"; }
  });
})();

/* -----------------------------------------------------------------------
   2) LANGUAGE TOGGLE (ES default, remembers choice)
   ----------------------------------------------------------------------- */
(function i18n() {
  const STORAGE_KEY = "asilo-lang";
  const buttons = document.querySelectorAll(".lang [data-lang]");

  function apply(lang) {
    document.documentElement.lang = lang;

    // Plain-text nodes
    document.querySelectorAll(`[data-${lang}]`).forEach((el) => {
      const val = el.getAttribute(`data-${lang}`);
      if (val !== null && !el.hasAttribute(`data-${lang}-html`)) el.textContent = val;
    });
    // Rich (innerHTML) nodes — used where emphasis/markup is needed
    document.querySelectorAll(`[data-${lang}-html]`).forEach((el) => {
      const val = el.getAttribute(`data-${lang}-html`);
      if (val !== null) el.innerHTML = val;
    });

    buttons.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.lang === lang)));
    try { localStorage.setItem(STORAGE_KEY, lang); } catch (e) {}
  }

  let initial = "es";
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "es" || saved === "en") initial = saved;
  } catch (e) {}

  buttons.forEach((b) => b.addEventListener("click", () => apply(b.dataset.lang)));
  apply(initial);
})();

/* -----------------------------------------------------------------------
   3) NAV — border appears once the page is scrolled
   ----------------------------------------------------------------------- */
(function navScroll() {
  const nav = document.getElementById("nav");
  if (!nav) return;
  const onScroll = () => nav.classList.toggle("scrolled", window.scrollY > 8);
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });
})();

/* -----------------------------------------------------------------------
   4) SCROLL REVEAL — quiet fade-up
   ----------------------------------------------------------------------- */
(function reveal() {
  const els = document.querySelectorAll(".reveal");
  if (!("IntersectionObserver" in window) || !els.length) {
    els.forEach((el) => el.classList.add("in"));
    return;
  }
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("in");
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
  els.forEach((el) => io.observe(el));
})();
