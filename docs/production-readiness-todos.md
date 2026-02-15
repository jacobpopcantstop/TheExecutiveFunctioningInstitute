# Implementation Roadmap: Production Readiness Tracker

## Wave 1 (Completed)
1. ✅ Auth RBAC scaffold (`getRole/hasRole/requireRole`).
2. ✅ Grading/certification workflow surfaced in dashboard.
3. 🔄 Payment verification hardening (server webhook pending).
4. ✅ Module citation panel across modules.
5. ✅ Automated local link validation in CI.
6. 🔄 Icon normalization across all pages.
7. ✅ ESQ-R snapshot durability in local history.
8. ✅ Certificate verification route (`verify.html`).
9. ✅ Client telemetry baseline (`EFI.Telemetry`).
10. ✅ Privacy/Terms pages and global legal footer links.

## Wave 2 (Completed/In Progress)
1. ✅ Prototype data export/import/reset tools.
2. ✅ Telemetry operations page.
3. ✅ Sitemap expansion for legal/ops pages.
4. ✅ Role hardening for ops surfaces.
5. 🔄 Server-backed certificate verification API.
6. 🔄 Server-backed ESQ-R storage.
7. ✅ Scheduled external link checks.
8. ✅ Canonical + JSON-LD phase 1.
9. 🔄 Accessibility automation (expanded in Wave 4).
10. ✅ Deployment baseline scaffolding (`.env.example`, `serve.sh`, `health.html`).

## Wave 4: 15 Deployment-Focused Items Executed in This Pass
1. ✅ Upgraded password hashing to PBKDF2 (`crypto.subtle`) with per-user salt.
2. ✅ Added transparent migration path for legacy password hashes.
3. ✅ Converted login/register flows to async auth calls.
4. ✅ Added role-gated reviewer/admin operations page (`admin.html`).
5. ✅ Added admin link rendering for reviewer/admin nav state.
6. ✅ Extended sitemap with `admin.html` route.
7. ✅ Expanded canonical tags across major HTML pages.
8. ✅ Added Netlify deployment config with security headers + CSP baseline.
9. ✅ Added static accessibility audit script (`scripts/check_accessibility.py`).
10. ✅ Added accessibility CI workflow (`.github/workflows/accessibility-check.yml`).
11. ✅ Added release checklist document (`docs/release-checklist.md`).
12. ✅ Added changelog scaffold (`CHANGELOG.md`).
13. ✅ Added OpenAPI draft contract (`docs/api/openapi.yaml`).
14. ✅ Added prototype data retention/backup policy (`docs/data-retention-policy.md`).
15. ✅ Updated deployment baseline doc with security + accessibility guidance.

## Next Sprint
- Implement server-backed auth/session APIs and payment webhook ingestion.
- Move certificate verification to signed server records.
- Add reviewer grading queue persistence and audit logs.

## Wave 5: Deployment Gate Hardening (Executed)
1. ✅ Normalized canonical domain references to `executivefunctioninginstitute.com` across all public routes.
2. ✅ Normalized sitemap to absolute production URLs for consistent SEO indexing.
3. ✅ Added single-command release gate (`python3 scripts/release_gate.py`) that runs syntax, local link, accessibility, canonical, sitemap, and Netlify header checks.
4. ✅ Added CI workflow (`.github/workflows/release-gate.yml`) to enforce deployment gates on push/PR.

## Wave 6: Strategic Market Intelligence Buildout (This Pass)
1. ✅ Added open curriculum pages:
   `module-a-neuroscience.html`, `module-b-pedagogy.html`, `module-c-interventions.html`.
2. ✅ Added video hosting/embed infrastructure blocks on free module pages.
3. ✅ Added pillar authority pages:
   `barkley-model-guide.html`, `brown-clusters-tool.html`, `ward-360-thinking.html`, `barkley-vs-brown.html`.
4. ✅ Added sales funnel pages/features:
   `teacher-to-coach.html` (with ROI calculator), `educator-launchpad.html` (prototype signup flow), `gap-analyzer.html`, `launch-plan.html` (download gates).
5. ✅ Added directory/community/trust pages:
   `coach-directory.html`, `community.html`, `scope-of-practice.html`, `accreditation.html`.
6. ✅ Added sitewide Theory/Practice/Business cluster navigation injection in `js/main.js`.
7. ✅ Added schema markup (`Course` + `EducationalOrganization`) on `curriculum.html` and `certification.html`.
8. ✅ Expanded sitemap coverage to include all newly added routes.

## Wave 6 Remaining (Next Integration Sprint)
- Replace prototype localStorage lead capture with server/API integrations (ESP + CRM + consent logging).
- Replace placeholder download assets with final branded PDFs and signed delivery links.
- Replace placeholder directory records with CMS-backed searchable profiles and moderation workflow.
- Add analytics event instrumentation for funnel steps (landing -> calculator -> signup -> enroll).
- Add production video hosting pipeline (storage, captions, bandwidth policy, fallback CDN logic).

## Wave 7: Further Sources Integration (This Pass)
1. ✅ Added canonical root source file: `Further Sources`.
2. ✅ Rebuilt `further-sources.html` as a citation hub mapped directly to the canonical source corpus.
3. ✅ Embedded high-priority Barkley segment videos from the cited list.
4. ✅ Added module-level citation blocks to Theory/Practice/Business landing pages.
5. ✅ Added source-hub validation script `scripts/check_source_hub.py`.
6. ✅ Enforced source-hub checks through `scripts/release_gate.py`.
