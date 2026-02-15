# The Executive Function Institute

An open-source, science-based Executive Function Coaching Certification program grounded in the work of Barkley, Brown, Dawson & Guare, and Ward.

## About

The Executive Function Institute provides a rigorous six-module certification curriculum that trains professionals to become Certified Executive Function Coaches (CEFC). The program bridges the gap between theoretical neuroscience and practical coaching, training coaches to be the "external frontal lobe" their clients need.

## Site Structure

- **index.html** — Homepage with program overview, three foundational models, and certification path
- **about.html** — Mission, theoretical foundations (Barkley, Brown, Dawson & Guare), and the 360 Thinking model
- **curriculum.html** — Complete six-module curriculum overview with units, topics, and assignments
- **certification.html** — Certification requirements, capstone practicum, peer review, and ethics
- **resources.html** — Open-source reading packets, assessment tools, downloadable forms, and video resources
- **getting-started.html** — Guided onboarding for parents, educators, and professionals
- **enroll.html** — Enrollment interest form and program information
- **module-1.html** — Module 1: Neuropsychology of Self-Regulation
- **module-2.html** — Module 2: Assessment Protocols & Intake Strategy
- **module-3.html** — Module 3: The Coaching Architecture (Dawson & Guare Framework)
- **module-4.html** — Module 4: Applied Methodologies (360 Thinking Model)
- **module-5.html** — Module 5: Strategic Interventions & Special Populations
- **module-6.html** — Module 6: Professional Ethics & Practice Management
- **module-a-neuroscience.html** — Free module: neuroscience of executive function
- **module-b-pedagogy.html** — Free module: coaching vs tutoring pedagogy shift
- **module-c-interventions.html** — Free module: intervention frameworks
- **barkley-model-guide.html** — Definitive Barkley inhibition model hub
- **brown-clusters-tool.html** — Brown six-cluster interactive pre-diagnostic tool
- **ward-360-thinking.html** — 360 Thinking and Get Ready, Do, Done hub
- **barkley-vs-brown.html** — Comparative model analysis page
- **teacher-to-coach.html** — Educator transition landing page + ROI calculator
- **educator-launchpad.html** — 5-day email launchpad signup flow
- **gap-analyzer.html** — Download gate for skills gap analyzer lead magnet
- **launch-plan.html** — Download gate for 90-day business launch plan
- **coach-directory.html** — Searchable certified coach directory (city/state/zip)
- **community.html** — Community recap/forum digest hub
- **scope-of-practice.html** — Coaching vs therapy legal/scope guidance
- **accreditation.html** — NBEFC/ICF alignment status page
- **further-sources.html** — Canonical citations hub mapped from the root `Further Sources` dossier
- **Further Sources** — Root-level canonical source corpus used for citation integration

## Curriculum Modules

1. **Neuropsychology of Self-Regulation** — Barkley's inhibition hierarchy, Brown's six clusters, PFC development
2. **Assessment & Intake Strategy** — ESQ-R administration, BRIEF-2, intake simulations, "Goodness of Fit"
3. **The Coaching Architecture** — Dawson & Guare framework, two-tiered intervention, ICF competencies
4. **Applied Methodologies** — Ward's "Get Ready, Do, Done," temporal management, cognitive offloading
5. **Strategic Interventions & Special Populations** — ADHD/ASD adaptations, environmental engineering, transitions
6. **Professional Ethics & Practice** — ICF/NBEFC alignment, business setup, the Launch Kit

## Theoretical Foundations

The curriculum integrates three foundational models:
- **Barkley Model** — Inhibition as the keystone of self-regulation; the Extended Phenotype
- **Brown Model** — Six clusters of cognitive management; situational variability
- **Dawson & Guare Model** — 12 discrete executive skills in Thinking and Doing domains

## Running Locally

Open `index.html` in any web browser. No build tools or dependencies required — the site is built with vanilla HTML, CSS, and JavaScript.

## Quality Gates

- `python3 scripts/check_links.py` — validates local links.
- `python3 scripts/check_accessibility.py` — static accessibility checks.
- `python3 scripts/check_pdfs.py` — validates local linked PDFs are real PDF files.
- `python3 scripts/check_source_hub.py` — validates Further Sources integration.
- `python3 scripts/check_ux_audit.py` — structural UX audit baseline.
- `python3 scripts/check_console_logs.py` — blocks `console.log` and `debugger` in production JS.
- `python3 scripts/release_gate.py` — consolidated deployment gate.

## License

Open-source curriculum built on publicly available, peer-reviewed research.
