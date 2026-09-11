import { Window } from "happy-dom";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { createDialogMotion } from "../src/lib/dialog-motion";

let dialog: HTMLDialogElement;
let opener: HTMLButtonElement;
let motion: ReturnType<typeof createDialogMotion>;
beforeEach(() => {
  const dom = new Window();
  vi.stubGlobal("window", dom);
  vi.stubGlobal("document", dom.document);
  vi.stubGlobal("Event", dom.Event);
  document.body.innerHTML = '<button>Open</button><dialog><input /></dialog>';
  document.body.style.overflow = "auto";
  dialog = document.querySelector("dialog")!;
  opener = document.querySelector("button")!;
  opener.focus();
  dialog.showModal = () => { dialog.open = true; };
  dialog.close = vi.fn(() => { dialog.open = false; dialog.dispatchEvent(new Event("close")); });
  motion = createDialogMotion(dialog);
});
afterEach(() => vi.unstubAllGlobals());

it("keeps the top layer and scroll lock until exit completes, then restores focus", async () => {
  let finish!: () => void;
  dialog.getAnimations = () => [{ finished: new Promise<void>(r => { finish = r; }) }] as unknown as Animation[];
  motion.open();
  dialog.querySelector("input")!.focus();
  const closing = motion.close();
  void motion.close();
  expect(dialog.open).toBe(true);
  expect(document.body.style.overflow).toBe("hidden");
  expect(dialog.hasAttribute("data-closing")).toBe(true);
  finish(); await closing;
  expect(dialog.close).toHaveBeenCalledTimes(1);
  expect(document.body.style.overflow).toBe("auto");
  expect(document.activeElement).toBe(opener);
});

it("handles cancelled animations and Escape through the same dismissal", async () => {
  dialog.getAnimations = () => [{ finished: Promise.reject(new Error("cancelled")) }] as unknown as Animation[];
  motion.open();
  const event = new window.Event("cancel", { cancelable: true });
  dialog.dispatchEvent(event);
  expect(event.defaultPrevented).toBe(true);
  await new Promise(resolve => setTimeout(resolve, 0));
  expect(dialog.open).toBe(false);
});

it("closes immediately with reduced motion", async () => {
  vi.spyOn(window, "matchMedia").mockReturnValue({ matches: true } as MediaQueryList);
  dialog.getAnimations = vi.fn();
  motion.open();
  const closing = motion.close();
  expect(dialog.open).toBe(false);
  expect(dialog.getAnimations).not.toHaveBeenCalled();
  await closing;
});

it("does not let a stale exit close a newly reopened dialog", async () => {
  let finish!: () => void;
  dialog.getAnimations = () => [{ finished: new Promise<void>(r => { finish = r; }) }] as unknown as Animation[];
  motion.open(); const closing = motion.close();
  dialog.close(); motion.open();
  finish(); await closing;
  expect(dialog.open).toBe(true);
  expect(document.body.style.overflow).toBe("hidden");
});
