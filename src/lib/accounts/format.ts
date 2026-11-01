/** Spanish relative time for the feed: "ahora", "hace 5 min", "hace 3 h", "hace 2 d", then the date. */
export function timeAgo(at: number, now = Date.now()): string {
  const diff = Math.max(0, now - at);
  const min = Math.floor(diff / 60_000);
  if (min < 1) return "ahora";
  if (min < 60) return `hace ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `hace ${h} h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `hace ${d} d`;
  return new Date(at).toLocaleDateString("es-VE", { day: "numeric", month: "short", year: d > 330 ? "numeric" : undefined });
}
