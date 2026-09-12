// One refresh at a time, even when visibility changes repeatedly. No writes.
export const PROJECT_REFRESH_MS = 30_000;
export function startProjectRefresh(refresh: () => Promise<void>): () => void {
  let pending = false;
  let nextAttempt = Date.now() + PROJECT_REFRESH_MS;
  let failures = 0;
  const tick = async () => {
    if (pending || document.visibilityState !== "visible" || Date.now() < nextAttempt) return;
    const startedAt = Date.now();
    pending = true;
    try {
      await refresh();
      failures = 0;
    } catch {
      failures = Math.min(failures + 1, 4);
    } finally {
      pending = false;
      nextAttempt = (failures ? Date.now() : startedAt) + Math.min(PROJECT_REFRESH_MS * 2 ** failures, 300_000);
    }
  };
  const timer = window.setInterval(tick, PROJECT_REFRESH_MS);
  document.addEventListener("visibilitychange", tick);
  return () => {
    window.clearInterval(timer);
    document.removeEventListener("visibilitychange", tick);
  };
}
