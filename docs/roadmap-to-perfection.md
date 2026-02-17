# Roadmap to Perfection: Comprehensive Audit & Deliverable Plan

**Audit Date:** 2026-02-16
**Audited By:** Claude (Opus 4.6) — Full-stack codebase review
**Scope:** 45 HTML pages, 20 JS modules, 15 Netlify functions, 7 CI scripts, all documentation

---

## Executive Summary

The Executive Functioning Institute site is a **well-architected educational platform** built with vanilla HTML/CSS/JS on a Netlify serverless backend with Supabase persistence. Across 18 development waves, the project has achieved solid foundational coverage: 45 content pages, 10 API endpoints, CI/CD quality gates, RBAC, AI-powered grading, Stripe integration scaffolding, and a coach directory with moderation.

**Current maturity: ~80% production-ready.**

**Decision (2026-02-17): Paid services deferred.** Store, enrollment, and checkout pages converted to "Coming Soon" with interest capture form. Stripe integration, payment flows, and checkout UX are postponed to a future deployment. The interest form routes through the existing `/api/leads` endpoint to collect demand signals before building payment infrastructure.

This roadmap identifies deliverables across **6 phases**, prioritized by impact and dependency order. Each phase is designed to be independently shippable.

---

## Scoring Summary

| Domain | Score | Notes |
|--------|-------|-------|
| Content & Copy | 8.5/10 | Strong; thin in community/pedagogy modules |
| HTML & Accessibility | 9/10 | Skip links, landmarks, alt text all present |
| CSS & Design System | 9/10 | Clean single-file system with dark mode |
| Navigation & UX | 9/10 | Consistent across 45 pages |
| SEO & Meta | 8/10 | Missing descriptions on 5 pages |
| JavaScript (Frontend) | 7/10 | XSS via innerHTML, 4 disabled features |
| Backend (Netlify Functions) | 7/10 | Missing auth on data endpoints, silent errors |
| Security | 6/10 | Hardcoded fallback secrets, XSS, weak legacy hash |
| Stripe / Payments | 5/10 | Scaffold only; not production-enforced |
| AI Grading | 6/10 | Fallback is fake scoring; no audit trail |
| Test Coverage | 3/10 | 6 unit tests total; <5% coverage |
| Ops & Monitoring | 7/10 | Uptime probes exist; cron not wired |

**Overall: 7.1/10 — Strong foundation, clear path to production excellence.**

---

## Phase 1: Security Hardening (CRITICAL — Do First) — MOSTLY COMPLETE

*Goal: Eliminate all exploitable vulnerabilities before any further public exposure.*

### 1.1 ~~Sanitize all innerHTML insertions against XSS~~ DONE
- **Files:** `js/coach-directory.js:75-89`, `js/admin-directory.js:42-76,150-152`, `js/main.js` (15+ locations), `js/esqr.js` (5 locations)
- **Action:** Create a shared `escapeHTML()` utility; apply to every dynamic value rendered via innerHTML (coach names, user data, directory fields). Alternatively, refactor to use `textContent` or DOM APIs where possible.
- **Severity:** HIGH — User-submitted coach directory data flows directly into innerHTML.

### 1.2 ~~Remove hardcoded fallback signing secrets~~ DONE
- **Files:** `netlify/functions/sign-download.js:16`, `netlify/functions/download-file.js:16`
- **Current:** `|| 'dev-signing-secret-change-in-production'` fallback after `requiredEnv()`.
- **Action:** Remove the `||` fallback entirely. If `EFI_DOWNLOAD_SIGNING_SECRET` is missing, the function should return 500, not silently use a known secret.
- **Severity:** HIGH — Anyone who reads the source code can forge download URLs.

### 1.3 Add authorization to user-data endpoints
- **Files:** `netlify/functions/sync-progress.js`, `netlify/functions/submissions.js`
- **Current:** Anyone can POST to `/api/sync-progress` or `/api/submissions` with any email address and overwrite that user's data.
- **Action:** Require authenticated session (Supabase JWT or managed token) and validate that `email` in the request body matches the authenticated user.
- **Severity:** HIGH — Data integrity risk.

