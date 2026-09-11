import { filterProjects, paginateProjects, projectPageUrl, normalizeSearch } from "../lib/project-search";
import { track } from "./analytics";

const form = document.querySelector<HTMLFormElement>("#project-filters")!;
const search = document.querySelector<HTMLInputElement>("#project-query")!;
const sortDropdown = document.querySelector<HTMLDetailsElement>("#project-sort")!;
const sortTrigger = sortDropdown.querySelector<HTMLElement>("summary")!;
const sortLabel = document.querySelector<HTMLElement>("#sort-value")!;
const sortOptions = Array.from(form.querySelectorAll<HTMLInputElement>('[name="orden"]'));
const getOrder = () => sortOptions.find(option => option.checked)?.value ?? "az";
const setOrder = (value: string) => sortOptions.forEach(option => { option.checked = option.value === value; });
const boxes = Array.from(form.querySelectorAll<HTMLInputElement>('[name="categoria"]'));
const grid = document.querySelector<HTMLElement>("#project-results")!;
const cards = Array.from(grid.querySelectorAll<HTMLAnchorElement>("[data-project-index]"));
const projects = cards.map(card => ({
  href: card.href, title: card.dataset.title ?? "", description: card.dataset.description ?? "",
  author: card.dataset.author ?? "", tags: JSON.parse(card.dataset.tags ?? "[]") as string[], card,
}));
const count = document.querySelector<HTMLElement>("#project-count")!;
const empty = document.querySelector<HTMLElement>("#empty-results")!;
const clear = document.querySelector<HTMLElement>(".results-toolbar [data-clear-filters]")!;
const all = document.querySelector<HTMLAnchorElement>("[data-all-categories]")!;
const categoryDropdown = document.querySelector<HTMLDetailsElement>("#project-categories")!;
const categoryTrigger = categoryDropdown.querySelector<HTMLElement>("summary")!;
const categorySelection = document.querySelector<HTMLElement>("[data-category-selection]")!;
const categoryQuery = document.querySelector<HTMLInputElement>("#category-query")!;
const categoryRows = Array.from(document.querySelectorAll<HTMLElement>("[data-category-name]"));
const categoryEmpty = document.querySelector<HTMLElement>("[data-category-empty]")!;
const categoryDone = document.querySelector<HTMLButtonElement>("[data-category-done]")!;
function filterCategories() {
  const query = normalizeSearch(categoryQuery.value);
  categoryRows.forEach(row => { row.hidden = !normalizeSearch(row.dataset.categoryName ?? "").includes(query); });
  categoryEmpty.hidden = categoryRows.some(row => !row.hidden);
}
function resetCategorySearch() { categoryQuery.value = ""; filterCategories(); }


const paginationNav = document.querySelector<HTMLElement>(".project-pagination")!;
const pageStatus = document.querySelector<HTMLElement>("[data-page-status]")!;
const pageRange = document.querySelector<HTMLElement>("[data-page-range]")!;
const pageLinks = Array.from(document.querySelectorAll<HTMLAnchorElement>("[data-page-direction]"));
let currentPage = 1;
let gridWidth = grid.clientWidth;
new ResizeObserver(() => {
  if (grid.clientWidth !== gridWidth) {
    gridWidth = grid.clientWidth;
    grid.style.minHeight = "";
  }
}).observe(grid);

