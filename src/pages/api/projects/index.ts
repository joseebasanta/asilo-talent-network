import type { APIRoute } from "astro";
import { loadApprovedProjects } from "../../../lib/projects-loader";

export const prerender = false;

const RATE_MAX = 60;
const RATE_WINDOW_MS = 60_000;

// ponytail: per-instance bucket; move to Redis when the app runs multiple instances.
const ipHits = new Map<string, number[]>();

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const hits = (ipHits.get(ip) ?? []).filter((at) => now - at < RATE_WINDOW_MS);
  if (hits.length >= RATE_MAX) {
    ipHits.set(ip, hits);
    return true;
  }
  hits.push(now);
  ipHits.set(ip, hits);
  return false;
}

// Public read-only feed for the directory's 30-second refresh. It only returns
// projects explicitly approved by the server-side Sheet loader.
export const GET: APIRoute = async ({ clientAddress }) => {
  if (rateLimited(clientAddress ?? "unknown")) {
    return new Response(JSON.stringify({ error: "Demasiadas solicitudes." }), {
      status: 429,
      headers: {
        "content-type": "application/json; charset=utf-8",
        "cache-control": "no-store",
        "retry-after": "60",
      },
    });
  }

  const projects = await loadApprovedProjects(undefined, { fresh: true });
  return new Response(JSON.stringify({ projects }), {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "public, max-age=15, s-maxage=15, stale-while-revalidate=30",
    },
  });
};
