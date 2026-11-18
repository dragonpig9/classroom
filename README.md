# PathLight 學途 — F.1–F.6 Academic Guidance Platform (Demo)

An academic-only longitudinal analytics and guidance platform for Hong Kong secondary schools:
F.3 elective selection, an honest F.6 HKDSE predictor, JUPAS + sub-degree planning, HKEAA
(考評局) examination-report analysis with AI + human labeling, and export to external revision AIs.

It is **one Render Web Service** with no external database. A JSON store is seeded automatically
on first boot with 32 students, F.1–F.6 histories, 36 DSE-style taster questions, 56 HKEAA/internal
reports and indicative JUPAS / Associate Degree / Higher Diploma cut-offs.

> All people, scores and programme statistics are synthetic demo data, not official JUPAS / HKEAA figures.

## Architecture

```
Browser (React 18 + Vite + Tailwind + Recharts + lucide-react)
   │  fetch /api/*
   ▼
Express (server/index.js) ── serves dist/ (built SPA) + REST API
   ├── engine.js   Elective Fit · Honest Predictor · Pathways · Triage · Insights · Weakness export
   ├── ai.js       Claude (ANTHROPIC_API_KEY) ─or─ deterministic simulation fallback
   ├── db.js       JSON file store (atomic writes, auto-seed, /api/admin/reset)
   └── seed.js     deterministic generator (same data every boot)
```

## File tree

```
.
├── render.yaml                 Render Blueprint (build, start, health check, env vars)
├── package.json                build / start / dev / smoke scripts
├── vite.config.js · tailwind.config.js · postcss.config.js · index.html
├── server/
│   ├── index.js                Express app, all API routes, static hosting, PORT binding
│   ├── db.js                   JSON store (DATA_DIR/db.json)
│   ├── seed.js                 32 students, mistakes, tasters, cohort calibration, HKEAA reports
│   ├── engine.js               analytics engines
│   ├── ai.js                   Claude hook + simulation fallback (recognition, extraction, drills)
│   ├── reset.js                `npm run reset-data`
│   ├── smoke.js                end-to-end API test (`npm run smoke`)
│   └── data/
│       ├── subjects.js         subjects, 12 electives, skills, levels, question types, topics
│       ├── tasters.js          36 DSE-style questions + mark-scheme grader
│       └── programmes.js       JUPAS + Asso/HD programmes (indicative)
└── src/
    ├── main.jsx · App.jsx      shell, demo role switcher, tabs (hash-routed)
    ├── api.js · ui.jsx · index.css
    └── views/
        ├── ProfileView.jsx       Module A — trajectory, percentile, skill radar, mistake log
        ├── TasterHub.jsx         Module B — 12 Real DSE Tasters, instant marking
        ├── ElectiveAdvisor.jsx   Module B — Fit Engine + Drop-Risk Warnings, edit choices
        ├── HonestPredictor.jsx   Module C — school vs calibrated grades
        ├── PathwayPlanner.jsx    Module C — dual-track JUPAS + sub-degree simulator
        ├── HkeaaAnalyzer.jsx     Module D — upload, AI recognition, human labeling, mark splits
        ├── TeachingInsights.jsx  Module D — heatmap, over-prediction, teaching adjustments
        ├── TriageDashboard.jsx   Module E — 32-student triage + counselling cards
        └── RevisionHub.jsx       Module F — weakness profile export, mock sync, drill generator
```

## The demo, by role

| Role | What to try |
| --- | --- |
| **F.3 Student** (default: ★ Chan Tsz Ching) | Profile → Real DSE Tasters (submit Physics) → Elective Advisor shows the Drop-Risk Warning for Phy + Chem with a falling quantitative trend → load the recommendation and save. |
| **F.6 Student** (default: ★ Wong Ka Lok) | Honest DSE Predictor (school vs calibrated Best 5) → 升學 Pathways: switch Honest / School scenarios, set any subject level, re-band JUPAS, see Asso/HD safety nets. |
| **Teacher** | Class Triage: filter F.3 mismatch / F.6 danger, write a note and mark met. HKEAA Analyzer: Upload → Load sample → Ingest (AI runs automatically) → correct a label, split marks, tag nuances, Verify. Teaching Insights updates from those labels. |

