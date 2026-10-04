/** Keep the fill timer on the server's clock, independent of the visitor's wall clock. */
export function createSubmissionClock(serverRenderedAt: number, monotonicNow: () => number): () => string {
  const startedAt = monotonicNow();
  return () => String(Math.floor(serverRenderedAt + monotonicNow() - startedAt));
}

/** Third-party widget failures must never interrupt restoring the form's controls. */
export function resetCaptchaWidget(
  widget: HTMLElement | null,
  api: { reset: (container: HTMLElement) => void } | undefined,
): boolean {
  if (!widget) return true;
  if (!api) return false;
  try {
    api.reset(widget);
    return true;
  } catch {
    return false;
  }
}