### 1.4 ~~Add input validation on submissions endpoint~~ DONE
- **File:** `netlify/functions/submissions.js:33-42`
- **Missing:** URL format validation on `evidence_url`, length limits on `notes`, allowlist for `kind` values (`module`|`capstone`), allowlist for `module_id` (1-6).
- **Action:** Add validation; reject malformed input with 400.

### 1.5 Validate credential IDs in coach directory submissions
- **File:** `netlify/functions/coach-directory.js:67+`
- **Current:** Users can submit any string as `credential_id`.
- **Action:** Validate format `EFI-CEFC-YYYY-NNN` and optionally cross-check against issued credentials in the database.

### 1.6 Migrate tokens from localStorage to httpOnly cookies
- **File:** `js/auth.js:31-42`
- **Current:** JWT access and refresh tokens stored in localStorage (XSS-accessible).
- **Action:** Issue tokens as httpOnly, Secure, SameSite=Strict cookies from the auth endpoint. Frontend reads auth state from a `/api/auth?action=me` endpoint instead of localStorage.
- **Note:** This is a larger refactor; can be phased. At minimum, ensure XSS vectors (Phase 1.1) are closed first.

**Phase 1 Deliverables: 6 items | Estimated complexity: Medium-High**

---

## Phase 2: Payment & Commerce Completion — DEFERRED

> **Status: Deferred to future deployment.** Store, enroll, and checkout pages have been converted to "Coming Soon" with interest capture forms. The interest form collects name, email, role, service preferences, and notes via `/api/leads`. Once sufficient demand signal is gathered, this phase will be activated.

### Deferred items (preserved for future reference):
- 2.1 Implement Stripe Checkout / Payment Element in frontend
- 2.2 Set `EFI_STRIPE_ENFORCE=true` as production default
- 2.3 Wire Stripe webhook to production endpoint
- 2.4 Add payment success/failure UX flow
- 2.5 Add refund/cancellation policy copy

### Completed replacement:
- Store page → "Coming Soon" with interest capture form
- Enroll page → "Coming Soon" redirecting to interest form
- Checkout page → "Not Yet Available" redirect page
- Nav CTA changed from "Enroll" to "Show Interest"

**Phase 2 Deliverables: DEFERRED | Interest capture form: SHIPPED**

---

## Phase 3: Grading System & Academic Integrity

*Goal: Make AI grading reliable, transparent, and auditable.*

### 3.1 Eliminate fake fallback grading
- **File:** `netlify/functions/_ai_rubric.js:60-71`
- **Current:** When `GEMINI_API_KEY` is missing, submissions receive a score of 65-95 based on text length — not content quality.
- **Action:** If AI grading is unavailable, queue the submission for manual review instead of returning a fake score. Notify the user: "Your submission is queued for human review."

### 3.2 Add grading audit trail
- **Files:** `netlify/functions/submissions.js`, `netlify/functions/_db.js`
- **Action:** Persist the full grading record: model used, prompt sent, raw response, parsed score, timestamp. Store in `efi_grading_audit` table. Required for academic appeals.

### 3.3 Implement human review queue
- **Files:** `admin.html`, `js/admin-directory.js` (extend), `netlify/functions/submissions.js`
- **Action:** Add a reviewer queue in admin UI for edge-case submissions (scores near pass/fail boundary, AI confidence below threshold, fallback-graded). Allow reviewer to override score with notes.

### 3.4 Add confidence scoring to AI grades
- **File:** `netlify/functions/_ai_rubric.js`
- **Action:** Request a confidence score from the model. Flag low-confidence results for human review automatically.

### 3.5 Notify users when fallback grading is used
- **Files:** `netlify/functions/submissions.js`, dashboard UI
- **Action:** If fallback grading occurs, mark the submission as `grading_method: 'fallback'` and show the user a notice that their work is pending full review.

### 3.6 Wire the feedback processor cron
- **File:** `netlify/functions/process-due-feedback.js`
- **Current:** Function exists but is not scheduled.
- **Action:** Set up Netlify Scheduled Function or external cron (every 30 min) hitting the endpoint with `x-efi-cron-secret` header.

