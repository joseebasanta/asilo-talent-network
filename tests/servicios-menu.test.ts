// @vitest-environment happy-dom
import { beforeEach, describe, expect, it } from "vitest";
import { initNavMenu } from "../src/scripts/servicios-menu";

const markup = `
<header data-nav>
  <button data-nav-toggle aria-expanded="false" aria-label="Abrir menú"></button>
  <nav data-nav-menu><ul><li><a href="#servicios">Servicios</a></li></ul></nav>
</header>
<main id="fuera">fuera</main>`;

describe("servicios burger menu", () => {
  let nav: HTMLElement;
  let toggle: HTMLButtonElement;

  beforeEach(() => {
    document.documentElement.className = "";
    document.body.innerHTML = markup;
    nav = document.querySelector<HTMLElement>("[data-nav]")!;
    toggle = document.querySelector<HTMLButtonElement>("[data-nav-toggle]")!;
    initNavMenu(nav);
  });

  it("marks the page as enhanced and starts closed", () => {
    expect(document.documentElement.classList.contains("s-menu-js")).toBe(true);
    expect(nav.hasAttribute("data-open")).toBe(false);
    expect(toggle.getAttribute("aria-expanded")).toBe("false");
  });

  it("opens and closes with the button, keeping aria-expanded and the label in sync", () => {
    toggle.click();
    expect(nav.hasAttribute("data-open")).toBe(true);
    expect(toggle.getAttribute("aria-expanded")).toBe("true");
    expect(toggle.getAttribute("aria-label")).toBe("Cerrar menú");
    toggle.click();
    expect(nav.hasAttribute("data-open")).toBe(false);
    expect(toggle.getAttribute("aria-expanded")).toBe("false");
    expect(toggle.getAttribute("aria-label")).toBe("Abrir menú");
  });

  it("closes when a link is chosen", () => {
    toggle.click();
    document.querySelector<HTMLAnchorElement>("[data-nav-menu] a")!.click();
    expect(nav.hasAttribute("data-open")).toBe(false);
  });

  it("closes with Escape and returns the focus to the button", () => {
    toggle.click();
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    expect(nav.hasAttribute("data-open")).toBe(false);
    expect(document.activeElement).toBe(toggle);
  });

  it("closes when tapping outside the nav but not inside it", () => {
    toggle.click();
    nav.querySelector("nav")!.click();
    expect(nav.hasAttribute("data-open")).toBe(true);
    document.getElementById("fuera")!.click();
    expect(nav.hasAttribute("data-open")).toBe(false);
  });

  it("does nothing without the button or the menu", () => {
    document.body.innerHTML = `<header data-nav></header>`;
    document.documentElement.className = "";
    initNavMenu(document.querySelector<HTMLElement>("[data-nav]")!);
    expect(document.documentElement.classList.contains("s-menu-js")).toBe(false);
  });
});
