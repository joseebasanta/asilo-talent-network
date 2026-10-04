import { LOGO_MAX_BYTES } from "./projects-logo";

// Logo plus bounded multipart headers and text. Enforce actual bytes even without Content-Length.
export const MAX_SUBMISSION_BYTES = LOGO_MAX_BYTES + 64 * 1024;
export async function readSubmissionForm(request: Request): Promise<FormData> {
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("multipart/form-data;")) {
    throw new Error("unsupported-content-type");
  }
  const length = Number(request.headers.get("content-length"));
  if (length > MAX_SUBMISSION_BYTES) throw new Error("body-too-large");
  const reader = request.body?.getReader();
  if (!reader) throw new Error("missing-body");
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_SUBMISSION_BYTES) {
        await reader.cancel();
        throw new Error("body-too-large");
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  return new Response(Buffer.concat(chunks), { headers: { "content-type": request.headers.get("content-type")! } }).formData();
}
