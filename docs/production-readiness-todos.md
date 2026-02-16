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
- ✅ Replace prototype localStorage lead capture with server/API integrations (ESP + CRM + consent logging).
- ✅ Replace placeholder download assets with working PDF assets and signed delivery links.
- Replace placeholder directory records with CMS-backed searchable profiles and moderation workflow.
- ✅ Add analytics event instrumentation for funnel steps (landing -> calculator -> signup -> enroll).
- Add production video hosting pipeline (storage, captions, bandwidth policy, fallback CDN logic).

## Wave 7: Further Sources Integration (This Pass)
1. ✅ Added canonical root source file: `Further Sources`.
2. ✅ Rebuilt `further-sources.html` as a citation hub mapped directly to the canonical source corpus.
3. ✅ Embedded high-priority Barkley segment videos from the cited list.
4. ✅ Added module-level citation blocks to Theory/Practice/Business landing pages.
5. ✅ Added source-hub validation script `scripts/check_source_hub.py`.
6. ✅ Enforced source-hub checks through `scripts/release_gate.py`.

## Wave 8: Deployment Integration and UX Hardening (This Pass)
1. ✅ Added server-backed Netlify API endpoints:
   `/api/leads`, `/api/sign-download`, `/api/download-file`, `/api/track-event`.
2. ✅ Rewired launch/funnel forms to API-based lead capture with explicit consent handling.
3. ✅ Implemented signed gated-download flow for lead magnets.
4. ✅ Added analytics transport (`EFI.Analytics`) and funnel event hooks.
5. ✅ Added PDF integrity validation script (`scripts/check_pdfs.py`) and enforced it in release gate.
6. ✅ Replaced invalid placeholder lead-magnet assets with functioning PDF files.
7. ✅ Applied UX fixes for fixed-nav overlap on plain pages and improved form interaction states.
8. ✅ Updated OpenAPI contract (`docs/api/openapi.yaml`) to reflect production funnel endpoints.

## Wave 8 Remaining
- Wire CRM/ESP webhook endpoints as environment variables in Netlify production (`EFI_CRM_WEBHOOK_URL`, `EFI_ESP_WEBHOOK_URL`).
- Rotate and set production signing secret (`EFI_DOWNLOAD_SIGNING_SECRET`) before launch.
- Add server-side persistence/storage for lead and analytics records (current delivery is webhook-first).
- 🔄 Implement CMS-backed directory management and moderation.
- 🔄 Add captions/transcripts and accessibility metadata for embedded video curriculum assets.

## Wave 9: UX and Asset Reliability Audit (This Pass)
1. ✅ Added sitewide UX audit script (`scripts/check_ux_audit.py`) and resolved flagged structural issues.
2. ✅ Achieved 100% structural UX baseline score in automated audit.
3. ✅ Added explicit labels/skip links on previously under-specified utility pages and verification flow.
4. ✅ Added PDF validity checks to release quality gates and validated all linked local PDFs.

## Wave 10: Commerce UX and Conversion Improvements (This Pass)
1. ✅ Updated store pricing to professional strategy and standardized sale pricing display.
2. ✅ Added persistent 40% off sale banner and floating store CTA sitewide.
3. ✅ Added automatic Store link injection to navigation where missing.
4. ✅ Enhanced cart/checkout display with struck MSRP + explicit savings visibility.
5. ✅ Improved store copy for confident, aspirational tone without aggressive sales language.
6. ✅ Added uptime probe workflow (`.github/workflows/uptime-check.yml`) for key production routes.

## Wave 11: Launch Blocker Mitigation + Guided UX (This Pass)
1. ✅ Replaced non-dismissible sale bar behavior with dismissible state persisted in browser storage.
2. ✅ Added server-signed purchase verification contract (`/api/verify`) and wired checkout issuance flow.
3. ✅ Added verification endpoint for signed credential checks and connected certificate/verify pages.
4. ✅ Added server progress sync API scaffold (`/api/sync-progress`) and auth sync hooks.
5. ✅ Added Stripe webhook ingestion scaffold (`/api/stripe-webhook`) with signature verification support.
6. ✅ Upgraded client telemetry to server transport (`/api/track-event`) while retaining local debug buffer.
7. ✅ Refactored ESQ-R to config-driven architecture (`data/esqr-config.json`) for SME-editable content.
8. ✅ Added lazy-loading for `html2canvas` and `jspdf` in ESQ-R export actions.
9. ✅ Added consented ESQ-R lead capture flow to `/api/leads` for email follow-up and offers.
10. ✅ Added `getting-started.html` guided onboarding path for parents, educators, and professionals.
11. ✅ Added 404 broken-link reporting action wired to analytics event stream.
12. ✅ Updated privacy policy from prototype language to production-aligned collection/processing disclosure.
13. ✅ Added release gate check to block `console.log`/`debugger` in production JS.

## Wave 12: Managed Auth + Durable Data + AI Review Delay (This Pass)
1. ✅ Added managed auth API (`/api/auth`) with Supabase integration hooks and frontend managed-session fallback logic.
2. ✅ Added durable data abstraction (`netlify/functions/_db.js`) with Supabase/Postgres-first behavior and memory fallback.
3. ✅ Rewired progress sync endpoint to durable data abstraction.
4. ✅ Rewired purchase verification to persist purchases and enforce verified Stripe intents in live mode.
5. ✅ Enhanced Stripe webhook ingestion to persist payment intent statuses for checkout verification.
6. ✅ Added AI rubric engine (`netlify/functions/_ai_rubric.js`) with Gemini caller and deterministic fallback grader.
7. ✅ Added submissions API (`/api/submissions`) for module/capstone grading with 24-hour delayed feedback release.
8. ✅ Added due-feedback notifier processing via webhook fanout for post-delay email workflows.
9. ✅ Converted dashboard submission messaging to asynchronous delayed-release behavior.
10. ✅ Added six unit tests (`tests/ai-rubric.test.mjs`) and enforced them in release gate.
11. ✅ Removed synchronous/video lecture marketing claims from key certification and curriculum-facing pages.

