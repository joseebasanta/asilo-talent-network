const LIGHT_COLOR = "#f5f5f7";
const DARK_COLOR = "#0f1011";

function currentTheme(): "light" | "dark" {
  return document.documentElement.dataset.theme === "light" ? "light" : "dark";
}

function applyTheme(theme: "light" | "dark", persist: boolean) {
  document.documentElement.dataset.theme = theme;
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", theme === "light" ? LIGHT_COLOR : DARK_COLOR);
  if (persist) {
    try {
      localStorage.setItem("theme", theme);
    } catch {
      // Storage can be blocked (private mode); the toggle still works for this visit.
    }
  }
  document.querySelectorAll<HTMLButtonElement>("[data-theme-toggle]").forEach((button) => {
    button.setAttribute("aria-pressed", String(theme === "light"));
    button.setAttribute("aria-label", theme === "light" ? "Cambiar a modo oscuro" : "Cambiar a modo claro");
  });
  document.dispatchEvent(new CustomEvent("themechange", { detail: { theme } }));
}

applyTheme(currentTheme(), false);
document.querySelectorAll<HTMLButtonElement>("[data-theme-toggle]").forEach((button) => {
  button.addEventListener("click", () => applyTheme(currentTheme() === "light" ? "dark" : "light", true));
});
