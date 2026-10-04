// Client-side search for /recursos.
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

  queryInput.addEventListener("input", apply);
  apply();

  // Sidebar scroll-spy: highlight the category currently in view.
  if ("IntersectionObserver" in window && navLinks.length) {
    const spy = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const id = (entry.target as HTMLElement).dataset.category;
          for (const link of navLinks) {
            link.classList.toggle("is-current", link.dataset.navFor === id);
          }
        }
      },
      { rootMargin: "-40% 0px -55% 0px", threshold: 0 },
    );
    for (const category of categories) spy.observe(category);
  }
}