## Wave 13: Persistence + Async Processing Hardening (This Pass)
1. ✅ Added durable lead storage path in backend (`efi_leads` via Supabase with memory fallback).
2. ✅ Added durable analytics event storage path in backend (`efi_events` via Supabase with memory fallback).
3. ✅ Updated `/api/leads` and `/api/track-event` to persist first, then fanout to CRM/ESP hooks.
4. ✅ Added scheduled function `process-due-feedback` for 24-hour feedback release processing.
5. ✅ Added secret-gated protection for manual due-feedback processor invocation (`EFI_SUBMISSIONS_CRON_SECRET`).
6. ✅ Removed client-side auto-trigger of grading processor to enforce server-side release control.
7. ✅ Updated legal terms language to production-ready contract framing (removed prototype disclaimer).
8. ✅ Added explicit video accessibility note/caption guidance on Further Sources embed hub.

## Wave 14: Guided Onboarding + Standards Visibility (This Pass)
1. ✅ Added standards-pack links directly into `getting-started.html` onboarding checklist.
2. ✅ Added dedicated transparency callout on getting-started with rubric/crosswalk downloads.
3. ✅ Added linear four-step guided route section to `index.html` to reduce circular navigation.
4. ✅ Updated getting-started conversion copy to reflect current paid model (graded review, credentialing, alumni network).
5. ✅ Expanded `further-sources.html` with explicit caption/transcript review guidance for external video references.

## Wave 15: Directory Operations Scaffold (This Pass)
1. ✅ Rebuilt `coach-directory.html` as a data-driven directory experience with role-relevant filters.
2. ✅ Added structured coach dataset (`data/coach-directory.json`) with verification/moderation fields.
3. ✅ Added public-listing gating logic in `js/coach-directory.js` (only verified + approved records render).
4. ✅ Added listing-governance copy clarifying moderation and credential checks for trust/compliance posture.
5. ✅ Added profile-update and credential-verification links to support correction workflows.

## Wave 16: Trust + Pedagogy Deployment Tightening (This Pass)
1. ✅ Added founder/leadership transparency block in `about.html` with direct contact details.
2. ✅ Added explicit "curriculum free vs certification earned" positioning in `index.html` hero.
3. ✅ Added role-specific "Parent Start Path" and "Professional Start Path" links in homepage hero.
4. ✅ Added Barkley inhibition flow diagram embed in `module-1.html`.
5. ✅ Added "When to use Barkley vs Brown" coaching guidance block in `module-1.html`.
6. ✅ Added pre-submission pass criteria accordion for Module 1 assignment grading transparency.
7. ✅ Updated Module 1 CTA to linear progression (`Start Module 2`) instead of circular return.
8. ✅ Added launch kit preview artifact (`images/launch-kit-preview.svg`) and file inventory section in `curriculum.html`.
9. ✅ Added explicit accreditation status block with current date in `certification.html`.
10. ✅ Added "Last updated" stamp to `accreditation.html` header/footer.

## Wave 17: Directory Moderation Backend (This Pass)
1. ✅ Added server authz helper (`netlify/functions/_authz.js`) for reviewer/admin checks via Supabase bearer token or admin key.
2. ✅ Added API endpoint `netlify/functions/coach-directory.js` with public listing fetch and privileged moderation actions.
3. ✅ Extended durable storage layer (`netlify/functions/_db.js`) with directory listing, upsert, and moderation methods.
4. ✅ Updated public directory UI (`js/coach-directory.js`) to consume `/api/coach-directory` with JSON fallback.
5. ✅ Added admin moderation queue UI and approve/reject actions (`admin.html`, `js/admin-directory.js`).
6. ✅ Updated Supabase schema docs with `efi_coach_directory` table and indexes (`docs/supabase-schema.sql`).
7. ✅ Updated OpenAPI contract with `/coach-directory` endpoint (`docs/api/openapi.yaml`).

## Wave 18: Directory Submission + Review History UX (This Pass)
1. ✅ Added public "Apply For Directory Listing" form on `coach-directory.html`.
2. ✅ Wired listing submission form to `/api/coach-directory` (`action=submit_listing`) in `js/coach-directory.js`.
3. ✅ Added moderation note input per pending record in admin queue (`admin.html`, `js/admin-directory.js`).
4. ✅ Added "Recent Directory Decisions" history table in admin with reviewer, timestamp, and notes.
5. ✅ Updated moderation actions to persist custom notes entered by reviewer before approve/reject.

## Wave 19: Directory Hardening + Ops Controls (This Pass)
1. ✅ Fixed directory record persistence bug by storing applicant `email` in backend records.
2. ✅ Added backend listing update path (`action=update_listing`) for privileged reviewer/admin edits.
3. ✅ Added backend email status lookup (`GET /api/coach-directory?email=...`) for applicant self-check.
4. ✅ Added anti-bot honeypot validation on listing submissions (`company` must be empty).
5. ✅ Added submission rate limiting by IP and email in directory API.
6. ✅ Added strict state/ZIP format validation in directory API.
7. ✅ Added duplicate pending-request prevention per applicant/specialty/location.
8. ✅ Added admin "Edit" action for pending listings (name/location/specialty quick correction).
9. ✅ Added public listing status checker UI on `coach-directory.html`.
10. ✅ Added directory summary stats surface from API and UI display (`#dir-stats`).
