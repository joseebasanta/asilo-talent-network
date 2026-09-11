import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { BUILDERS_TTL_MS, countBuilders, FALLBACK_BUILDERS_COUNT, loadBuildersCount, resetBuildersCache } from "../src/lib/builders-loader";

beforeEach(() => {
  resetBuildersCache();
  vi.stubEnv("GOOGLE_SHEETS_ID", "test-sheet");
  vi.stubEnv("GOOGLE_SERVICE_ACCOUNT_JSON_BASE64", "test-key");
  vi.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("Builders count", () => {
  it("counts populated member cells and ignores blank rows", () => {
    expect(countBuilders([["Ana"], [], [" "], ["Luis"], ["", "note"]])).toBe(2);
    expect(countBuilders([])).toBe(0);
  });

  it("caches reads, refreshes after ten minutes and keeps the last count on failure", async () => {
    const now = vi.spyOn(Date, "now").mockReturnValue(0);
    const fetcher = vi.fn().mockResolvedValue([["Ana"], ["Luis"]]);
    expect(await loadBuildersCount(fetcher)).toBe(2);
    expect(await loadBuildersCount(fetcher)).toBe(2);
    expect(fetcher).toHaveBeenCalledTimes(1);
    now.mockReturnValue(BUILDERS_TTL_MS);
    fetcher.mockResolvedValueOnce([]);
    expect(await loadBuildersCount(fetcher)).toBe(0);
    now.mockReturnValue(BUILDERS_TTL_MS * 2);
    fetcher.mockRejectedValueOnce(new Error("unavailable"));
    expect(await loadBuildersCount(fetcher)).toBe(0);
  });

  it("uses the fallback count when unconfigured or the first read fails", async () => {
    const fetcher = vi.fn().mockRejectedValue(new Error("unavailable"));
    expect(await loadBuildersCount(fetcher)).toBe(FALLBACK_BUILDERS_COUNT);
    vi.stubEnv("GOOGLE_SERVICE_ACCOUNT_JSON_BASE64", "");
    fetcher.mockClear();
    expect(await loadBuildersCount(fetcher)).toBe(FALLBACK_BUILDERS_COUNT);
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("waits ten minutes before retrying a failed read", async () => {
    const now = vi.spyOn(Date, "now").mockReturnValue(0);
    const fetcher = vi.fn().mockRejectedValueOnce(new Error("unavailable"));
    expect(await loadBuildersCount(fetcher)).toBe(FALLBACK_BUILDERS_COUNT);
    now.mockReturnValue(BUILDERS_TTL_MS - 1);
    expect(await loadBuildersCount(fetcher)).toBe(FALLBACK_BUILDERS_COUNT);
    expect(fetcher).toHaveBeenCalledTimes(1);
    now.mockReturnValue(BUILDERS_TTL_MS);
    fetcher.mockResolvedValueOnce([["Ana"]]);
    expect(await loadBuildersCount(fetcher)).toBe(1);
    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  it("shares simultaneous reads", async () => {
    const fetcher = vi.fn().mockResolvedValue([["Ana"]]);
    expect(await Promise.all([loadBuildersCount(fetcher), loadBuildersCount(fetcher)])).toEqual([1, 1]);
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
});
