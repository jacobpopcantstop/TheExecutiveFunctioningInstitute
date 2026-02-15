# Implementation Roadmap: Top 10 To-Dos (Execution Status)

This tracker converts the roadmap into deployable increments.

1. ✅ **Auth model groundwork (RBAC scaffold)**
   - Added role fields and `getRole/hasRole/requireRole` helpers in `js/auth.js`.

2. ✅ **Grading/certification transparency in UI**
   - Existing dashboard workflow retained; added citation context panel to module pages via `js/main.js`.

3. 🔄 **Payment verification hardening**
   - Prototype still local-state. Next: webhook-backed purchase verification service.

4. ✅ **Module citation audit visibility**
   - Injected module citation/evidence panel on all module pages.

5. ✅ **Automated link validation in CI**
   - Added `scripts/check_links.py` and `.github/workflows/link-check.yml`.

6. 🔄 **Icon normalization**
   - Continued replacing emoji icons with single-color SVGs; more pages remain.

7. ✅ **ESQ-R report durability**
   - Added local ESQ-R report history and surfaced recent snapshots in UI.

8. ✅ **Certificate verification path**
   - Added `verify.html` and certificate deep-link to verification URL with credential ID.

9. ✅ **Client observability baseline**
   - Added client-side error and unhandled rejection logging (`EFI.Telemetry`) in `js/main.js`.

10. ✅ **Data governance surface docs**
   - Added `privacy.html` and `terms.html`; dynamically appended legal links in footer.

---

## Next 10 Logical To-Dos (Wave 2)

1. ✅ **Prototype data portability tools**
   - Added export/import/reset helpers in auth and dashboard controls for local environment continuity.

2. ✅ **Operations visibility page**
   - Added `telemetry.html` UI to inspect and clear client error logs.

3. ✅ **Sitemap expansion**
   - Added legal + verification + telemetry pages to `sitemap.xml`.

4. ✅ **Route hardening for role-specific surfaces**
   - Restricted telemetry and ops controls to reviewer/admin roles.

5. 🔄 **Server-backed certificate verification API**
   - Current verify page reads local prototype records only.

6. 🔄 **Server-backed snapshot storage for ESQ-R exports**
   - Current snapshot history is browser-local only.

7. ✅ **Automated external link checks (scheduled)**
   - Added external link mode to checker and weekly scheduled CI run.

8. ✅ **Semantic data and SEO metadata pass (phase 1)**
   - Added canonical and JSON-LD to key pages.

9. 🔄 **Accessibility QA pass**
   - Add automated axe checks and keyboard-only test matrix in CI.

10. ✅ **Deployment baseline scaffolding (phase 1)**
   - Added env template, serve script, deployment baseline doc, and health page.

---

## Next 10 Logical To-Dos (Wave 3)

1. Add backend API skeleton for auth/session/purchase endpoints.
2. Add signed certificate verification endpoint and schema.
3. Add reviewer/admin dashboard route and role guard.
4. Replace remaining emoji icons site-wide.
5. Add accessibility test workflow (axe/pa11y).
6. Add CSP/security headers deployment guidance.
7. Add canonical URL and JSON-LD to all major pages.
8. Add release checklist and versioned changelog.
9. Add API contract docs (OpenAPI draft).
10. Add backup/restore and data retention policy docs.

## Next Execution Sprint
- Implement reviewer/admin page with role gate.
- Add accessible audit automation in CI.
- Move verification + grading persistence to server prototype.
