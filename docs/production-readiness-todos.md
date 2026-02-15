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

4. 🔄 **Route hardening for role-specific surfaces**
   - RBAC helpers exist; still need page-level role guards for reviewer/admin-only pages.

5. 🔄 **Server-backed certificate verification API**
   - Current verify page reads local prototype records only.

6. 🔄 **Server-backed snapshot storage for ESQ-R exports**
   - Current snapshot history is browser-local only.

7. 🔄 **Automated external link checks**
   - Current CI validates local links only; external URLs still unchecked.

8. 🔄 **Semantic data and SEO metadata pass**
   - Add JSON-LD Course/Organization schema and canonical URLs.

9. 🔄 **Accessibility QA pass**
   - Add automated axe checks and keyboard-only test matrix in CI.

10. 🔄 **Deployment baseline**
   - Add environment templates, startup scripts, and backend service skeleton.

## Next Execution Sprint
- Replace localStorage auth/purchases with server APIs.
- Add signed certificate records + verification endpoint.
- Complete icon replacement pass across all pages.
- Add external link health checks with retries and reporting.
