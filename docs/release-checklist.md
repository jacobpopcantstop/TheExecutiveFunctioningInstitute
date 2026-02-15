# Release Checklist

1. Run syntax checks: `node --check js/main.js js/auth.js js/esqr.js`.
2. Run link checks: `python3 scripts/check_links.py`.
3. Run accessibility checks: `python3 scripts/check_accessibility.py`.
4. Run PDF integrity checks: `python3 scripts/check_pdfs.py`.
5. Run UX audit checks: `python3 scripts/check_ux_audit.py`.
6. Validate role-restricted pages (`admin.html`, `telemetry.html`) with reviewer/admin and learner accounts.
7. Verify checkout and post-purchase certificate route behavior.
8. Verify ESQ-R export/share (PNG/PDF/share file) behavior.
9. Confirm canonical tags and sitemap include any new pages.
10. Confirm `netlify.toml` security headers are present.
11. Update `CHANGELOG.md` with release notes.
12. Smoke-test in dark mode and mobile navigation.
13. Run consolidated gate: `python3 scripts/release_gate.py`.
14. Confirm `further-sources.html` and `Further Sources` are updated for any new citation additions.
15. Validate API endpoints on deploy preview: `/api/leads`, `/api/sign-download`, `/api/download-file`, `/api/track-event`.
