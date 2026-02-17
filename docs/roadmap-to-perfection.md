# Roadmap to Perfection (Execution View)

Last updated: February 17, 2026

## Canonical Tracker
- This is the canonical active tracker for outstanding work.
- Historical implementation history is retained in `docs/production-readiness-todos.md`.
- Archived planning snapshots:
  - `docs/next-10-todos.md`
  - `docs/content-gap-audit.md`

## Resolved in Code
- ✅ CMS-backed directory operations (filters, moderation, archive, export).
- ✅ Directory audit and launch-config CSV exports in admin.
- ✅ Video metadata manifest + release-gated caption/transcript validation.
- ✅ Community hub expanded with recap archive + anonymous question intake.
- ✅ Certification transparency expanded with SLA ranges + sample passing outlines.
- ✅ Emoji/icon normalization pass applied to core conversion pages.
- ✅ Source-access reminders added to source-heavy modules.
- ✅ Free vs paid boundaries reinforced across curriculum/store/enroll.
- ✅ Privacy/terms updated with implementation-specific operational language.
- ✅ Launch-blocker script added (`scripts/check_launch_blockers.py`) and wired into release gate.
- ✅ Community recap intake now persists through API (`/api/community-question`) with rate limiting.

## Partially Resolved
- 🔄 Full icon normalization across every legacy utility page.
- 🔄 Production video CDN/storage policy (caption metadata is in place; infra policy still needs final provider settings).

## Requires Deployment/Operator Input (Cannot Be Fully Solved in Repo Alone)
- ⚠️ Set Netlify production env vars:
  - `EFI_CRM_WEBHOOK_URL`
  - `EFI_ESP_WEBHOOK_URL`
  - `EFI_DOWNLOAD_SIGNING_SECRET`
  - `EFI_PURCHASE_SIGNING_SECRET`
  - `EFI_SUBMISSIONS_CRON_SECRET`
- ⚠️ Confirm production webhook endpoints receive and persist external fanout payloads.
- ⚠️ Publish final jurisdiction/principal-office legal metadata if desired for stricter legal language.

## Acceptance Gate
- Run: `python3 scripts/release_gate.py`
- Expected: all checks pass (links, accessibility, PDFs, source hub, video pipeline, copy style, tests, sitemap/canonical, security headers).
