# Changelog

## Unreleased

### Added
- Reviewer/Admin operations page (`admin.html`) with role-gated access.
- Static accessibility checker and CI workflow.
- Netlify deployment headers/CSP baseline.
- Release checklist and API contract starter docs.

### Changed
- Authentication password handling upgraded to PBKDF2 (`crypto.subtle`) with migration from legacy hashes.
- Login/register handlers updated to async auth calls.
- Expanded canonical URL coverage and sitemap route coverage.
