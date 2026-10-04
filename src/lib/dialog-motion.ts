/** Keep the native focus trap/top layer until the exit animation has finished. */
export function createDialogMotion(dialog: HTMLDialogElement) {
  let closing = false;
  let previousOverflow = "";
  let opener: HTMLElement | null = null;
  let revision = 0;

  function open() {
    if (dialog.open) return;
    revision++;
    closing = false;
    delete dialog.dataset.closing;
    opener = document.activeElement as HTMLElement | null;
    previousOverflow = document.body.style.overflow;
    dialog.showModal();
    document.body.style.overflow = "hidden";
  }

  async function close() {
    if (!dialog.open || closing) return;
    closing = true;
    const current = revision;
    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      dialog.dataset.closing = "";
      // Reading animations flushes the new CSS state; unsupported browsers close immediately.
      const animations = dialog.getAnimations?.() ?? [];
      await Promise.allSettled(animations.map(animation => animation.finished));
    }
    if (current === revision && dialog.open) dialog.close();
  }

  // Dismiss only through explicit form controls, never Escape/platform close requests.
  dialog.addEventListener("cancel", event => { event.preventDefault(); });
  dialog.addEventListener("close", () => {
    revision++;
    closing = false;
    delete dialog.dataset.closing;
    document.body.style.overflow = previousOverflow;
    if (opener?.isConnected) opener.focus({ preventScroll: true });
  });
  return { open, close };
}
