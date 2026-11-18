// End-to-end API smoke test. Usage: BASE=http://localhost:3000 npm run smoke
const BASE = process.env.BASE || 'http://localhost:3000';
let failures = 0;
async function call(method, path, body) {
  const res = await fetch(BASE + path, { method, headers: { 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined });
  const data = await res.json();
  if (!res.ok) throw new Error(`${method} ${path} → ${res.status} ${data.error}`);
  return data;
}
function check(name, cond, extra = '') {
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${name} ${extra}`);
  if (!cond) failures++;
}
const h = await call('GET', '/api/health');
check('health', h.status === 'ok', JSON.stringify(h));
const students = await call('GET', '/api/students');
check('32 students', students.length === 32);
const f3 = students.find((s) => s.form === 3).id;
const f6 = students.find((s) => s.form === 6).id;

const fit = await call('GET', `/api/students/${f3}/fit`);
check('fit ranks 12 electives', fit.ranking.length === 12, `recommended=${fit.recommended}`);
const taster = await call('POST', `/api/students/${f3}/tasters/PHY`, { answers: { 'PHY-1': 1, 'PHY-2': '3 A', 'PHY-3': 'molecules move faster with more kinetic energy, collide with the walls more often and with greater force' } });
check('taster full marks', taster.score === taster.max, `${taster.score}/${taster.max}`);
const taster2 = await call('POST', `/api/students/${f3}/tasters/ECON`, { answers: { 'ECON-1': 0, 'ECON-2': '0.5' } });
check('taster partial + mistakes logged', taster2.score < taster2.max, `${taster2.score}/${taster2.max}`);
const ch = await call('PUT', `/api/students/${f3}/choices`, { choices: fit.recommended });
check('save choices', ch.choices.keys.join() === fit.recommended.join());

const pred = await call('GET', `/api/students/${f6}/prediction`);
check('honest <= school', pred.honestBest5 <= pred.schoolBest5, `${pred.schoolBest5}→${pred.honestBest5}`);
const pw = await call('POST', `/api/students/${f6}/pathways`, { levels: { CHI: '5', ENG: '5', MATH: '5', ECON: '5', BAFS: '5', GEOG: '5' } });
check('what-if pathways', pw.simulation.best5 === 25, `best5=${pw.simulation.best5}`);
const jp = await call('PUT', `/api/students/${f6}/jupas`, { choices: pw.recommended });
check('save JUPAS', jp.choices.length === pw.recommended.length);

const tri = await call('GET', '/api/teacher/triage');
check('triage 32 rows', tri.rows.length === 32, JSON.stringify(tri.counts));
const note = await call('POST', `/api/students/${f6}/notes`, { text: 'Smoke test note', status: 'met' });
check('counselling note', note.counselStatus === 'met');

const before = await call('GET', '/api/hkeaa/insights');
const rep = await call('POST', '/api/hkeaa/reports', { subject: 'ECON', year: 2025, paper: 'Paper 2', source: 'HKEAA', alias: 'smoke', rawText: 'Q1(a) | Explain the effect of a price ceiling with a diagram. | 1/4 | Axes not labelled.\nQ2 | Calculate elasticity from Table 1. | 0/2 | Unit missing; formula inverted.\nQ3 | Discuss to what extent minimum wage helps. | 3/8 | One-sided; no evaluation.' });
check('ingest report', rep.items.length === 3, rep.extractionEngine);
const rec = await call('POST', `/api/hkeaa/reports/${rep.id}/recognize`);
check('AI recognition', rec.items.every((i) => i.status === 'ai'), rec.items.map((i) => `${i.label}:${i.ai.questionType}/${i.ai.lossReason}`).join(' '));
const pat = await call('PATCH', `/api/hkeaa/reports/${rep.id}/items/I3`, { questionType: 'Essay / Extended', lossReason: 'Incomplete elaboration', nuances: ['Communication mark'], splits: [{ label: 'Q3-arg', maxMarks: 6, awarded: 3 }, { label: 'Q3-comm', maxMarks: 2, awarded: 0, lossReason: 'Misread command word' }] });
check('human label + split', pat.item.status === 'verified' && pat.item.human.splits.length === 2);
const bad = await fetch(`${BASE}/api/hkeaa/reports/${rep.id}/items/I2`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ splits: [{ maxMarks: 5, awarded: 1 }] }) });
check('split validation rejects wrong total', bad.status === 400);
const va = await call('POST', `/api/hkeaa/reports/${rep.id}/verify-all`);
check('verify all', va.stats.verified === 3);
const after = await call('GET', '/api/hkeaa/insights');
check('insights mutate', after.coverage.itemsCounted > before.coverage.itemsCounted, `${before.coverage.itemsCounted}→${after.coverage.itemsCounted}`);

const wp = await call('GET', `/api/students/${f6}/weakness-profile`);
check('weakness profile', wp.profile.schema === 'pathlight.weakness-profile/v1' && wp.contextPrompt.length > 100);
const sync = await call('POST', '/api/integrations/revisiondojo/sync', { studentId: f6 });
check('mock sync', sync.status.startsWith('delivered'));
const ps = await call('POST', '/api/practice/generate', { studentId: f6, count: 6 });
check('practice drills', ps.drills.length === 6, ps.engine);
const d = await call('PATCH', `/api/practice/${ps.id}/drills/D1`, { done: true });
check('drill done', d.done === true);

console.log(failures ? `\n${failures} FAILED` : '\nAll smoke checks passed');
process.exit(failures ? 1 : 0);
