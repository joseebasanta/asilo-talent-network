import { Window } from "happy-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { experimental_AstroContainer as AstroContainer } from "astro/container";
import CommunityForm from "../src/components/CommunityForm.astro";
import { initCommunityForm } from "../src/scripts/community-form";

const answers = { email: "ana@example.com", name: "Ana Pérez", location: "Caracas, Venezuela", whatsapp: "+58 412 1234567", linkedin: "https://www.linkedin.com/in/ana", role: "Developer", project: "Mi proyecto", description: "Una aplicación." };
let form: HTMLFormElement;
let dialog: HTMLDialogElement;
let fetchMock: ReturnType<typeof vi.fn>;
const input = (name: string) => form.elements.namedItem(name) as HTMLInputElement;
const submit = () => form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
function fill() { for (const [name, value] of Object.entries(answers)) input(name).value = value; }
async function flush() { await new Promise(resolve => setTimeout(resolve, 0)); }
beforeEach(async () => {
  const container = await AstroContainer.create();
  const html = await container.renderToString(CommunityForm);
  const dom = new Window({ url: "http://localhost/" });
  vi.stubGlobal("window", dom);
  vi.stubGlobal("document", dom.document);
  vi.stubGlobal("location", dom.location);
  vi.stubGlobal("Event", dom.Event);
  vi.stubGlobal("FormData", dom.FormData);
  document.body.innerHTML = '<a href="#unete">Unete</a>' + html;
  dialog = document.querySelector("#community-dialog")!;
  // The DOM runner does not emulate a browser's top layer/focus trap.
  dialog.showModal = () => { dialog.open = true; };
  dialog.close = () => { dialog.open = false; dialog.dispatchEvent(new Event("close")); };
  form = document.querySelector("#community-form")!;
  fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);
  initCommunityForm();
  document.querySelector<HTMLAnchorElement>('a[href="#unete"]')!.click();
});
afterEach(() => { vi.unstubAllGlobals(); });

describe("community form interactions", () => {
  it("ignores backdrop clicks and Escape but allows Cancel", async () => {
    input("name").value = "Ana Pérez";
    dialog.dispatchEvent(new Event("pointerdown", { bubbles: true }));
    dialog.click();
    const cancel = new Event("cancel", { cancelable: true });
    dialog.dispatchEvent(cancel);
    expect(cancel.defaultPrevented).toBe(true);
    expect(dialog.open).toBe(true);
    expect(input("name").value).toBe("Ana Pérez");
    expect(document.body.style.overflow).toBe("hidden");
    dialog.querySelector<HTMLButtonElement>(".modal-cancel")!.click();
    await flush();
    expect(dialog.open).toBe(false);
    expect(document.body.style.overflow).toBe("");
  });
  it("shows inline Zod errors and focuses the first invalid field without posting", () => {
    submit();
    expect(fetchMock).not.toHaveBeenCalled();
    expect(input("email").getAttribute("aria-invalid")).toBe("true");
    expect(document.activeElement).toBe(input("email"));
    expect(document.getElementById("community-email-error")!.hidden).toBe(false);
    input("email").value = answers.email;
    input("email").dispatchEvent(new Event("input"));
    expect(input("email").hasAttribute("aria-invalid")).toBe(false);
  });
  it("rejects malformed WhatsApp numbers and lookalike LinkedIn domains locally", () => {
    fill(); input("whatsapp").value = "+1------"; input("linkedin").value = "https://linkedin.com.evil.test/in/ana";
    submit();
    expect(fetchMock).not.toHaveBeenCalled();
    expect(input("whatsapp").getAttribute("aria-invalid")).toBe("true");
    expect(input("linkedin").getAttribute("aria-invalid")).toBe("true");
  });
  it("locks edits/double submits while pending and shows the dedicated success screen", async () => {
    fill();
    let resolve!: (value: unknown) => void;
    fetchMock.mockReturnValue(new Promise(r => { resolve = r; }));
    submit(); submit();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const body = fetchMock.mock.calls[0][1].body as FormData;
    for (const [name, value] of Object.entries(answers)) expect(body.get(name)).toBe(value);
    expect(input("name").readOnly).toBe(true);
    expect(form.getAttribute("aria-busy")).toBe("true");
    expect(form.querySelector<HTMLElement>("[data-community-success]")!.hidden).toBe(true);
    resolve({ ok: true, json: async () => ({ ok: true }) });
    await flush();
    expect(form.querySelector<HTMLElement>("[data-form-view]")!.hidden).toBe(true);
    expect(form.querySelector<HTMLElement>("[data-community-success]")!.hidden).toBe(false);
    expect(document.activeElement?.id).toBe("community-success-title");
    submit(); expect(fetchMock).toHaveBeenCalledTimes(1);
  });
  it("preserves answers and restores controls when storage fails", async () => {
    fill(); fetchMock.mockResolvedValue({ ok: false, json: async () => ({ error: "No disponible" }) });
    submit(); await flush();
    expect(input("name").value).toBe(answers.name);
    expect(input("name").readOnly).toBe(false);
    expect(form.querySelector<HTMLButtonElement>(".modal-submit")!.disabled).toBe(false);
    expect(document.getElementById("community-status")!.textContent).toBe("No disponible");
    expect(form.querySelector<HTMLElement>("[data-community-success]")!.hidden).toBe(true);
  });
  it("shows server field errors and preserves the first-open clock on resume", async () => {
    const started = input("started").value;
    fill(); fetchMock.mockResolvedValue({ ok: false, json: async () => ({ errors: { email: "Revisa el email" } }) });
    submit(); await flush();
    expect(document.getElementById("community-email-error")!.textContent).toBe("Revisa el email");
    dialog.close();
    document.querySelector<HTMLAnchorElement>('a[href="#unete"]')!.click();
    expect(input("started").value).toBe(started);
    expect(input("name").value).toBe(answers.name);
  });
  it("does not steal focus when a response arrives after closing", async () => {
    fill();
    let reject!: (reason: unknown) => void;
    fetchMock.mockReturnValue(new Promise((_, r) => { reject = r; }));
    submit(); dialog.close();
    const link = document.querySelector<HTMLAnchorElement>('a[href="#unete"]')!;
    link.focus(); reject(new Error("Connection lost")); await flush();
    expect(document.activeElement).toBe(link);
    expect(document.getElementById("community-status")!.textContent).toContain("más de una vez");
    expect(document.body.style.overflow).toBe("");
  });
});
