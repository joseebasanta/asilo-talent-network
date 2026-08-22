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

/* Current language, shared with the data-driven renderers below. */
let LANG = "es";

/* -----------------------------------------------------------------------
   2) LANGUAGE TOGGLE (ES default, remembers choice)
   ----------------------------------------------------------------------- */
(function i18n() {
  const STORAGE_KEY = "asilo-lang";
  const buttons = document.querySelectorAll(".lang [data-lang]");

  function apply(lang) {
    LANG = lang;
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

    // Re-render language-dependent content (roles, project blurbs).
    if (typeof renderMembers === "function") renderMembers();
    if (typeof renderProjects === "function") renderProjects();
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

/* -----------------------------------------------------------------------
   5) DATA-DRIVEN CONTENT  (members carousel, map, projects)
       Reads MEMBERS and PROJECTS from data.js.
   ----------------------------------------------------------------------- */

/* Small helpers */
function hashHue(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) % 360;
  return h;
}
function initialsOf(name) {
  return name.split(/\s+/).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}
function esc(s) {
  return String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
}

/* ---- Members carousel ---- */
function renderMembers() {
  const track = document.getElementById("members-track");
  if (!track || typeof MEMBERS === "undefined") return;

  const cardHTML = (m) => {
    const h = hashHue(m.name);
    const bg = `linear-gradient(135deg, hsl(${h} 60% 62%), hsl(${(h + 40) % 360} 62% 48%))`;
    const role = LANG === "en" ? m.role_en : m.role_es;
    const tags = (m.tags || []).map((t) => `<span>${esc(t)}</span>`).join("");
    return `
      <article class="member-card">
        <div class="member-top">
          <div class="avatar" style="background:${bg}">${esc(initialsOf(m.name))}</div>
          <div>
            <div class="m-name">${esc(m.name)}</div>
            <div class="m-role">${esc(role)}</div>
          </div>
        </div>
        <div class="member-tags">${tags}</div>
        <div class="m-city">${esc(m.city)}</div>
      </article>`;
  };

  const set = MEMBERS.map(cardHTML).join("");
  track.innerHTML = set + set; // duplicated for a seamless marquee loop
}

/* ---- Projects showcase ---- */
function renderProjects() {
  const grid = document.getElementById("projects-grid");
  if (!grid || typeof PROJECTS === "undefined") return;

  grid.innerHTML = PROJECTS.map((p) => {
    const h = hashHue(p.title);
    const bg = `linear-gradient(135deg, hsl(${h} 58% 60%), hsl(${(h + 50) % 360} 60% 46%))`;
    const blurb = LANG === "en" ? p.blurb_en : p.blurb_es;
    const byWord = LANG === "en" ? "by" : "por";
    const href = p.url && p.url !== "#" ? ` href="${esc(p.url)}" target="_blank" rel="noopener"` : "";
    const tag = href ? "a" : "div";
    return `
      <${tag} class="project-card"${href}>
        <div class="project-thumb" style="background:${bg}">
          <span class="p-tag">${esc(p.tag)}</span>
          ${esc(p.title[0])}
        </div>
        <div class="project-body">
          <h3>${esc(p.title)}</h3>
          <p class="p-blurb">${esc(blurb)}</p>
          <div class="p-by">${byWord} <b>${esc(p.builder)}</b> · ${esc(p.city)}</div>
        </div>
      </${tag}>`;
  }).join("");
}

/* ---- Map of Venezuela ---- */
function renderMap() {
  const svg = document.getElementById("ve-map");
  if (!svg || typeof MEMBERS === "undefined") return;
  const NS = "http://www.w3.org/2000/svg";
  const W = 800, H = 460, padX = 54, padY = 56;
  const drawW = W - padX * 2, drawH = H - padY * 2;
  const B = { lngMin: -73.5, lngMax: -60.8, latMin: 6.6, latMax: 11.9 };
  const px = (lng) => padX + ((lng - B.lngMin) / (B.lngMax - B.lngMin)) * drawW;
  const py = (lat) => padY + ((B.latMax - lat) / (B.latMax - B.latMin)) * drawH;
  const el = (tag, attrs) => {
    const n = document.createElementNS(NS, tag);
    for (const k in attrs) n.setAttribute(k, attrs[k]);
    return n;
  };

  // Group builders by city
  const byCity = {};
  MEMBERS.forEach((m) => {
    (byCity[m.city] ||= { city: m.city, lat: m.lat, lng: m.lng, count: 0 }).count++;
  });
  const cities = Object.values(byCity).map((c) => ({ ...c, x: px(c.lng), y: py(c.lat) }));

  svg.innerHTML = "";

  // Faint graticule
  for (let i = 0; i <= 6; i++) {
    const x = padX + (drawW / 6) * i;
    svg.appendChild(el("line", { class: "grat", x1: x, y1: padY, x2: x, y2: H - padY }));
  }
  for (let i = 0; i <= 4; i++) {
    const y = padY + (drawH / 4) * i;
    svg.appendChild(el("line", { class: "grat", x1: padX, y1: y, x2: W - padX, y2: y }));
  }

  // Connecting spine (sorted west→east). Also use this order to stagger
  // labels above/below so horizontal neighbours never collide.
  const spine = [...cities].sort((a, b) => a.x - b.x);
  spine.forEach((c, i) => { c.dy = i % 2 === 0 ? 25 : -14; });
  const d = spine.map((c, i) => `${i ? "L" : "M"} ${c.x.toFixed(1)} ${c.y.toFixed(1)}`).join(" ");
  svg.appendChild(el("path", { class: "link", d }));

  // Pins
  const tooltip = document.getElementById("map-tooltip");
  const canvas = svg.closest(".map-canvas");
  cities.forEach((c) => {
    const g = el("g", { class: "pin-grp" });
    g.appendChild(el("circle", { class: "pin-halo", cx: c.x, cy: c.y, r: 13 }));
    g.appendChild(el("circle", { class: "pin", cx: c.x, cy: c.y, r: 5.5 }));
    const label = el("text", { class: "pin-label", x: c.x, y: c.y + (c.dy || 24), "text-anchor": "middle" });
    label.textContent = c.city;
    g.appendChild(label);

    if (tooltip && canvas) {
      const show = (e) => {
        const rect = canvas.getBoundingClientRect();
        const word = c.count === 1 ? (LANG === "en" ? "builder" : "builder") : (LANG === "en" ? "builders" : "builders");
        tooltip.innerHTML = `<b>${esc(c.city)}</b><span>${c.count} ${word}</span>`;
        tooltip.hidden = false;
        tooltip.style.left = (e.clientX - rect.left) + "px";
        tooltip.style.top = (e.clientY - rect.top) + "px";
      };
      g.addEventListener("mouseenter", show);
      g.addEventListener("mousemove", show);
      g.addEventListener("mouseleave", () => { tooltip.hidden = true; });
    }
    svg.appendChild(g);
  });

  // City list
  const list = document.getElementById("map-cities");
  if (list) {
    list.innerHTML = cities
      .sort((a, b) => b.count - a.count || a.city.localeCompare(b.city))
      .map((c) => `<li><span class="c-name">${esc(c.city)}</span><span class="c-count">${c.count}</span></li>`)
      .join("");
  }
}

renderMap();
