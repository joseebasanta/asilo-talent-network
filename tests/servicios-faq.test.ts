// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";
import { initFaq } from "../src/scripts/servicios-faq";

function setup(count = 4) {
  document.body.innerHTML = `
    <div class="s-faq-list">
      ${Array.from({ length: count }, (_, i) => `
        <details class="s-faq-item" name="faq"${i === 0 ? " open" : ""}>
          <summary>Pregunta ${i + 1}</summary>
          <div class="s-faq-answer-wrap"><p>Respuesta ${i + 1}</p></div>
        </details>`).join("")}
    </div>`;
  const list = document.querySelector<HTMLElement>(".s-faq-list")!;
  initFaq(list, { animated: false });
  const items = Array.from(list.querySelectorAll<HTMLDetailsElement>("details"));
  const open = () => items.map((d) => (d.open ? 1 : 0)).join("");
  const click = (i: number) => items[i].querySelector("summary")!.click();
  return { items, open, click };
}

describe("servicios faq accordion", () => {
  it("starts with the first question open and keeps a single one open", () => {
    const { open, click } = setup();
    expect(open()).toBe("1000");

    click(2);
    expect(open()).toBe("0010");
    click(3);
    expect(open()).toBe("0001");
  });

  it("closes the open question when its summary is clicked again", () => {
    const { open, click } = setup();
    click(0);
    expect(open()).toBe("0000");
    click(1);
    expect(open()).toBe("0100");
  });

  it("takes over exclusivity from the native name attribute so it can animate both answers", () => {
    const { items } = setup();
    expect(items.every((d) => !d.hasAttribute("name"))).toBe(true);
  });
});