Every action writes to the backend store, and the triage, predictor and insights read the new state straight away.
**Reset** in the navbar restores the original seed.

## How the engines work (short version)

- **Elective Fit** = 40% related F.1–F.3 subjects (recent terms weighted more) + 40% skills projected to F.5 from their F.1→F.3 slope + 20% taster score (discounted 15%). **Drop-risk** fires when a subject's gate skill (for example quantitative reasoning for Physics) is projected below the F.5 requirement, when a taster score is much higher than the junior record, or when combinations clash (Phy + Chem with weak quantitative skills, two essay electives with weak essay skills).
- **Honest Predictor**: mock mark → continuous DSE level, minus the subject's historical school over-prediction (school-predicted vs actual HKDSE for past cohorts plus uploaded HKEAA reports), minus up to 0.5 level of mark-scheme penalty (lost marks that are mostly keyword, elaboration or data-citation issues; weak essay skills; falling quantitative trend).
- **Pathways**: Best 5 (5\*\* = 7) checked against 3322 + subject prerequisites. Reach = within 3 points below the lower quartile (LQ), Match = at or above LQ, Safe = above the median. Sub-degree eligibility is 5 subjects at Level 2 including Chinese and English.
- **Insights**: per subject × question type, the percentage of marks lost in HKEAA papers vs internal papers, mark-loss reasons, over-prediction by subject, and ranked teaching adjustments.

## AI: live Claude or simulation

Set `ANTHROPIC_API_KEY` to have Claude (default model `claude-opus-5-5`, override with `ANTHROPIC_MODEL`) do three jobs:

1. HKEAA item recognition: question type, syllabus topic, mark-loss reason, nuance tags and confidence.
2. Vision extraction of question rows from uploaded report images or PDFs.
3. Personalised practice drills.

If the key is missing, or a call fails, the deterministic rules engine runs instead, so the demo still works. The navbar badge and each result show which engine was used.
Pasted report text format: one line per question, `Q3(b) | question text | 2/4 | examiner comment`.

## Run locally

```bash
npm install
npm run build && npm start            # http://localhost:3000
# or hot reload: npm run dev          # Vite on :5173, API on :3000
BASE=http://localhost:3000 npm run smoke
```

## API (selected)

`GET /api/health` · `GET /api/meta` · `GET /api/students[?form=3]` · `GET /api/students/:id`
`POST /api/students/:id/tasters/:subject` · `GET /api/students/:id/fit` · `PUT /api/students/:id/choices`
`GET /api/students/:id/prediction` · `POST /api/students/:id/pathways {levels?}` · `PUT /api/students/:id/jupas`
`GET /api/teacher/triage` · `POST /api/students/:id/notes`
`GET|POST /api/hkeaa/reports` · `POST /api/hkeaa/reports/:id/recognize` · `PATCH /api/hkeaa/reports/:id/items/:itemId` · `POST /api/hkeaa/reports/:id/verify-all` · `GET /api/hkeaa/insights`
`GET /api/students/:id/weakness-profile` · `POST /api/integrations/revisiondojo/sync` · `POST /api/practice/generate`
`POST /api/admin/reset`

## Deploy to Render

1. Push this repository to GitHub.
2. In Render: **New → Blueprint**, then pick the repo. Render reads `render.yaml` and creates the `pathlight-dse` web service:
   - Build: `npm ci --include=dev && npm run build`
   - Start: `npm start` (binds `process.env.PORT` on `0.0.0.0`)
   - Health check: `/api/health`
3. Optional: when prompted, or later under **Environment**, set `ANTHROPIC_API_KEY` to enable live Claude. Leave it empty to run the simulation.
4. Open the service URL. Data seeds automatically on first boot.

Manual alternative: **New → Web Service**, runtime Node, using the same build and start commands and health check path.

**Persistence note:** the free plan has an ephemeral disk, so demo edits reset when the service restarts or redeploys. That is usually what you want for a demo. To keep data, add a Render Disk (paid plan) mounted at, for example, `/var/data`, and set `DATA_DIR=/var/data`.
