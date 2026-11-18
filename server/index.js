import express from 'express';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import * as store from './db.js';
import { ELECTIVES, JUNIOR_SUBJECTS, CORE_SUBJECTS, SKILLS, LEVELS, QUESTION_TYPES, LOSS_REASONS, NUANCE_TAGS, TOPICS, SUBJECT_NAME } from './data/subjects.js';
import { TASTERS, publicTaster, gradeQuestion } from './data/tasters.js';
import { JUPAS, SUBDEGREE } from './data/programmes.js';
import { electiveFit, honestPrediction, pathwayPlan, triage, insights, reportStats, weaknessProfile, skillState } from './engine.js';
import { aiStatus, recognizeItems, extractReport, generatePractice } from './ai.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const DIST = path.resolve(here, '..', 'dist');
const PORT = Number(process.env.PORT) || 3000;

store.load();
const app = express();
app.use(express.json({ limit: '15mb' }));

const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
const db = () => store.get();
function findStudent(req, res) {
  const s = db().students.find((x) => x.id === req.params.id);
  if (!s) res.status(404).json({ error: 'Student not found' });
  return s;
}
function findReport(req, res) {
  const r = db().reports.find((x) => x.id === req.params.id);
  if (!r) res.status(404).json({ error: 'Report not found' });
  return r;
}

// ------------------------------------------------------------ meta
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', uptime: Math.round(process.uptime()), students: db().students.length, reports: db().reports.length, ai: aiStatus().mode });
});

app.get('/api/meta', (_req, res) => {
  res.json({
    ...db().meta, ai: aiStatus(),
    electives: ELECTIVES.map(({ key, name, zh, short, f5Demands }) => ({ key, name, zh, short, f5Demands })),
    junior: JUNIOR_SUBJECTS, core: CORE_SUBJECTS, skills: SKILLS, levels: LEVELS,
    questionTypes: QUESTION_TYPES, lossReasons: LOSS_REASONS, nuanceTags: NUANCE_TAGS, topics: TOPICS, subjectNames: SUBJECT_NAME,
  });
});

app.post('/api/admin/reset', (_req, res) => {
  store.reset();
  res.json({ ok: true, seededAt: db().meta.seededAt });
});

// ------------------------------------------------------------ students
app.get('/api/students', (req, res) => {
  const form = req.query.form ? Number(req.query.form) : null;
  res.json(db().students.filter((s) => !form || s.form === form).map((s) => ({
    id: s.id, name: s.name, nameZh: s.nameZh, form: s.form, cls: s.cls, classNo: s.classNo, average: s.history.at(-1).average, story: s.story,
  })));
});

app.get('/api/students/:id', (req, res) => {
  const s = findStudent(req, res); if (!s) return;
  const { profile, ...rest } = s;
  res.json({ ...rest, skills: skillState(s) });
});

app.post('/api/students/:id/notes', (req, res) => {
  const s = findStudent(req, res); if (!s) return;
  const text = String(req.body.text || '').trim();
  if (text) s.notes.push({ at: new Date().toISOString(), by: req.body.by || 'Class teacher', text: text.slice(0, 1000) });
  if (['pending', 'met', 'follow-up'].includes(req.body.status)) s.counselStatus = req.body.status;
  store.save();
  res.json({ notes: s.notes, counselStatus: s.counselStatus });
});

app.post('/api/students/:id/mistakes', (req, res) => {
  const s = findStudent(req, res); if (!s) return;
  const b = req.body;
  const m = {
    id: `${s.id}-M${s.mistakes.length + 1}-${Date.now() % 10000}`, form: Number(b.form) || s.form, term: b.term || `F.${s.form} T1`,
    subject: b.subject, topic: b.topic || 'General', questionType: b.questionType || 'Short Structured', reason: b.reason || 'Conceptual error',
    marksLost: Number(b.marksLost) || 1, source: b.source || 'Teacher entry',
  };
  s.mistakes.push(m);
  store.save();
  res.json(m);
});

// ------------------------------------------------------------ F.3 tasters + fit engine
app.get('/api/tasters', (_req, res) => {
  res.json(ELECTIVES.map((e) => ({ key: e.key, name: e.name, zh: e.zh, short: e.short, f5Demands: e.f5Demands, questions: publicTaster(e.key), totalMarks: TASTERS[e.key].reduce((a, q) => a + q.marks, 0) })));
});

