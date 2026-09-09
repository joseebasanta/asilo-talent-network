import { describe, expect, it } from "vitest";
import { MAX_SUBMISSION_BYTES, readSubmissionForm } from "../src/lib/submission-body";

describe("bounded submission body", () => {
  it("reads valid multipart data", async () => {
    const form = new FormData();
    form.set("nombre", "Pana Pay");
    const result = await readSubmissionForm(new Request("https://example.com", { method: "POST", body: form }));
    expect(result.get("nombre")).toBe("Pana Pay");
  });
  it("rejects excessive actual bytes without relying on Content-Length", async () => {
    const request = new Request("https://example.com", {
      method: "POST", body: new Uint8Array(MAX_SUBMISSION_BYTES + 1),
      headers: { "content-type": "multipart/form-data; boundary=test" },
    });
    expect(request.headers.has("content-length")).toBe(false);
    await expect(readSubmissionForm(request)).rejects.toThrow("body-too-large");
  });
  it("rejects wrong content types and malformed multipart bodies", async () => {
    await expect(readSubmissionForm(new Request("https://example.com", { method: "POST", body: "{}" })))
      .rejects.toThrow("unsupported-content-type");
    await expect(readSubmissionForm(new Request("https://example.com", { method: "POST", body: "broken", headers: {
      "content-type": "multipart/form-data; boundary=test",
    } }))).rejects.toThrow();
  });
});
