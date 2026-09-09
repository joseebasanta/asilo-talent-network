import { filterProjects } from "../lib/project-search";

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

function render(updateUrl = true) {
  sortLabel.textContent = `Nombre: ${getOrder() === "za" ? "Z–A" : "A–Z"}`;
  const categories = boxes.filter(box => box.checked).map(box => box.value);
  const filtered = filterProjects(projects, search.value, categories, getOrder());
  const active = Boolean(search.value.trim() || categories.length);
  cards.forEach(card => { card.hidden = true; });
  filtered.forEach(({ card }, index) => {
    card.hidden = false;
    card.style.order = String(index);
    // Keep keyboard and reading order aligned with the visual sort order.
    grid.append(card);
  });
  count.textContent = `${filtered.length} ${filtered.length === 1 ? "proyecto" : "proyectos"}${active ? ` de ${projects.length}` : " para descubrir"}`;
  empty.hidden = filtered.length > 0;
  clear.hidden = !active;
  all.classList.toggle("is-active", !categories.length);
  const url = new URL(location.href);
  url.searchParams.delete("q");
  url.searchParams.delete("categoria");
  url.searchParams.delete("orden");
  if (search.value.trim()) url.searchParams.set("q", search.value.trim());
  categories.forEach(category => url.searchParams.append("categoria", category));
  if (getOrder() === "za") url.searchParams.set("orden", "za");
  all.href = search.value.trim() ? `/proyectos?q=${encodeURIComponent(search.value.trim())}` : "/proyectos";
  if (updateUrl) history.replaceState(null, "", url);
}
function restore() {
  const params = new URLSearchParams(location.search);
  search.value = params.get("q") ?? "";
  setOrder(params.get("orden") === "za" ? "za" : "az");
  const selected = params.getAll("categoria");
  boxes.forEach(box => { box.checked = selected.some(value => value.localeCompare(box.value, "es", { sensitivity: "base" }) === 0); });
  render(false);
}
let debounce: ReturnType<typeof setTimeout>;
search.addEventListener("input", () => { clearTimeout(debounce); debounce = setTimeout(() => render(), 120); });
form.addEventListener("submit", event => { event.preventDefault(); clearTimeout(debounce); render(); });
form.addEventListener("change", () => render());
all.addEventListener("click", event => { event.preventDefault(); boxes.forEach(box => { box.checked = false; }); render(); });
document.querySelectorAll<HTMLAnchorElement>("[data-clear-filters]").forEach(link => link.addEventListener("click", event => {
  event.preventDefault(); form.reset(); search.value = ""; setOrder("az");
  boxes.forEach(box => { box.checked = false; }); render(); search.focus();
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
