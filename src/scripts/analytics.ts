type Properties = Record<string, string | number | boolean>;
type Mixpanel = (typeof import("mixpanel-browser"))["default"];

const token = import.meta.env.PUBLIC_MIXPANEL_TOKEN;
const MAX_QUEUED = 50;
let client: Mixpanel | undefined;
let loading = false;
let failed = false;
const queue: Array<[string, Properties]> = [];

export const isAnalyticsConfigured = Boolean(token);

// Mixpanel (with Session Replay) is the heaviest script on the site, so it loads
// after the page is idle instead of competing with first paint.
export function startAnalytics(): boolean {
  if (!token) return false;
  if (!loading) {
    loading = true;
    import("mixpanel-browser")
      .then(({ default: mixpanel }) => {
        mixpanel.init(token, {
          autocapture: true,
          record_mask_all_inputs: true,
          record_sessions_percent: 100,
        });
        client = mixpanel;
        for (const [event, properties] of queue.splice(0)) mixpanel.track(event, properties);
      })
      .catch(() => {
        // Keep `loading` set so a blocked chunk isn't retried on every track().
        failed = true;
        queue.length = 0;
      });
  }
  return true;
}

// Events fired before Mixpanel finishes loading are queued and replayed in order.
export function track(event: string, properties: Properties): void {
  if (!token || failed) return;
  if (client) client.track(event, properties);
  else if (queue.length < MAX_QUEUED) queue.push([event, properties]);
  startAnalytics();
}

if (token && typeof window !== "undefined") {
  const startWhenIdle = () => {
    if ("requestIdleCallback" in window) window.requestIdleCallback(() => startAnalytics(), { timeout: 4000 });
    else setTimeout(startAnalytics, 2000);
  };
  if (document.readyState === "complete") startWhenIdle();
  else window.addEventListener("load", startWhenIdle, { once: true });
}
