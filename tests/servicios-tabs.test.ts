// @vitest-environment happy-dom
import { beforeEach, describe, expect, it } from "vitest";
import { initTabs } from "../src/scripts/servicios-tabs";

function setup() {
  document.body.innerHTML = `
    <div data-tabs>
      <div role="tablist">
        ${["a", "b", "c"]
          .map(
            (id, i) =>
              `<button role="tab" id="tab-${id}" aria-controls="panel-${id}" aria-selected="${i === 0}" tabindex="${i === 0 ? 0 : -1}">${id}</button>`,
          )
          .join("")}
      </div>
      ${["a", "b", "c"].map((id, i) => `<div role="tabpanel" id="panel-${id}"${i === 0 ? "" : " hidden"}></div>`).join("")}
    </div>`;
  const root = document.querySelector<HTMLElement>("[data-tabs]")!;
  initTabs(root);
  const tabs = Array.from(root.querySelectorAll<HTMLButtonElement>('[role="tab"]'));
  const panels = Array.from(root.querySelectorAll<HTMLElement>('[role="tabpanel"]'));
  return { tabs, panels };
}

const state = (tabs: HTMLButtonElement[], panels: HTMLElement[]) =>
  tabs.map((t, i) => [t.getAttribute("aria-selected"), t.tabIndex, panels[i].hidden]);

describe("servicios tabs", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("opens the clicked tab and hides the other panels", () => {
    const { tabs, panels } = setup();
    tabs[1].click();

    expect(state(tabs, panels)).toEqual([
      ["false", -1, true],
      ["true", 0, false],
      ["false", -1, true],
    ]);
  });

  it("moves with the arrow keys, wraps around and supports Home and End", () => {
    const { tabs, panels } = setup();
    const press = (tab: HTMLElement, key: string) =>
      tab.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true }));

    press(tabs[0], "ArrowUp");
    expect(document.activeElement).toBe(tabs[2]);
    expect(panels[2].hidden).toBe(false);

    press(tabs[2], "ArrowDown");
    expect(document.activeElement).toBe(tabs[0]);

    press(tabs[0], "End");
    expect(document.activeElement).toBe(tabs[2]);
    press(tabs[2], "Home");
    expect(document.activeElement).toBe(tabs[0]);
    expect(state(tabs, panels)[0]).toEqual(["true", 0, false]);
  });

  it("ignores other keys", () => {
    const { tabs, panels } = setup();
    tabs[0].dispatchEvent(new KeyboardEvent("keydown", { key: "a", bubbles: true }));

    expect(state(tabs, panels)[0]).toEqual(["true", 0, false]);
  });
});
