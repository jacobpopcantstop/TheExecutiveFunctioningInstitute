# Release Checklist

Canonical outstanding roadmap: `docs/roadmap-to-perfection.md`

1. Run consolidated gate: `python3 scripts/release_gate.py`.
2. Confirm launch-blocker checks pass: `python3 scripts/check_launch_blockers.py`.
3. Validate role-restricted pages (`admin.html`, `telemetry.html`) with reviewer/admin and learner accounts.
4. Verify checkout and post-purchase certificate route behavior.
5. Verify ESQ-R export/share (PNG/PDF/share file) behavior.
6. Confirm canonical tags and sitemap include any new pages.
7. Confirm `netlify.toml` security headers are present.
8. Smoke-test in dark mode and mobile navigation.
9. Update `CHANGELOG.md` with release notes.
10. Confirm `further-sources.html` and `Further Sources` are updated for any new citation additions.
11. Validate API endpoints on deploy preview:
    - `/api/leads`
    - `/api/sign-download`
    - `/api/download-file`
    - `/api/track-event`
    - `/api/auth?action=config`
    - `/api/sync-progress?email=test@example.com`
    - `/api/verify`
    - `/api/submissions`
    - `/api/coach-directory`
    - `/api/ops-config` (privileged)
    - `/api/community-question` (POST)
12. In Netlify UI, verify environment values are set for:
    - `EFI_CRM_WEBHOOK_URL`, `EFI_ESP_WEBHOOK_URL`
    - `EFI_DOWNLOAD_SIGNING_SECRET`, `EFI_PURCHASE_SIGNING_SECRET`
    - `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
    - `STRIPE_WEBHOOK_SECRET`, `EFI_SUBMISSIONS_CRON_SECRET`
    - `GEMINI_API_KEY`
