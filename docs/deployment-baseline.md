# Deployment Baseline (Prototype to Production)

## 1) Environment
- Copy `.env.example` into environment-specific configuration.
- Set `BASE_URL`, `API_BASE_URL`, Stripe keys, and certificate signing secret.

## 2) CI gates
- Run local link checks on PR/push (`scripts/check_links.py`).
- Run external link checks on schedule (`--external`).

## 3) Static serving
- Local run: `scripts/serve.sh 4173`
- Production: serve built/static files behind CDN + HTTPS.

## 4) Security prerequisites
- Move auth/session/purchase/certification logic server-side.
- Enable signed certificate issuance and verification API.

## 5) Observability
- Client telemetry exists; wire transport to server log ingestion.
- Add uptime checks on key pages (`index`, `esqr`, `dashboard`, `verify`).

## Security Header Baseline
- Added `netlify.toml` with strict default headers (CSP, HSTS, XFO, XCTO, Referrer-Policy, Permissions-Policy).
- Keep `unsafe-inline` temporary until inline scripts are refactored into external files with nonce/hash strategy.

## QA Automation Additions
- Added static accessibility lint: `python3 scripts/check_accessibility.py`.
- Added GitHub Actions workflow `.github/workflows/accessibility-check.yml` to run accessibility checks on push/PR.
