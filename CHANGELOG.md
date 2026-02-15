# Changelog

## Unreleased

### Added
- Reviewer/Admin operations page (`admin.html`) with role-gated access.
- Static accessibility checker and CI workflow.
- Netlify deployment headers/CSP baseline.
- Release checklist and API contract starter docs.
- Consolidated deployment gate script (`scripts/release_gate.py`) and CI workflow (`.github/workflows/release-gate.yml`).
- Strategic market-intelligence content pages: `module-a-neuroscience.html`, `module-b-pedagogy.html`, `module-c-interventions.html`, `barkley-model-guide.html`, `brown-clusters-tool.html`, `ward-360-thinking.html`, `barkley-vs-brown.html`.
- Funnel and business pages/features: `teacher-to-coach.html` (ROI calculator), `educator-launchpad.html` (email-course prototype flow), `gap-analyzer.html`, `launch-plan.html` (download gates).
- Directory/community/trust pages: `coach-directory.html`, `community.html`, `scope-of-practice.html`, `accreditation.html`.
- Sitewide Theory/Practice/Business cluster navigation injection in `js/main.js`.
- Placeholder lead magnet assets in `docs/assets/`.
- Canonical `Further Sources` file + `further-sources.html` citation hub with module-mapped bibliography and embedded Barkley segment videos.
- Source integration validation script `scripts/check_source_hub.py`.
- Netlify Functions backend for deployment flows: `/api/leads`, `/api/sign-download`, `/api/download-file`, `/api/track-event`.
- Server-backed lead capture and signed PDF gate flows on `educator-launchpad.html`, `gap-analyzer.html`, and `launch-plan.html`.
- PDF integrity validation script `scripts/check_pdfs.py`.
- UX audit script `scripts/check_ux_audit.py` and utility-page UX fixes (skip links, labels, form semantics).
- Commerce upgrade pass: updated professional pricing, persistent 40% sale UI, and stronger store access across pages.
- Uptime probe workflow for production routes (`.github/workflows/uptime-check.yml`).

### Changed
- Authentication password handling upgraded to PBKDF2 (`crypto.subtle`) with migration from legacy hashes.
- Login/register handlers updated to async auth calls.
- Expanded canonical URL coverage and sitemap route coverage.
- Canonical tags and sitemap URLs normalized to `https://executivefunctioninginstitute.com`.
- Added `EducationalOrganization` + `Course` JSON-LD markup on curriculum and certification pages.
- Added source-hub checks into the consolidated release gate.
- Added PDF integrity checks into the consolidated release gate.
- Updated deployment environment template and baseline docs for webhook/signing configuration.
- Added roadmap and checklist updates for API validation and UX audit quality gates.
- Fixed dark-mode token issue causing black-on-black text in specific contexts.