app.post('/api/students/:id/tasters/:subject', (req, res) => {
  const s = findStudent(req, res); if (!s) return;
  const qs = TASTERS[req.params.subject];
  if (!qs) return res.status(404).json({ error: 'Unknown elective' });
  const answers = req.body.answers || {};
  const results = qs.map((q) => gradeQuestion(q, answers[q.id]));
  const score = results.reduce((a, r) => a + r.awarded, 0);
  const max = results.reduce((a, r) => a + r.max, 0);
  const prev = s.tasterResults?.[req.params.subject];
  s.tasterResults ||= {};
  s.tasterResults[req.params.subject] = { score, max, pct: Math.round((score / max) * 100), attempts: (prev?.attempts || 0) + 1, attemptedAt: new Date().toISOString().slice(0, 10), source: 'Real DSE Taster (online)' };
  // Lost marks become longitudinal mistake records.
  results.forEach((r, i) => {
    if (r.awarded < r.max) {
      const q = qs[i];
      s.mistakes.push({
        id: `${s.id}-T${Date.now() % 100000}-${i}`, form: s.form, term: `F.${s.form} Taster`, subject: req.params.subject, topic: q.topic,
        questionType: q.type === 'mc' ? 'MC' : q.type === 'numeric' ? 'Calculation' : /design/i.test(q.stem) ? 'Experimental Design' : /source|figure/i.test(q.stem) ? 'Data-Based (DBQ)' : 'Short Structured',
        reason: q.type === 'numeric' ? 'Calculation / unit error' : q.type === 'mc' ? 'Conceptual error' : 'Missing marking keywords',
        marksLost: r.max - r.awarded, source: 'Real DSE Taster',
      });
    }
  });
  store.save();
  res.json({ subject: req.params.subject, score, max, pct: s.tasterResults[req.params.subject].pct, results, fit: electiveFit(s) });
});

app.get('/api/students/:id/fit', (req, res) => {
  const s = findStudent(req, res); if (!s) return;
  if (s.form !== 3) return res.status(400).json({ error: 'Elective advisor is for F.3 students' });
  res.json(electiveFit(s));
});

app.put('/api/students/:id/choices', (req, res) => {
  const s = findStudent(req, res); if (!s) return;
  const keys = (req.body.choices || []).filter((k) => ELECTIVES.some((e) => e.key === k)).slice(0, 3);
  if (keys.length !== 3) return res.status(400).json({ error: 'Choose exactly 3 electives' });
  s.electiveChoices = keys;
  store.save();
  res.json(electiveFit(s));
});

// ------------------------------------------------------------ F.6 predictor + pathways
app.get('/api/students/:id/prediction', (req, res) => {
  const s = findStudent(req, res); if (!s) return;
  if (s.form !== 6) return res.status(400).json({ error: 'Honest predictor is for F.6 students' });
  res.json(honestPrediction(s, db()));
});

app.post('/api/students/:id/pathways', (req, res) => {
  const s = findStudent(req, res); if (!s) return;
  if (s.form !== 6) return res.status(400).json({ error: 'Pathway planner is for F.6 students' });
  const override = req.body?.levels && Object.keys(req.body.levels).length ? req.body.levels : null;
  res.json({ ...pathwayPlan(s, db(), override), programmes: { jupas: JUPAS, subdegree: SUBDEGREE } });
});

app.put('/api/students/:id/jupas', (req, res) => {
  const s = findStudent(req, res); if (!s) return;
  const ids = (req.body.choices || []).filter((id) => JUPAS.some((p) => p.id === id)).slice(0, 5);
  s.jupasChoices = ids;
  store.save();
  res.json(pathwayPlan(s, db()));
});

// ------------------------------------------------------------ teacher triage
app.get('/api/teacher/triage', (_req, res) => {
  const rows = triage(db());
  res.json({
    rows,
    counts: {
      total: rows.length, f3: rows.filter((r) => r.form === 3).length, f6: rows.filter((r) => r.form === 6).length,
      high: rows.filter((r) => r.risk === 'High').length, met: rows.filter((r) => r.counselStatus === 'met').length,
      f3Alerts: rows.filter((r) => r.form === 3 && r.alerts.some((a) => a.level !== 'Low')).length,
      f6Danger: rows.filter((r) => r.form === 6 && r.alerts.some((a) => a.level === 'High')).length,
    },
  });
});

