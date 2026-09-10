# Asilo Builders membership applications

Every “Únete” / “Llenar formulario” CTA opens the membership dialog. The project submission form remains separate. Applications are saved privately through `POST /api/community/submit`.

## Connect a new spreadsheet

1. Create a **new Google spreadsheet**, separate from the project directory and the original Google Form's responses. Name its first tab `Builders`.
2. Paste this header row into A1 (tab-separated):

```text
Fecha	Email	Nombre y apellido	Ciudad, país	WhatsApp	LinkedIn	Rol	Nombre del proyecto	Descripción	Estado
```

3. Share this new spreadsheet as **Editor** with the service account represented by the existing server-only `GOOGLE_SERVICE_ACCOUNT_JSON_BASE64`. The Google Sheets API must be enabled for that account's Google Cloud project.
4. Set server-only `GOOGLE_COMMUNITY_SHEETS_ID` to the ID between `/d/` and `/edit` in the new spreadsheet URL. Keep `GOOGLE_SHEETS_ID` pointing to the project directory. The membership endpoint rejects identical IDs.
5. Restart the server after setting local environment variables; supply the same variable in the production runtime before releasing.
6. Submit a sample application and confirm one row appears in `Builders`, with all eight form fields, an ISO timestamp and `PENDIENTE`. Confirm the project directory spreadsheet is untouched, then delete the sample row.

No spreadsheet has been created by this code change. Until the separate spreadsheet ID and credentials are configured, the endpoint returns an honest unavailable message and never reports a saved application. Credentials and responses are never exposed in client bundles or the public directory.

The endpoint validates required fields, LinkedIn URLs and international phone numbers, stores user input with Sheets `RAW` mode, bounds request bodies, and includes a honeypot, minimum fill time and five-attempt/10-minute per-IP limit. The rate limit is per server process, not shared across instances. Client timestamps are only an abuse signal. Network retries are not deduplicated; check for repeated email addresses when reviewing applications.

## Adversarial review follow-up

The independent review found and the implementation now fixes:

- WhatsApp values such as `+1------` passing validation: require 7–15 actual digits.
- Client wall-clock differences rejecting valid submissions: use the server-rendered timestamp plus monotonic elapsed time; reopening preserves the original fill timer and draft.
- An omitted optional description being rejected by the endpoint: default it to an empty string.
- Repeated or non-decimal timing fields: reject malformed values before writing.
- Native form fallback using GET: explicitly use multipart POST so contact details do not enter the URL.
- Late network responses moving focus after the dialog closes: focus feedback only while the dialog is open.

**Open correctness issue:** the Sheets append operation is not idempotent. Concurrent requests or retries after a response is lost can create duplicate rows. Disabling the browser submit button only prevents double-clicks in that page. A read-before-append check would still race across server instances. Strong prevention requires a durable submission identifier with atomic uniqueness and a reliable export/reconciliation process to Sheets. The application does not claim exactly-once storage; failure messages explain that saving could have succeeded.

Review verification includes adversarial endpoint tests for duplicate fields, file values in text fields, phone punctuation, future/malformed timestamps, optional descriptions, honeypots and concurrent per-process rate limiting. Browser checks confirm opening, Escape/focus restoration, and preservation of the draft and fill timestamp on reopening. Real Google Sheets writes remain unverified until a separate spreadsheet is configured.
