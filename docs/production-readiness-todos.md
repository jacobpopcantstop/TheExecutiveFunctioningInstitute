# Production Readiness: Top 10 Essential To-Dos

This checklist prioritizes moving EFI from static prototype toward deployable full-stack product quality.

1. **Implement real authentication + RBAC**
   - Replace localStorage auth with server-backed sessions/JWT, hashed passwords (Argon2/Bcrypt), email verification, password reset, and role scopes (`learner`, `reviewer`, `admin`).

2. **Move grading + certification logic to backend services**
   - Server-own module submissions, rubric scoring, reviewer assignments, audit trails, and certificate issuance states.

3. **Use payment webhooks for authoritative purchase state**
   - Integrate Stripe (or equivalent) checkout + webhook validation for `certificate`, `capstone-review`, and `certificate-frame` fulfillment.

4. **Complete module content citation audit**
   - Add/verify citations section in every module page for claims and frameworks (Barkley, Brown, Dawson & Guare, Ward, Harvard CDC, ICF).

5. **Automated link validation in CI**
   - Add a scheduled and PR-time checker for internal/external links with allowlist, retry policy, and broken-link reporting.

6. **Normalize iconography system-wide**
   - Replace remaining emoji/icon entities with a single-color SVG icon set and shared component classes for consistency.

7. **Export and report service hardening**
   - Move ESQ-R PNG/PDF generation to both client and server paths; support signed share links and downloadable report history.

8. **Certificate generation pipeline**
   - Generate tamper-evident signed PDFs on the server, include unique verification URL, and store immutable issuance records.

9. **Observability + error monitoring**
   - Add centralized logging, performance traces, front-end error reporting, and uptime/SLA dashboards.

10. **Deployment and data governance baseline**
   - Add environment-based config, database migrations, backup/restore policy, privacy policy, terms, and FERPA/GDPR controls.