**Phase 3 Deliverables: 6 items | Estimated complexity: High**

---

## Phase 4: Content Polish & SEO Completion

*Goal: Fill every content gap, fix every meta tag, ship professional copy.*

### 4.1 Add meta descriptions to 5 missing pages
- **Files:** `privacy.html`, `terms.html`, `health.html`, `telemetry.html`, `verify.html`
- **Action:** Add `<meta name="description" content="...">` with page-appropriate copy.

### 4.2 Replace placeholder testimonial in store
- **File:** `store.html:220`
- **Current:** "Sample Learner Testimonial" with "Illustrative quote format pending public testimonial release consents."
- **Action:** Either source a real testimonial with consent, or replace with a trust signal (e.g., satisfaction metric, completion rate, or remove the section entirely until real quotes are available).

### 4.3 Fix `href="#"` placeholder links
- **Files:** `login.html:66,96`, `dashboard.html:29`
- **Action:** Replace with `<button>` elements or `href="javascript:void(0)"` with proper `role="button"` and `tabindex` for accessibility. Best: refactor to `<button>` since these are JS-triggered actions.

### 4.4 Deepen accreditation page with precise status language
- **File:** `accreditation.html`
- **Action:** Add exact accreditation status per body (ICF, NBEFC, etc.) with dates, application stage, evidence links, and "last updated" timestamp. Requires input from founder.

### 4.5 Strengthen community page
- **File:** `community.html`
- **Action:** Add topic-based recap archive structure, monthly digest section, anonymous question submission form. Transform from thin placeholder to retention tool.

### 4.6 Add certification evidence examples
- **File:** `certification.html`
- **Action:** Add 1 anonymized passing sample outline per capstone part, rubric "pass" vs "revise" comparison snippets, and full turnaround SLA language.

### 4.7 Standardize free-vs-paid messaging across pages
- **Files:** `store.html`, `enroll.html`, `curriculum.html`, `index.html`
- **Action:** Add uniform summary block: "Free: all learning content. Paid: expert grading, personalized feedback, credential, directory listing, alumni network."

### 4.8 Add vendor-specific legal language
- **Files:** `privacy.html`, `terms.html`
- **Action:** Name Supabase (data storage), Netlify (hosting/functions), Stripe (payments), email provider. Specify data retention windows, unsubscribe workflow, governing law jurisdiction.

### 4.9 Even out module depth
- **Files:** `module-b-pedagogy.html`, `community.html`
- **Action:** Add 1 mini-case study per unit in thinner modules; add evidence notes for major claims.

### 4.10 Add source access footer to source-heavy modules
- **Files:** All module pages with citations
- **Action:** Add one-line footer: "Can't access a source? See our source access guide" linking to `resources.html#source-access`.

### 4.11 Add high-impact imagery
- **Locations:** `certification.html`, `getting-started.html`, `module-c-interventions.html`, `about.html`, `verify.html`
- **Assets needed:**
  - Applied coaching artifacts (annotated intake form, rubric scoring, dashboard mockup)
  - Decision pathway flowcharts (parent/educator/coach paths)
  - Intervention implementation scenes (workspace setup, planning sheets)
  - Credibility imagery (reviewer headshots, verification badge specimen)

**Phase 4 Deliverables: 11 items | Estimated complexity: Medium**

---

## Phase 5: Code Quality & Testing

*Goal: Establish professional engineering standards with real test coverage.*

### 5.1 Add comprehensive backend test suite
- **Current:** 6 tests in `tests/ai-rubric.test.mjs`
- **Target:** >70% coverage across all Netlify functions
- **Tests needed:**
  - Auth flow (register, login, logout, token refresh, role checks)
  - Submissions workflow (submit, grade, release, edge cases)
  - Coach directory (list, submit, moderate, authorization)
  - Stripe webhook (signature verification, payment intent handling)
  - Input validation (malformed emails, URLs, IDs)
  - Database layer (CRUD operations, fallback behavior)

### 5.2 Add frontend integration tests
- **Scope:** Form submissions, auth state transitions, dashboard rendering, cart/checkout flow
- **Framework:** Consider Playwright or Cypress for browser-based tests

