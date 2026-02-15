# Prototype Data Retention & Backup Policy

## Scope
Applies to learner profiles, submissions, ESQ-R reports, purchases, telemetry, and certificate records.

## Retention Windows
- Learner profile and progress: 7 years.
- Certification and verification events: permanent (audit trail).
- Payment metadata (non-PCI): 7 years.
- Telemetry error logs: 90 days rolling retention.
- ESQ-R reports: 2 years unless user requests deletion.

## Backup Policy
- Daily logical backup of production database.
- Weekly encrypted snapshot retained for 12 weeks.
- Monthly archive retained for 13 months.
- Restore drills performed quarterly.

## Deletion & Access
- Deletion requests are processed within 30 days.
- Access requests are processed within 14 days.
- Admin actions must be logged with actor, timestamp, and reason.
