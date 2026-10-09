import { startProjectRefresh } from "../lib/project-refresh";
import { DEFAULT_PROJECT_ORDER, filterProjects, limitProjects, normalizeVisibleLimit, parseProjectOrder, PROJECTS_PAGE_SIZE } from "../lib/project-search";
import { track } from "./analytics";

const form = document.querySelector<HTMLFormElement>("#project-filters")!;
const search = document.querySelector<HTMLInputElement>("#project-query")!;
const orderOptions = Array.from(form.querySelectorAll<HTMLInputElement>('[name="orden"]'));
const getOrder = () => parseProjectOrder(orderOptions.find(option => option.checked)?.value);
const setOrder = (value: string) => orderOptions.forEach(option => { option.checked = option.value === value; });
let boxes = Array.from(form.querySelectorAll<HTMLInputElement>('[name="categoria"]'));
const grid = document.querySelector<HTMLElement>("#project-results")!;
const count = document.querySelector<HTMLElement>("#project-count")!;
const empty = document.querySelector<HTMLElement>("#empty-results")!;
const clear = document.querySelector<HTMLElement>(".results-toolbar [data-clear-filters]")!;
const all = document.querySelector<HTMLAnchorElement>("[data-all-categories]")!;
const showMore = document.querySelector<HTMLElement>(".show-more")!;
const showMoreButton = document.querySelector<HTMLAnchorElement>("[data-show-more]")!;
const showStatus = document.querySelector<HTMLElement>("[data-show-status]")!;

const numberOrUndefined = (value: string | undefined) => (value === undefined || value === "" ? undefined : Number(value));
function readCards() {
  const cards = Array.from(grid.querySelectorAll<HTMLAnchorElement>("[data-project-index]"));
  return {
    cards,
    projects: cards.map(card => ({
      href: card.href, title: card.dataset.title ?? "", description: card.dataset.description ?? "",
      author: card.dataset.author ?? "", tags: JSON.parse(card.dataset.tags ?? "[]") as string[],
      addedAt: numberOrUndefined(card.dataset.added), visits: numberOrUndefined(card.dataset.visits),
      trending: numberOrUndefined(card.dataset.trending), card,
    })),
  };
}
let { cards, projects } = readCards();

function showMoreHref(current: URL, limit: number) {
  const url = new URL(current);
  url.searchParams.set("mostrar", String(limit));
  url.hash = "project-results";
  return `${url.pathname}${url.search}${url.hash}`;
}

let visibleLimit = PROJECTS_PAGE_SIZE;