// ------------------------------------------------------------ HKEAA analyzer
app.get('/api/hkeaa/reports', (req, res) => {
  const showSynthetic = req.query.synthetic === '1';
  res.json(db().reports.filter((r) => showSynthetic || !r.synthetic).map((r) => ({
    id: r.id, subject: r.subject, year: r.year, paper: r.paper, source: r.source, alias: r.alias, synthetic: Boolean(r.synthetic),
    schoolPredictedLevel: r.schoolPredictedLevel, actualLevel: r.actualLevel, createdAt: r.createdAt, aiEngine: r.aiEngine, ...reportStats(r),
  })).sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
});

app.get('/api/hkeaa/reports/:id', (req, res) => {
  const r = findReport(req, res); if (!r) return;
  res.json({ ...r, stats: reportStats(r) });
});

app.post('/api/hkeaa/reports', wrap(async (req, res) => {
  const b = req.body || {};
  if (!b.subject) return res.status(400).json({ error: 'subject is required' });
  const { engine, items, note, error } = await extractReport({ rawText: b.rawText || '', image: b.image || null });
  if (!items.length) return res.status(422).json({ error: 'No question rows recognised. Use one line per question, e.g. "Q3(b) | question text | 2/4 | examiner comment".', engine, note });
  const rep = {
    id: `R${String(db().reports.length + 1).padStart(3, '0')}-${Date.now().toString(36).slice(-4)}`,
    subject: b.subject, year: Number(b.year) || new Date().getFullYear(), paper: b.paper || 'Paper', source: b.source === 'Internal' ? 'Internal' : 'HKEAA',
    alias: b.alias || 'Uploaded candidate', schoolPredictedLevel: b.schoolPredictedLevel || null, actualLevel: b.actualLevel || null,
    createdAt: new Date().toISOString(), rawText: b.rawText || '(extracted from uploaded file)', hasImage: Boolean(b.image), fileName: b.fileName || null,
    items, aiEngine: null, extractionEngine: engine,
  };
  db().reports.push(rep);
  store.save();
  res.status(201).json({ ...rep, stats: reportStats(rep), note, error });
}));

app.post('/api/hkeaa/reports/:id/recognize', wrap(async (req, res) => {
  const r = findReport(req, res); if (!r) return;
  const targetIds = req.body?.onlyUnverified === false ? null : r.items.filter((i) => i.status !== 'verified').map((i) => i.id);
  const targets = r.items.filter((i) => !targetIds || targetIds.includes(i.id));
  const { engine, labels, error } = await recognizeItems(r.subject, targets);
  targets.forEach((it, i) => {
    it.ai = labels[i];
    if (it.status !== 'verified') it.status = 'ai';
  });
  r.aiEngine = engine;
  store.save();
  res.json({ ...r, stats: reportStats(r), engine, error });
}));

app.patch('/api/hkeaa/reports/:id/items/:itemId', (req, res) => {
  const r = findReport(req, res); if (!r) return;
  const it = r.items.find((i) => i.id === req.params.itemId);
  if (!it) return res.status(404).json({ error: 'Item not found' });
  const b = req.body || {};
  const base = it.human || it.ai || {};
  if (b.awarded != null) it.awarded = Math.max(0, Math.min(Number(b.awarded), it.maxMarks));
  it.human = {
    questionType: b.questionType ?? base.questionType ?? 'Short Structured',
    topic: b.topic ?? base.topic ?? '',
    lossReason: b.lossReason ?? base.lossReason ?? 'Conceptual error',
    nuances: Array.isArray(b.nuances) ? b.nuances : base.nuances || base.suggestedNuances || [],
    note: b.note ?? it.human?.note ?? '',
    splits: Array.isArray(b.splits)
      ? b.splits.filter((s) => Number(s.maxMarks) > 0).map((s, i) => ({ label: s.label || `${it.label}-${i + 1}`, maxMarks: Number(s.maxMarks), awarded: Math.min(Number(s.awarded) || 0, Number(s.maxMarks)), questionType: s.questionType, lossReason: s.lossReason, topic: s.topic }))
      : it.human?.splits || [],
    verifiedBy: b.verifiedBy || 'Teacher',
    verifiedAt: new Date().toISOString(),
    overrodeAi: Boolean(it.ai && (b.questionType && b.questionType !== it.ai.questionType || b.lossReason && b.lossReason !== it.ai.lossReason)),
  };
  if (it.human.splits.length) {
    const sm = it.human.splits.reduce((a, s) => a + s.maxMarks, 0);
    if (sm !== it.maxMarks) return res.status(400).json({ error: `Split max marks (${sm}) must add up to ${it.maxMarks}` });
  }
  it.status = b.verify === false ? (it.ai ? 'ai' : 'unlabeled') : 'verified';
  store.save();
  res.json({ item: it, stats: reportStats(r) });
});

app.post('/api/hkeaa/reports/:id/verify-all', (req, res) => {
  const r = findReport(req, res); if (!r) return;
  let n = 0;
  for (const it of r.items) {
    if (it.status === 'ai' && it.ai) {
      it.human = { questionType: it.ai.questionType, topic: it.ai.topic, lossReason: it.ai.lossReason, nuances: it.ai.suggestedNuances || [], note: '', splits: [], verifiedBy: req.body?.by || 'Teacher (bulk accept)', verifiedAt: new Date().toISOString(), overrodeAi: false };
      it.status = 'verified'; n++;
    }
  }
  store.save();
  res.json({ accepted: n, stats: reportStats(r) });
});

app.delete('/api/hkeaa/reports/:id', (req, res) => {
  const i = db().reports.findIndex((x) => x.id === req.params.id);
  if (i < 0) return res.status(404).json({ error: 'Report not found' });
  db().reports.splice(i, 1);
  store.save();
  res.json({ ok: true });
});

app.get('/api/hkeaa/insights', (req, res) => {
  res.json(insights(db(), { includeAi: req.query.verifiedOnly !== '1' }));
});

// ------------------------------------------------------------ revision hub / integrations
app.get('/api/students/:id/weakness-profile', (req, res) => {
  const s = findStudent(req, res); if (!s) return;
  res.json(weaknessProfile(s, db()));
});

app.post('/api/integrations/revisiondojo/sync', (req, res) => {
  const s = db().students.find((x) => x.id === req.body?.studentId);
  if (!s) return res.status(404).json({ error: 'Student not found' });
  const { profile } = weaknessProfile(s, db());
  const entry = {
    id: `SYNC-${Date.now().toString(36).toUpperCase()}`, studentId: s.id, platform: req.body.platform || 'RevisionDojo',
    webhook: req.body.webhookUrl || 'https://api.revisiondojo.example/v1/webhooks/pathlight (mock)',
    at: new Date().toISOString(), status: 'delivered (mock)', bytes: JSON.stringify(profile).length, weaknessCount: profile.topWeaknesses.length,
    responsePreview: { received: true, mappedDecks: profile.topWeaknesses.slice(0, 3).map((w) => `${w.subject}:${w.topic}`), queuedDrills: profile.topWeaknesses.length * 4 },
  };
  db().syncLog.unshift(entry);
  db().syncLog = db().syncLog.slice(0, 100);
  store.save();
  res.json(entry);
});

app.get('/api/integrations/sync-log', (req, res) => {
  res.json(db().syncLog.filter((e) => !req.query.studentId || e.studentId === req.query.studentId));
});

app.post('/api/practice/generate', wrap(async (req, res) => {
  const s = db().students.find((x) => x.id === req.body?.studentId);
  if (!s) return res.status(404).json({ error: 'Student not found' });
  const { profile } = weaknessProfile(s, db());
  const count = Math.max(3, Math.min(10, Number(req.body.count) || 6));
  const { engine, drills, error } = await generatePractice(profile, count);
  const set = { id: `PS-${Date.now().toString(36)}`, studentId: s.id, engine, createdAt: new Date().toISOString(), drills: drills.map((d) => ({ ...d, done: false })) };
  db().practiceSets.unshift(set);
  db().practiceSets = db().practiceSets.slice(0, 200);
  store.save();
  res.json({ ...set, error });
}));

app.get('/api/practice/:studentId', (req, res) => {
  res.json(db().practiceSets.filter((p) => p.studentId === req.params.studentId).slice(0, 5));
});

app.patch('/api/practice/:setId/drills/:drillId', (req, res) => {
  const set = db().practiceSets.find((p) => p.id === req.params.setId);
  const d = set?.drills.find((x) => x.id === req.params.drillId);
  if (!d) return res.status(404).json({ error: 'Drill not found' });
  d.done = Boolean(req.body.done);
  store.save();
  res.json(d);
});

// ------------------------------------------------------------ static frontend
app.use('/api', (_req, res) => res.status(404).json({ error: 'Not found' }));
if (fs.existsSync(DIST)) {
  app.use(express.static(DIST, { maxAge: '1h', index: false }));
  app.get('*', (_req, res) => res.sendFile(path.join(DIST, 'index.html')));
} else {
  app.get('/', (_req, res) => res.send('Frontend not built. Run `npm run build` (or `npm run dev` for Vite).'));
}

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: err.message || 'Server error' });
});

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`PathLight running on :${PORT} · AI mode: ${aiStatus().mode}`);
});
for (const sig of ['SIGTERM', 'SIGINT']) {
  process.on(sig, () => { store.flush(); server.close(() => process.exit(0)); });
}