### 5.3 Remove or document dead code
- **File:** `js/main.js:126,187,204,286`
- **Current:** 4 functions disabled with early `return;` statements (~400 lines).
- **Action:** Either remove entirely or add clear `// PLANNED: <feature>` markers and extract to a separate file.

### 5.4 Replace silent error catches with proper handling
- **Files:** `js/auth.js:177-182,236-243`, `netlify/functions/submissions.js:70`, `js/esqr.js:679`
- **Pattern:** `.catch(function () {})` — silent swallowing of errors.
- **Action:** Log errors to telemetry, surface user-facing messages where appropriate, add retry logic for transient failures.

### 5.5 Add `.gitignore`
- **Current:** No `.gitignore` exists.
- **Action:** Add standard Node.js `.gitignore` covering `node_modules/`, `.env`, `.netlify/`, `dist/`, etc.

### 5.6 Add rate limiting to API endpoints
- **Files:** All Netlify functions
- **Action:** Implement per-IP rate limiting (Netlify's built-in or custom via Supabase counter). Priority endpoints: `auth.js` (brute force), `leads.js` (spam), `submissions.js` (abuse).

### 5.7 Add CORS headers to API responses
- **File:** `netlify/functions/_common.js:8-17`
- **Action:** Add `Access-Control-Allow-Origin`, `Access-Control-Allow-Methods`, `Access-Control-Allow-Headers` to the `json()` helper. Restrict origin to production domain.

**Phase 5 Deliverables: 7 items | Estimated complexity: High**

---

## Phase 6: Operations & Launch Readiness

*Goal: Everything needed to run confidently in production.*

### 6.1 Rotate all signing secrets
- **Env vars:** `EFI_DOWNLOAD_SIGNING_SECRET`, `CERTIFICATE_SIGNING_SECRET`, `EFI_PURCHASE_SIGNING_SECRET`
- **Action:** Generate cryptographically strong secrets. Set in Netlify production environment. Document rotation procedure.

### 6.2 Configure CRM/ESP webhook targets
- **Env vars:** `EFI_CRM_WEBHOOK_URL`, `EFI_ESP_WEBHOOK_URL`
- **Action:** Select and integrate CRM (HubSpot, Pipedrive, etc.) and email service (Mailchimp, ConvertKit, etc.). Set webhook URLs in production.

### 6.3 Set up scheduled feedback processor
- **Function:** `process-due-feedback.js`
- **Action:** Configure as Netlify Scheduled Function (every 30 min) or external cron service. Verify `EFI_SUBMISSIONS_CRON_SECRET` is set.

### 6.4 Configure Supabase production environment
- **Env vars:** `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- **Action:** Create production Supabase project. Run schema from `docs/supabase-schema.sql`. Set Row Level Security policies. Configure connection pooling.

### 6.5 Set up production video hosting
- **Current:** YouTube/Vimeo embeds without captions.
- **Action:** Establish video hosting pipeline with caption/transcript support. Add `<track>` elements for accessibility compliance.

### 6.6 Add video captions and transcripts
- **Files:** All pages with embedded videos (free modules, further-sources.html)
- **Action:** Generate or source captions for all video content. Add as VTT files or platform-native captions.

### 6.7 Complete manual smoke test checklist
- **From:** `docs/release-checklist.md` — 8 manual items
- **Checklist:**
  - [ ] Role-restricted page access (admin.html, telemetry.html)
  - [ ] Full checkout + certificate flow
  - [ ] ESQ-R export/share behavior
  - [ ] Dark mode across all pages
  - [ ] Mobile navigation on all pages
  - [ ] API endpoints on Netlify preview
  - [ ] Verify certificate lookup flow
  - [ ] CHANGELOG.md updated

### 6.8 Implement CMS-backed coach directory
- **Current:** Manual JSON moderation with admin UI
- **Action:** Migrate to full database-backed directory with automated workflows: submission -> email verification -> admin review -> approval notification -> public listing.

### 6.9 Set up backup and disaster recovery
- **From:** `docs/data-retention-policy.md`
- **Action:** Configure daily logical backup, weekly encrypted snapshots, monthly archives. Schedule quarterly restore drills.

### 6.10 Add email verification to auth flow
- **File:** `netlify/functions/auth.js`
- **Current:** Account creation accepts any email without verification.
- **Action:** Send verification email on registration. Restrict access until verified.

### 6.11 Add CSRF protection
- **Files:** All form-handling endpoints
- **Action:** Implement CSRF token generation and validation. Add tokens to all frontend forms.

### 6.12 Update CHANGELOG.md for release
- **File:** `CHANGELOG.md`
- **Action:** Move items from "Unreleased" to versioned release with date, categorized changes.

**Phase 6 Deliverables: 12 items | Estimated complexity: High**

---

## Priority Matrix

```
                        HIGH IMPACT
                            |
          Phase 1           |          Phase 2
        (Security)          |        (Payments)
                            |
  URGENT ───────────────────┼─────────────────── CAN WAIT
                            |
          Phase 3           |          Phase 4
        (Grading)           |        (Content)
                            |
                        LOW IMPACT
                            |
          Phase 5           |          Phase 6
       (Code Quality)       |          (Ops)
```

## Recommended Execution Order

| Order | Phase | Items | Rationale |
|-------|-------|-------|-----------|
| 1st | Phase 1: Security | 6 | Must fix before any further exposure |
| 2nd | Phase 2: Payments | 5 | Core revenue path; blocks real transactions |
| 3rd | Phase 3: Grading | 6 | Academic integrity for certification credibility |
| 4th | Phase 4: Content | 11 | SEO + trust + conversion polish |
| 5th | Phase 6: Ops | 12 | Production infrastructure hardening |
| 6th | Phase 5: Testing | 7 | Long-term maintainability investment |

**Total deliverables: 47**

---

## Quick Wins — ALL SHIPPED (2026-02-17)

1. ~~Add `.gitignore`~~ DONE
2. ~~Add meta descriptions to 5 pages~~ DONE
3. ~~Fix `href="#"` placeholder links~~ DONE
4. ~~Remove hardcoded fallback signing secrets~~ DONE
5. ~~Add input validation to submissions endpoint~~ DONE
6. ~~XSS sanitization on innerHTML~~ DONE
7. ~~CORS headers on API responses~~ DONE
8. ~~Replace silent error catches with logging~~ DONE
9. ~~Remove dead code (4 disabled functions)~~ DONE
10. ~~Nav CTA: "Enroll" → "Show Interest"~~ DONE

---

## Items Requiring Founder Input

These deliverables cannot be completed without decisions or content from the project owner:

1. **Accreditation status language** — Exact status per body, dates, evidence (Phase 4.4)
2. **Refund/cancellation policy** — Terms for digital certification services (Phase 2.5)
3. **Reviewer credentials** — Names, bios, headshots for about page (Phase 4.11)
4. **CRM/ESP selection** — Which platforms for lead management and email (Phase 6.2)
5. **Testimonial consent** — Real quotes from program participants (Phase 4.2)
6. **Video hosting decision** — Platform for production video pipeline (Phase 6.5)
7. **Grading turnaround SLA** — Formal promise beyond 24-hour hold window (Phase 4.6)
8. **Directory verification policy** — What qualifies a coach, renewal cadence (Phase 1.5)

---

## Completed Work (Waves 1-18)

For reference, the following are **already done and working**:

- 45 HTML pages with consistent design, navigation, and accessibility
- RBAC scaffold with admin/reviewer/learner roles
- PBKDF2 password hashing with legacy migration
- 10 API endpoints (auth, leads, downloads, events, verify, submissions, directory, progress, webhook, feedback)
- AI rubric grading engine with Gemini integration
- Supabase database abstraction with memory fallback
- Coach directory with moderation workflow
- Signed download URLs for gated assets
- Certificate verification system
- ESQ-R assessment tool with config-driven architecture
- 10 automated quality gate checks in CI
- Dark mode support
- Mobile-responsive navigation
- Structured data (JSON-LD) and sitemap
- Netlify deployment with security headers
- Comprehensive documentation suite

---

*This roadmap is a living document. Update phase statuses as items are completed.*
