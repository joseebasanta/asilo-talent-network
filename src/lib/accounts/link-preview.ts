/**
 * Links inside an announcement: detection, safe linkifying and the preview card.
 *
 * Frontend-only stage: `mockPreview` fakes what the server will do (read the
 * page and extract title, description, image and favicon, the same extractor
 * as the project form's "Autocompletar"). Failing to read a page never blocks
 * publishing: the announcement just has no card.
 */

export type LinkPreview = {
  url: string;
  host: string;
  title: string;
  description: string;
  /** Simulated until the backend reads the real page. */
  simulated: true;
};

export type Segment = { type: "text"; value: string } | { type: "link"; value: string; href: string };

// `example` is only here so the demo data (panapay.example) behaves like real sites.
const TLDS = "com|net|org|io|app|co|ve|dev|ai|es|xyz|me|tech|info|us|mx|ar|cl|pe|br|example";
// http(s) links, www. links, or bare domains with a common TLD (so "Hola.Gracias" is not a link).
const URL_RE = new RegExp(
  String.raw`(?:https?:\/\/[^\s<>"']+|www\.[^\s<>"']+|\b[a-z0-9][a-z0-9-]*(?:\.[a-z0-9-]+)*\.(?:${TLDS})\b(?:\/[^\s<>"']*)?)`,
  "gi",
);
const TRAILING = /[.,;:!?)\]}»”]+$/;

function toHref(raw: string): string | null {
  const href = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  try {
    const u = new URL(href);
    return (u.protocol === "http:" || u.protocol === "https:") && u.hostname.includes(".") ? u.href : null;
  } catch {
    return null;
  }
}

/** Splits text into plain and link segments. Link text is shown as typed. */
export function segments(text: string): Segment[] {
  const out: Segment[] = [];
  let last = 0;
  for (const match of text.matchAll(URL_RE)) {
    const start = match.index ?? 0;
    // Skip the tail of an email address.
    if (start > 0 && text[start - 1] === "@") continue;
    const shown = match[0].replace(TRAILING, "");
    const href = toHref(shown);
    if (!href) continue;
    if (start > last) out.push({ type: "text", value: text.slice(last, start) });
    out.push({ type: "link", value: shown, href });
    last = start + shown.length;
  }
  if (last < text.length) out.push({ type: "text", value: text.slice(last) });
  return out;
}

/** The first link in the text, normalized, or null. */
export function firstUrl(text: string): string | null {
  const link = segments(text).find((s): s is Extract<Segment, { type: "link" }> => s.type === "link");
  return link?.href ?? null;
}

export function mockPreview(url: string | null): LinkPreview | null {
  if (!url) return null;
  let host: string;
  try { host = new URL(url).hostname.replace(/^www\./, ""); } catch { return null; }
  // Same convention as the autofill demo: a host with "fallo" simulates an unreadable page.
  if (host.includes("fallo")) return null;
  const label = host.split(".")[0] ?? host;
  const name = label.charAt(0).toUpperCase() + label.slice(1);
  return { url, host, title: name, description: `Vista previa de ${host}`, simulated: true };
}

export function previewFor(text: string): LinkPreview | null {
  return mockPreview(firstUrl(text));
}
