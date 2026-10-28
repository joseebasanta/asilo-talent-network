// Pestañas accesibles (patrón tabs de WAI-ARIA, activación automática).
// Uso: un contenedor con `[role="tablist"]` de botones `[role="tab"]` cuyo `aria-controls` apunta a un
// `[role="tabpanel"]`. El HTML ya llega con la primera pestaña activa; esto solo maneja el cambio.

export function initTabs(root: HTMLElement): void {
  const tabs = Array.from(root.querySelectorAll<HTMLButtonElement>('[role="tab"]'));
  if (tabs.length < 2) return;

  const panelFor = (tab: HTMLElement) => root.querySelector<HTMLElement>(`#${tab.getAttribute("aria-controls")}`);

  const select = (next: HTMLButtonElement, focus: boolean) => {
    for (const tab of tabs) {
      const active = tab === next;
      tab.setAttribute("aria-selected", String(active));
      tab.tabIndex = active ? 0 : -1;
      const panel = panelFor(tab);
      if (panel) panel.hidden = !active;
    }
    if (focus) next.focus();
  };

  for (const tab of tabs) {
    tab.addEventListener("click", () => select(tab, false));
    tab.addEventListener("keydown", (event) => {
      const i = tabs.indexOf(tab);
      const last = tabs.length - 1;
      const target = {
        ArrowDown: i === last ? 0 : i + 1,
        ArrowRight: i === last ? 0 : i + 1,
        ArrowUp: i === 0 ? last : i - 1,
        ArrowLeft: i === 0 ? last : i - 1,
        Home: 0,
        End: last,
      }[event.key];
      if (target === undefined) return;
      event.preventDefault();
      select(tabs[target], true);
    });
  }
}
