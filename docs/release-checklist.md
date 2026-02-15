# Release Checklist

1. Run syntax checks: `node --check js/main.js js/auth.js js/esqr.js`.
2. Run link checks: `python3 scripts/check_links.py`.
3. Run accessibility checks: `python3 scripts/check_accessibility.py`.
4. Validate role-restricted pages (`admin.html`, `telemetry.html`) with reviewer/admin and learner accounts.
5. Verify checkout and post-purchase certificate route behavior.
6. Verify ESQ-R export/share (PNG/PDF/share file) behavior.
7. Confirm canonical tags and sitemap include any new pages.
8. Confirm `netlify.toml` security headers are present.
9. Update `CHANGELOG.md` with release notes.
10. Smoke-test in dark mode and mobile navigation.
11. Run consolidated gate: `python3 scripts/release_gate.py`.
12. Confirm `further-sources.html` and `Further Sources` are updated for any new citation additions.