function render(updateUrl = true, resetPage = true, pushHistory = false) {
  if (resetPage) {
    currentPage = 1;
    grid.style.minHeight = "";
  }
  sortLabel.textContent = `Nombre: ${getOrder() === "za" ? "Z–A" : "A–Z"}`;
  const categories = boxes.filter(box => box.checked).map(box => box.value);
  const filtered = filterProjects(projects, search.value, categories, getOrder());
  const active = Boolean(search.value.trim() || categories.length);
  cards.forEach(card => { card.hidden = true; });
  const pagination = paginateProjects(filtered, currentPage);
  currentPage = pagination.page;
  pagination.items.forEach(({ card }, index) => {
    card.hidden = false;
    card.style.order = String(index);
    // Keep keyboard and reading order aligned with the visual sort order.
    grid.append(card);
  });
  count.textContent = `${filtered.length} ${filtered.length === 1 ? "proyecto" : "proyectos"}${active ? ` de ${projects.length}` : " para descubrir"}`;
  empty.hidden = filtered.length > 0;
  clear.hidden = !active;
  categorySelection.textContent = categories.length ? `${categories.length} ${categories.length === 1 ? "seleccionada" : "seleccionadas"}` : "Todas";
  const url = new URL(location.href);
  url.searchParams.delete("q");
  url.searchParams.delete("categoria");
  url.searchParams.delete("orden");
  if (search.value.trim()) url.searchParams.set("q", search.value.trim());
  categories.forEach(category => url.searchParams.append("categoria", category));
  if (getOrder() === "za") url.searchParams.set("orden", "za");
  all.href = search.value.trim() ? `/proyectos?q=${encodeURIComponent(search.value.trim())}` : "/proyectos";
  url.searchParams.delete("pagina");
  if (currentPage > 1) url.searchParams.set("pagina", String(currentPage));
  paginationNav.hidden = pagination.totalPages <= 1;
  pageStatus.textContent = `Página ${currentPage} de ${pagination.totalPages}`;
  pageRange.textContent = `${pagination.start}–${pagination.end} de ${filtered.length} proyectos`;
  pageLinks.forEach(link => {
    const nextPage = currentPage + (link.dataset.pageDirection === "next" ? 1 : -1);
    const disabled = nextPage < 1 || nextPage > pagination.totalPages;
    link.tabIndex = disabled ? -1 : 0;
    if (disabled) {
      link.removeAttribute("href"); link.setAttribute("aria-disabled", "true");
    } else {
      link.href = projectPageUrl(url, nextPage); link.removeAttribute("aria-disabled");
    }
  });
  if (updateUrl) {
    if (pushHistory) history.pushState(null, "", url);
    else history.replaceState(null, "", url);
  }
  return filtered.length;
}
function restore() {
  const params = new URLSearchParams(location.search);
  search.value = params.get("q") ?? "";
  setOrder(params.get("orden") === "za" ? "za" : "az");
  const selected = params.getAll("categoria");
  boxes.forEach(box => { box.checked = selected.some(value => value.localeCompare(box.value, "es", { sensitivity: "base" }) === 0); });
  currentPage = Number(params.get("pagina") ?? 1);
  render(false, false);
}
let debounce: ReturnType<typeof setTimeout>;
const searchMode = () => search.value.trim() ? "keyword_search" : "filter_only";
const trackSearch = (resultCount: number) => {
  const searchQuery = search.value.trim();
  if (!searchQuery) return;
  track("project_directory_searched", {
    search_query: searchQuery,
    search_scope: "all_projects",
    result_count: resultCount,
    sort_option: getOrder() === "za" ? "name_za" : "name_az",
  });
};
search.addEventListener("input", () => { clearTimeout(debounce); debounce = setTimeout(() => trackSearch(render()), 120); });
form.addEventListener("submit", event => { event.preventDefault(); clearTimeout(debounce); trackSearch(render()); });
form.addEventListener("change", event => {
  if (event.target === categoryQuery) return;
  const resultCount = render();
  const categories = boxes.filter(box => box.checked).map(box => box.value);
  if (event.target instanceof HTMLInputElement && event.target.name === "categoria") {
    track("project_directory_filtered", {
      filter_type: "category",
      filter_value: categories.join(","),
      result_count: resultCount,
      search_mode: searchMode(),
    });
  }
});
all.addEventListener("click", event => { event.preventDefault(); boxes.forEach(box => { box.checked = false; }); resetCategorySearch(); render(); });
document.querySelectorAll<HTMLAnchorElement>("[data-clear-filters]").forEach(link => link.addEventListener("click", event => {
  event.preventDefault(); form.reset(); search.value = ""; setOrder("az");
  boxes.forEach(box => { box.checked = false; }); resetCategorySearch(); render(); search.focus();
}));
pageLinks.forEach(link => link.addEventListener("click", event => {
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  event.preventDefault();
  if (link.getAttribute("aria-disabled") === "true") return;
  clearTimeout(debounce);
  // Keep the footer and pagination in place when the last page has fewer cards.
  grid.style.minHeight = `${grid.getBoundingClientRect().height}px`;
  currentPage += link.dataset.pageDirection === "next" ? 1 : -1;
  render(true, false, true);
  link.focus({ preventScroll: true });
  if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    grid.getAnimations().forEach(animation => animation.cancel());
    grid.animate([{ opacity: .4 }, { opacity: 1 }], { duration: 140, easing: "ease-out" });
  }
}));
window.addEventListener("popstate", restore);
restore();

