# Content Gap Audit (2026-02-16, Archived Snapshot)

> Status: Archived audit baseline. Multiple items in this file have since been resolved.  
> For current outstanding gaps, use `docs/roadmap-to-perfection.md`.

## Summary
This audit flags site content that is currently thin, missing high-value specificity, or needs stronger factual grounding before broad launch promotion.

## High-Priority Content Gaps

### 1) Accreditation and credential language needs precise status detail
- Page: `accreditation.html`
- Gap: The page explains alignment directionally, but does not provide concrete timeline, application stage, or evidence links.
- Risk: Perceived over-claiming if users infer formal accreditation that is not yet granted.
- Needed detail:
  - Exact status per body (e.g., "not accredited", "application submitted", "in review", with dates).
  - Public links or screenshots of status pages/emails where possible.
  - A clear "last updated" date stamp.

### 2) Coach directory has placeholder-level trust signals
- Page: `coach-directory.html`
- Gap: Directory fields are present but proof/trust metadata is light.
- Needed detail:
  - Verification status badge logic (active, probation, expired).
  - Service modalities and scope statements per coach.
  - Consent and directory listing policy link.

### 3) Community page is too thin to retain users
- Page: `community.html`
- Gap: Minimal recap depth and weak return incentive.
- Needed detail:
  - Recap archive by topic (scope, billing, school coaching, adult coaching).
  - "What changed this month" digest.
  - Submission form for anonymous questions.

### 4) Certification evidence examples are abstract
- Page: `certification.html`
- Gap: Strong structure, but lacks sample artifacts and score exemplars.
- Needed detail:
  - 1 anonymized passing sample outline per capstone part.
  - Rubric category examples with "pass" vs "revise" snippets.
  - Review SLA language (current 24-hour hold is stated; add full expected turnaround window).

### 5) Store conversion copy can be clearer about paid value boundaries
- Pages: `store.html`, `enroll.html`, `curriculum.html`
- Gap: Open information vs paid services is mostly clear but not consistently repeated.
- Needed detail:
  - Uniform summary block on each page: "Free: learning content. Paid: grading, feedback, credential, directory, coaching."
  - Stronger guarantee/limitations language for digital delivery and support window.

### 6) Legal pages need implementation-specific language
- Pages: `privacy.html`, `terms.html`
- Gap: Still generic in places; needs exact vendors and data paths.
- Needed detail:
  - Supabase data classes stored.
  - Netlify function logs retention window.
  - Email provider and unsubscribe handling workflow.
  - Jurisdiction/governing law and dispute path.

## Medium-Priority Content Gaps

### 7) Module-level depth unevenness
- Stronger: `module-1.html`, `module-5.html`
- Thinner: `module-b-pedagogy.html`, `community.html`
- Needed detail:
  - Add 1 mini case per unit in thinner modules.
  - Add concise evidence note for each major claim.

### 8) Source access explanation should be repeated outside resources page
- Existing: `resources.html#source-access`
- Gap: Users may never reach this section.
- Needed detail:
  - Add one-line "If unavailable, see source access notes" footer on every source-heavy module.

## Missing High-Impact Images (Recommended)

### A) Applied coaching artifacts (realistic mockups)
- Suggested assets:
  - Annotated intake form screenshot
  - Rubric scoring sheet screenshot
  - Dashboard feedback timeline mockup
- Placement:
  - `certification.html`, `dashboard.html`, `module-2.html`

### B) Decision pathway visuals
- Suggested assets:
  - "Which path should I take?" flowchart (parent / educator / coach)
  - "Free to paid" transition map
- Placement:
  - `getting-started.html`, `index.html`, `enroll.html`

### C) Intervention implementation scenes (illustrative)
- Suggested assets:
  - Workspace setup before/after for time blindness supports
  - GDD planning sheet in use
  - Environmental cue board examples
- Placement:
  - `module-c-interventions.html`, `module-4.html`, `resources.html`

### D) Credibility imagery
- Suggested assets:
  - Faculty/reviewer headshots and bios
  - Certification verification badge specimen
  - "What reviewed feedback looks like" sample panel
- Placement:
  - `about.html`, `certification.html`, `verify.html`

## Artifacts to Remove or Consolidate
- Duplicate/legacy messaging variants across older pages with inconsistent claims.
- Any remaining emoji/symbol placeholders used as icons (replace with monochrome SVG).
- Repetitive CTA clusters that point users to the same destination from one screen.

## Information Needed From You for Accurate Copy
To avoid assumptions and keep legal/reputational safety high, provide:
1. Exact accreditation status statements and dates (ICF/NBEFC or others).
2. Formal grading turnaround promises (not just hold window).
3. Refund/cancellation policy for digital certification services.
4. Actual reviewer/faculty credentials you want publicly listed.
5. Email platform and CRM stack used in production.
6. Directory verification policy (what qualifies, how often renewed).
