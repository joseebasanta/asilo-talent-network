// Client-side search + sidebar behaviour for /recursos.
// No-JS fallback: every resource is visible (this only hides/shows).

const norm = (value: string): string =>
  value.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

const form = document.getElementById("resource-filters");
const queryInput = document.getElementById("resource-query") as HTMLInputElement | null;
const countEl = document.getElementById("resource-count");
const emptyEl = document.getElementById("resource-empty");
const resources = Array.from(document.querySelectorAll<HTMLElement>(".resource"));
const categories = Array.from(document.querySelectorAll<HTMLElement>(".library-category"));
const navLinks = Array.from(document.querySelectorAll<HTMLElement>("[data-nav-for]"));
const navList = document.getElementById("library-nav");
const sectionsEl = document.getElementById("resource-sections");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Keep `link` visible inside the independently scrolling category list
// (scrolls only the list, never the page).
const revealInNav = (link: HTMLElement): void => {
  if (!navList || navList.clientHeight === 0) return;
  const pad = 40; // matches the list's bottom fade
  const top = link.offsetTop;
  const bottom = top + link.offsetHeight;
  if (top < navList.scrollTop) {
    navList.scrollTo({ top: Math.max(0, top - 8), behavior: reduceMotion ? "auto" : "smooth" });
  } else if (bottom > navList.scrollTop + navList.clientHeight - pad) {
    navList.scrollTo({ top: bottom - navList.clientHeight + pad, behavior: reduceMotion ? "auto" : "smooth" });
  }
};

if (form && queryInput && countEl && emptyEl && resources.length) {
  const apply = (): void => {
    const q = norm(queryInput.value.trim());
    let visible = 0;

    for (const row of resources) {
      const name = norm(row.dataset.name ?? "");
      const desc = norm(row.dataset.desc ?? "");
      const show = !q || name.includes(q) || desc.includes(q);
      row.hidden = !show;
      if (show) visible += 1;
    }

    let visibleCategories = 0;
    for (const category of categories) {
      const anyVisible = category.querySelector(".resource:not([hidden])") !== null;
      category.hidden = !anyVisible;
      if (anyVisible) visibleCategories += 1;
      const navLink = navLinks.find((link) => link.dataset.navFor === category.dataset.category);
      if (navLink?.parentElement) navLink.parentElement.hidden = !anyVisible;
    }

    countEl.textContent =
      `${visible} ${visible === 1 ? "recurso" : "recursos"} · ` +
      `${visibleCategories} ${visibleCategories === 1 ? "categoría" : "categorías"}`;
    emptyEl.hidden = visible > 0;
  };

  // While typing deep in the page, jump back so the first results are in view.
  const showResults = (): void => {
    if (!sectionsEl) return;
    const top = sectionsEl.getBoundingClientRect().top;
    // "instant" overrides the global `scroll-behavior: smooth` so results appear immediately.
    if (top < 0) window.scrollTo({ top: window.scrollY + top - 24, behavior: "instant" });
  };

  queryInput.addEventListener("input", () => {
    apply();
    showResults();
  });

  // Esc clears the search (and leaves the field when it's already empty).
  queryInput.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    event.preventDefault();
    if (queryInput.value) {
      queryInput.value = "";
      apply();
    } else {
      queryInput.blur();
    }
  });

  // "/" focuses the search from anywhere on the page, unless already typing.
  document.addEventListener("keydown", (event) => {
    if (event.key !== "/" || event.metaKey || event.ctrlKey || event.altKey) return;
    const target = event.target as HTMLElement | null;
    if (target?.closest("input, textarea, select, [contenteditable='true']")) return;
    event.preventDefault();
    queryInput.focus();
    queryInput.select();
  });

  apply();

  // Sidebar scroll-spy: highlight the category currently in view.
  if ("IntersectionObserver" in window && navLinks.length) {
    const spy = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const id = (entry.target as HTMLElement).dataset.category;
          for (const link of navLinks) {
            const current = link.dataset.navFor === id;
            link.classList.toggle("is-current", current);
            if (current) revealInNav(link);
          }
        }
      },
      { rootMargin: "-40% 0px -55% 0px", threshold: 0 },
    );
    for (const category of categories) spy.observe(category);
  }
}
