import mixpanel from "mixpanel-browser";

const token = import.meta.env.PUBLIC_MIXPANEL_TOKEN;
let started = false;

export const isAnalyticsConfigured = Boolean(token);

export function startAnalytics(): boolean {
  if (!token) return false;
  if (!started) {
    mixpanel.init(token, {
      autocapture: true,
      record_mask_all_inputs: true,
      record_sessions_percent: 100,
    });
    started = true;
  }
  return true;
}

export function track(event: string, properties: Record<string, string | number | boolean>): void {
  if (started) mixpanel.track(event, properties);
}

startAnalytics();
