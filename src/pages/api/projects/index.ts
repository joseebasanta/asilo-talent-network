import type { APIRoute } from "astro";
import { loadDirectory, resolveSort } from "../../../lib/directory";
import { json } from "../../../lib/http";
import { createRateLimiter } from "../../../lib/rate-limit";

export const prerender = false;

const limited = createRateLimiter(60, 60_000);

// Public read-only feed (`?orden=populares|recientes|az|za`). Served from the
// loader's 60 s cache: bypassing it would spend one Sheets read per request
// and exhaust the service-account quota (~60 reads/min) with a few visitors.
export const GET: APIRoute = async ({ clientAddress, url }) => {
  if (limited(clientAddress ?? "unknown")) {
    return json({ error: "Demasiadas solicitudes." }, 429, {
      "cache-control": "no-store",
      "retry-after": "60",
    });
  }

  const projects = await loadDirectory(resolveSort(url?.searchParams.get("orden")));
  return json({ projects }, 200, {
    "cache-control": "no-store",
  });
};