function render(updateUrl = true, resetLimit = true, pushHistory = false) {
  if (resetLimit) visibleLimit = PROJECTS_PAGE_SIZE;
  const categories = boxes.filter(box => box.checked).map(box => box.value);
  const filtered = filterProjects(projects, search.value, categories, getOrder());
  const active = Boolean(search.value.trim() || categories.length);
  cards.forEach(card => { card.hidden = true; });
  const visible = limitProjects(filtered, visibleLimit);
  visibleLimit = visible.limit;
  visible.items.forEach(({ card }, index) => {
    card.hidden = false;
    card.style.order = String(index);
    // Keep keyboard and reading order aligned with the visual sort order.
    grid.append(card);
  });
  count.textContent = `${filtered.length} ${filtered.length === 1 ? "proyecto" : "proyectos"}${active ? ` de ${projects.length}` : " para descubrir"}`;
  empty.hidden = filtered.length > 0;
  clear.hidden = !active;
  if (categories.length) all.removeAttribute("aria-current"); else all.setAttribute("aria-current", "true");
  const url = new URL(location.href);
  url.searchParams.delete("q");
  url.searchParams.delete("categoria");
  url.searchParams.delete("orden");
  if (search.value.trim()) url.searchParams.set("q", search.value.trim());
  categories.forEach(category => url.searchParams.append("categoria", category));
  if (getOrder() !== DEFAULT_PROJECT_ORDER) url.searchParams.set("orden", getOrder());
  all.href = search.value.trim() ? `/proyectos?q=${encodeURIComponent(search.value.trim())}` : "/proyectos";
  url.searchParams.delete("pagina");
  url.searchParams.delete("mostrar");
  if (visibleLimit > PROJECTS_PAGE_SIZE) url.searchParams.set("mostrar", String(visibleLimit));
  showMore.hidden = !visible.hasMore;
  showStatus.textContent = `Mostrando ${visible.shown} de ${filtered.length} proyectos`;
  showMoreButton.href = showMoreHref(url, visible.limit + PROJECTS_PAGE_SIZE);
  if (updateUrl) {
    if (pushHistory) history.pushState(null, "", url);
    else history.replaceState(null, "", url);
  }
  return filtered.length;
}
function restore() {
  const params = new URLSearchParams(location.search);
  search.value = params.get("q") ?? "";
  setOrder(parseProjectOrder(params.get("orden")));
  const selected = params.getAll("categoria");
  boxes.forEach(box => { box.checked = selected.some(value => value.localeCompare(box.value, "es", { sensitivity: "base" }) === 0); });
  visibleLimit = normalizeVisibleLimit(Number(params.get("mostrar") ?? PROJECTS_PAGE_SIZE));
  render(false, false);
}
let debounce: ReturnType<typeof setTimeout>;
const searchMode = () => search.value.trim() ? "keyword_search" : "filter_only";
const SORT_EVENT_NAMES = { recientes: "newest", visitas: "most_visited", trending: "trending", az: "name_az" } as const;
const trackSearch = (resultCount: number) => {
  const searchQuery = search.value.trim();
  if (!searchQuery) return;
  track("project_directory_searched", {
    search_query: searchQuery,
    search_scope: "all_projects",
    result_count: resultCount,
    sort_option: SORT_EVENT_NAMES[getOrder()],
  });
};
search.addEventListener("input", () => { clearTimeout(debounce); debounce = setTimeout(() => trackSearch(render()), 120); });
form.addEventListener("submit", event => { event.preventDefault(); clearTimeout(debounce); trackSearch(render()); });
form.addEventListener("change", event => {
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
all.addEventListener("click", event => { event.preventDefault(); boxes.forEach(box => { box.checked = false; }); render(); });
document.querySelectorAll<HTMLAnchorElement>("[data-clear-filters]").forEach(link => link.addEventListener("click", event => {
  event.preventDefault(); form.reset(); search.value = ""; setOrder(DEFAULT_PROJECT_ORDER);
  boxes.forEach(box => { box.checked = false; }); render(); search.focus();
}));
showMoreButton.addEventListener("click", event => {
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  event.preventDefault();
  const firstNew = cards.filter(card => !card.hidden).length;
  visibleLimit += PROJECTS_PAGE_SIZE;
  render(true, false, true);
  // The button disappears once everything is shown; keep keyboard focus on the new content.
  const revealed = cards.filter(card => !card.hidden)[firstNew];
  if (showMore.hidden) revealed?.focus({ preventScroll: false });
});
window.addEventListener("popstate", restore);
restore();

// Refresh server-rendered results while preserving filters and how many are shown.
let refreshing = false;
let directorySnapshot = "";
async function refreshDirectory() {
  const interacting = () => form.contains(document.activeElement) || grid.contains(document.activeElement) || Boolean(document.querySelector("dialog[open]"));
  if (refreshing || document.visibilityState !== "visible" || interacting()) return;
  refreshing = true;
  try {
    const response = await fetch(location.href, { cache: "no-store", signal: AbortSignal.timeout(15_000) });
    if (!response.ok) throw new Error("Project refresh failed");
    const page = new DOMParser().parseFromString(await response.text(), "text/html");
    const nextGrid = page.querySelector("#project-results");
    const nextCategories = page.querySelector(".category-list");
    if (!nextGrid || !nextCategories || interacting()) return;
    const snapshot = nextGrid.innerHTML + nextCategories.innerHTML;
    if (snapshot === directorySnapshot) return;
    directorySnapshot = snapshot;
    const selected = boxes.filter(box => box.checked).map(box => box.value);
    grid.replaceChildren(...Array.from(nextGrid.children));
    form.querySelector(".category-list")!.replaceChildren(...Array.from(nextCategories.children));
    boxes = Array.from(form.querySelectorAll<HTMLInputElement>('[name="categoria"]'));
    boxes.forEach(box => { box.checked = selected.includes(box.value); });
    ({ cards, projects } = readCards());
    const nextEmpty = page.querySelector("#empty-results");
    if (nextEmpty) {
      empty.querySelector("h2")!.textContent = nextEmpty.querySelector("h2")!.textContent;
      empty.querySelector("p")!.textContent = nextEmpty.querySelector("p")!.textContent;
    }
    render(false, false);
  } finally {
    refreshing = false;
  }
}
startProjectRefresh(refreshDirectory);
