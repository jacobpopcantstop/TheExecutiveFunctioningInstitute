# 10-To-Do Wave Status (Archived Snapshot)

> Status: Archived wave snapshot retained for history.  
> Current active priorities are tracked in `docs/roadmap-to-perfection.md`.

Implemented in current wave:

1. Server-side purchase enforcement for certificate products
- `netlify/functions/verify.js` now rejects `certificate` and `certificate-frame` purchases unless all 6 modules and capstone are passed from server records.

2. Unified navigation behavior
- `js/main.js` normalized nav links through one runtime config for non-admin pages.

3. Section-level citation footnotes in long modules
- `js/main.js` now injects heading-aware citation notes for module pages.

4. Parent-focused intervention toolkit page
- Added `parent-toolkit.html` and linked from `getting-started.html` and `resources.html`.

5. Educator implementation kit page
- Added `educator-toolkit.html` and linked from `getting-started.html` and `resources.html`.

6. Outcome dashboard metrics
- Added average score, completion trend, pending release count, and next release timestamp in `dashboard.html`.

7. CTA governance utility
- Added CTA governance in `js/main.js` to constrain conversion CTA emphasis in page content.

8. FAQ schema on curriculum and certification
- Added `FAQPage` JSON-LD to `curriculum.html` and `certification.html`.

9. Store trust layer
- Added service comparison table, delivery window notes, refund summary, and prerequisite messaging in `store.html`.

10. Broken-link reporting UX
- Added "Report Broken Link" button injection on `404.html` and `resources.html` via `js/main.js`, including `document.referrer` logging to telemetry endpoint.
