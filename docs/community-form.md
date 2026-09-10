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
