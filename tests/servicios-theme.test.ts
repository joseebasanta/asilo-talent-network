// @vitest-environment happy-dom
import { afterEach, describe, expect, it } from "vitest";
import { initThemeToggle, THEME_CHANGE_EVENT, THEME_STORAGE_KEY } from "../src/scripts/servicios-theme";

function memoryStorage(): Storage & { data: Map<string, string> } {
  const data = new Map<string, string>();
  return {
    data,
    get length() {
      return data.size;
    },
    clear: () => data.clear(),
    getItem: (key) => data.get(key) ?? null,
    key: (i) => [...data.keys()][i] ?? null,
    removeItem: (key) => void data.delete(key),
    setItem: (key, value) => void data.set(key, value),
  };
}

function setup(storage: Storage | null = memoryStorage()) {
  document.head.innerHTML = '<meta name="theme-color" content="#0f0f0f" />';
  document.body.innerHTML = '<button type="button" aria-label="Cambiar a modo claro" data-theme-toggle></button>';
  const button = document.querySelector<HTMLButtonElement>("[data-theme-toggle]")!;
  initThemeToggle(button, { storage });
  const root = document.documentElement;
  const themeColor = () => document.querySelector('meta[name="theme-color"]')!.getAttribute("content");
  return { button, root, themeColor };
}

afterEach(() => {
  delete document.documentElement.dataset.theme;
});

describe("servicios theme toggle", () => {
  it("starts in dark mode and alternates between light and dark on each click", () => {
    const { button, root, themeColor } = setup();
    expect(root.dataset.theme).toBeUndefined();
    expect(button.getAttribute("aria-label")).toBe("Cambiar a modo claro");

    button.click();
    expect(root.dataset.theme).toBe("light");
    expect(button.getAttribute("aria-label")).toBe("Cambiar a modo oscuro");
    expect(themeColor()).toBe("#f7f7f7");

    button.click();
    expect(root.hasAttribute("data-theme")).toBe(false);
    expect(button.getAttribute("aria-label")).toBe("Cambiar a modo claro");
    expect(themeColor()).toBe("#0f0f0f");
  });

  it("labels the button for the theme the inline head script already applied", () => {
    document.documentElement.dataset.theme = "light";
    const { button } = setup();
    expect(button.getAttribute("aria-label")).toBe("Cambiar a modo oscuro");
  });

  it("saves the choice so the next visit starts in the same theme", () => {
    const storage = memoryStorage();
    const { button } = setup(storage);
    button.click();
    expect(storage.data.get(THEME_STORAGE_KEY)).toBe("light");
    button.click();
    expect(storage.data.get(THEME_STORAGE_KEY)).toBe("dark");
  });

  it("still switches when storage is missing or throws", () => {
    const { button, root } = setup(null);
    button.click();
    expect(root.dataset.theme).toBe("light");

    const throwing = memoryStorage();
    throwing.setItem = () => {
      throw new Error("bloqueado");
    };
    delete root.dataset.theme;
    const second = setup(throwing);
    expect(() => second.button.click()).not.toThrow();
    expect(second.root.dataset.theme).toBe("light");
  });

  it("announces the new theme so the hero canvas can repaint its pixels", () => {
    const { button } = setup();
    const seen: string[] = [];
    const listener = (e: Event) => seen.push((e as CustomEvent<{ theme: string }>).detail.theme);
    document.addEventListener(THEME_CHANGE_EVENT, listener);
    button.click();
    button.click();
    document.removeEventListener(THEME_CHANGE_EVENT, listener);
    expect(seen).toEqual(["light", "dark"]);
  });
});
