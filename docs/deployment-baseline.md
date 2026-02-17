# Deployment Baseline (Prototype to Production)

## 1) Environment
- Copy `.env.example` into environment-specific configuration.
- Set `BASE_URL`, `API_BASE_URL`, Stripe keys, certificate signing secret.
- Set funnel API secrets: `EFI_DOWNLOAD_SIGNING_SECRET`, `EFI_CRM_WEBHOOK_URL`, `EFI_ESP_WEBHOOK_URL`.
- Set async feedback processor secret: `EFI_SUBMISSIONS_CRON_SECRET`.

## 2) CI gates
- Run local link checks on PR/push (`scripts/check_links.py`).
- Run external link checks on schedule (`--external`).

## 3) Static serving
- Local run: `scripts/serve.sh 4173`
- Production: serve built/static files behind CDN + HTTPS.

## 4) Security prerequisites
- Auth/session/purchase/certification logic is server-backed through Netlify Functions + Supabase storage.
- Signed certificate issuance and verification API is enabled (`/api/verify`).

## 5) Observability
- Client telemetry + funnel analytics transport exists (`/api/track-event`); wire webhook targets to CRM/analytics ingestion.
- Add uptime checks on key pages (`index`, `esqr`, `dashboard`, `verify`).
- For delayed grading release, run the scheduled function `process-due-feedback` (every 30 minutes) or trigger securely with `x-efi-cron-secret`.
- Use `/api/ops-config` (privileged) on deployed environments to verify launch-critical env vars.

## 6) Lead Magnets + Signed Delivery
- Lead forms now post to `/api/leads` with consent required.
- Download gates now request signed URLs via `/api/sign-download` and resolve through `/api/download-file`.
- Rotate signing secret before production cutover and set short expiry windows.

## 7) Community + Directory Operations
- Community recap intake endpoint: `/api/community-question` (anonymous question capture with rate limiting).
- Directory CMS endpoint: `/api/coach-directory` with privileged moderation/edit/archive + CSV export support.

## Security Header Baseline
- Added `netlify.toml` with strict default headers (CSP, HSTS, XFO, XCTO, Referrer-Policy, Permissions-Policy).
- Keep `unsafe-inline` temporary until inline scripts are refactored into external files with nonce/hash strategy.

## QA Automation Additions
- Added static accessibility lint: `python3 scripts/check_accessibility.py`.
- Added GitHub Actions workflow `.github/workflows/accessibility-check.yml` to run accessibility checks on push/PR.
- Added PDF integrity checks: `python3 scripts/check_pdfs.py`.
- Added source-hub integration checks: `python3 scripts/check_source_hub.py`.