// Radios provide native arrow-key navigation within the custom-styled popup.
// Pointer selection closes immediately; keyboard users can compare options
// with arrows, then confirm with Enter or dismiss with Escape/Tab.
sortOptions.forEach(option => option.addEventListener("click", event => {
  if (event.detail > 0) { sortDropdown.open = false; sortTrigger.focus(); }
}));
sortDropdown.addEventListener("keydown", event => {
  if (event.key === "Escape" || (event.key === "Enter" && event.target !== sortTrigger)) {
    event.preventDefault(); sortDropdown.open = false; sortTrigger.focus();
  } else if ((event.key === "ArrowDown" || event.key === "ArrowUp") && event.target === sortTrigger) {
    event.preventDefault(); sortDropdown.open = true;
    sortOptions.find(option => option.checked)?.focus();
  }
});
sortDropdown.addEventListener("focusout", () => {
  // Wait for the browser to finish moving focus between radio options.
  window.setTimeout(() => { if (!sortDropdown.contains(document.activeElement)) sortDropdown.open = false; }, 0);
});
document.addEventListener("pointerdown", event => {
  if (event.target instanceof Node && !sortDropdown.contains(event.target)) sortDropdown.open = false;
});

// Keep the category list bounded and searchable without losing selections.
document.querySelector<HTMLElement>("[data-category-search]")!.hidden = false;
categoryDone.hidden = false;
categoryQuery.addEventListener("input", filterCategories);
categoryQuery.addEventListener("keydown", event => {
  if (event.key === "Enter") event.preventDefault();
});
categoryDone.addEventListener("click", () => { categoryDropdown.open = false; categoryTrigger.focus(); });
categoryDropdown.addEventListener("keydown", event => {
  if (event.key === "Escape") {
    event.preventDefault(); categoryDropdown.open = false; categoryTrigger.focus();
  } else if (event.key === "ArrowDown" && event.target === categoryTrigger) {
    event.preventDefault(); categoryDropdown.open = true; categoryQuery.focus();
  }
});
categoryDropdown.addEventListener("toggle", () => {
  if (categoryDropdown.open) sortDropdown.open = false;
  else resetCategorySearch();
});
sortDropdown.addEventListener("toggle", () => { if (sortDropdown.open) categoryDropdown.open = false; });
categoryDropdown.addEventListener("focusout", event => {
  // Clicking a checkbox label can briefly leave focus on the document body
  // before the browser activates its input. That is not an outside action.
  // Close only when focus moves to a known control outside the dropdown.
  const nextTarget = event.relatedTarget;
  if (nextTarget instanceof Node && nextTarget !== document.body && !categoryDropdown.contains(nextTarget)) {
    categoryDropdown.open = false;
  }
});
document.addEventListener("pointerdown", event => {
  if (event.target instanceof Node && !categoryDropdown.contains(event.target)) categoryDropdown.open = false;
});
