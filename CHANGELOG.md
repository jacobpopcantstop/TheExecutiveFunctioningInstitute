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

### Changed
- Authentication password handling upgraded to PBKDF2 (`crypto.subtle`) with migration from legacy hashes.
- Login/register handlers updated to async auth calls.
- Expanded canonical URL coverage and sitemap route coverage.
- Canonical tags and sitemap URLs normalized to `https://executivefunctioninginstitute.com`.
- Added `EducationalOrganization` + `Course` JSON-LD markup on curriculum and certification pages.
- Added source-hub checks into the consolidated release gate.
