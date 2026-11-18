// Analytics engines: Elective Fit, Honest DSE Predictor, Pathway Simulator,
// Teacher Triage, HKEAA pedagogical insights and weakness profile export.
import { ELECTIVES, ELECTIVE_MAP, LEVELS, LEVEL_POINTS, SUBJECT_NAME, SKILLS, QUESTION_TYPES } from './data/subjects.js';
import { JUPAS, SUBDEGREE } from './data/programmes.js';

const SKILL_NAME = Object.fromEntries(SKILLS.map((s) => [s.key, s.name]));
const lvlIdx = (l) => LEVELS.indexOf(String(l));
const clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, x));
const r1 = (x) => Math.round(x * 10) / 10;
const avg = (a) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0);
export const subjectName = (k) => SUBJECT_NAME[k] || k;

// ---------------------------------------------------------------- Skills
export function skillState(student) {
  const sh = student.skillHistory;
  const now = sh.at(-1);
  const first = sh[0];
  const out = {};
  for (const { key } of SKILLS) {
    const slope = sh.length > 1 ? (now[key] - first[key]) / (sh.length - 1) : 0;
    out[key] = { now: now[key], slope: r1(slope), projectedF5: Math.round(clamp(now[key] + slope * Math.max(0, 5 - now.form), 20, 99)) };
  }
  return out;
}

// ---------------------------------------------------------------- F.3 Elective fit engine
function juniorStrength(student, e) {
  const junior = student.history.filter((h) => h.form <= 3);
  let tot = 0; let wsum = 0;
  junior.forEach((h, i) => {
    const recency = 1 + i * 0.35; // later terms count more
    for (const [subj, w] of Object.entries(e.junior)) {
      if (h.scores[subj] != null) { tot += h.scores[subj] * w * recency; wsum += w * recency; }
    }
  });
  return wsum ? tot / wsum : 0;
}

export function electiveFit(student) {
  const skills = skillState(student);
  const ranking = ELECTIVES.map((e) => {
    const junior = juniorStrength(student, e);
    let skillMatch = 0; let projected = 0;
    for (const [k, w] of Object.entries(e.skills)) { skillMatch += w * skills[k].now; projected += w * skills[k].projectedF5; }
    const taster = student.tasterResults?.[e.key];
    const tasterPct = taster ? taster.pct : null;
    // Tasters are easier than F.5: discount them, and weight projected skills more.
    const tasterAdj = tasterPct != null ? tasterPct * 0.85 : null;
    const fit = tasterAdj != null
      ? 0.4 * junior + 0.2 * tasterAdj + 0.4 * projected
      : 0.45 * junior + 0.55 * projected;
    const gateSkill = skills[e.gate.skill];
    const reasons = [];
    let risk = 0;
    if (gateSkill.projectedF5 < e.gate.min - 3) {
      risk += 2;
      reasons.push(`${SKILL_NAME[e.gate.skill]} projected at ${gateSkill.projectedF5} by F.5 (needs ≈${e.gate.min}); trend ${gateSkill.slope >= 0 ? '+' : ''}${gateSkill.slope}/yr.`);
    } else if (gateSkill.projectedF5 < e.gate.min + 3) {
      risk += 1;
      reasons.push(`${SKILL_NAME[e.gate.skill]} is borderline for F.5 demands (${gateSkill.projectedF5} vs ≈${e.gate.min}).`);
    }
    if (tasterPct != null && tasterPct - junior > 18 && junior < 70) {
      risk += 1;
      reasons.push(`Taster score (${tasterPct}%) is far above F.1–F.3 record (${Math.round(junior)}) — taster content may be flattering.`);
    }
    if (junior < 55) { risk += 1; reasons.push(`Related junior subjects average only ${Math.round(junior)}.`); }
    if (reasons.length) reasons.push(e.f5Demands);
    return {
      key: e.key, name: e.name, zh: e.zh, short: e.short,
      fit: Math.round(fit), junior: Math.round(junior), skillMatch: Math.round(skillMatch), projected: Math.round(projected),
      tasterPct, tasterAttempted: Boolean(taster),
      dropRisk: risk >= 2 ? 'High' : risk === 1 ? 'Medium' : 'Low', riskReasons: reasons,
    };
  }).sort((a, b) => b.fit - a.fit);

  const recommended = pickCombination(ranking, skills);
  const chosen = (student.electiveChoices || []).map((k) => ranking.find((x) => x.key === k)).filter(Boolean);
  return {
    skills, ranking, recommended,
    choices: { keys: student.electiveChoices || [], evaluation: chosen, comboWarnings: comboWarnings(student.electiveChoices || [], skills) },
  };
}

function comboWarnings(keys, skills) {
  const w = [];
  const has = (k) => keys.includes(k);
  if (has('PHY') && has('CHEM') && skills.quantitative.projectedF5 < 68) {
    w.push({ level: 'High', text: `Physics + Chemistry together with a projected quantitative score of ${skills.quantitative.projectedF5}: two calculation-heavy papers compound the same weakness.` });
  }
  if (has('PHY') && has('CHEM') && has('BIO')) {
    w.push({ level: 'Medium', text: 'Triple science = the heaviest F.5 workload (3 SBAs/practical assessments). Ensure this is driven by a goal (e.g. Medicine), not peer choice.' });
  }
  if (has('ECON') && has('BAFS')) {
    w.push({ level: 'Low', text: 'Econ + BAFS overlap (~20% content). Good synergy, but narrows university options outside Business.' });
  }
  const essayCount = keys.filter((k) => ['HIST', 'CHIST', 'GEOG', 'ECON'].includes(k)).length;
  if (essayCount >= 2 && skills.essay.projectedF5 < 60) {
    w.push({ level: 'High', text: `${essayCount} essay-based electives with projected essay argumentation of ${skills.essay.projectedF5}.` });
  }
  return w;
}

function pickCombination(ranking, skills) {
  const chosen = [];
  for (const r of ranking) {
    if (chosen.length === 3) break;
    if (r.dropRisk === 'High') continue;
    const trial = [...chosen.map((c) => c.key), r.key];
    if (comboWarnings(trial, skills).some((w) => w.level === 'High')) continue;
    chosen.push(r);
  }
  for (const r of ranking) { if (chosen.length >= 3) break; if (!chosen.includes(r)) chosen.push(r); }
  return chosen.map((c) => c.key);
}

// ---------------------------------------------------------------- F.6 Honest predictor
export function cohortOverPrediction(db) {
  const by = {};
  for (const row of db.cohortHistory) {
    (by[row.subject] ||= []).push(lvlIdx(row.schoolPredicted) - lvlIdx(row.actual));
  }
  // HKEAA reports with both levels feed the calibration too.
  for (const rep of db.reports) {
    if (rep.schoolPredictedLevel && rep.actualLevel) (by[rep.subject] ||= []).push(lvlIdx(rep.schoolPredictedLevel) - lvlIdx(rep.actualLevel));
  }
  return Object.fromEntries(Object.entries(by).map(([k, v]) => [k, { mean: r1(avg(v)), n: v.length }]));
}

const CUTS = [34, 45, 55, 65, 74, 82, 95];
function fractionalLevel(score) {
  if (score < CUTS[0]) return 1 + Math.max(0, score - 20) / 14;
  for (let i = 0; i < CUTS.length - 1; i++) {
    if (score < CUTS[i + 1]) return 2 + i + (score - CUTS[i]) / (CUTS[i + 1] - CUTS[i]);
  }
  return 7.4;
}

const HARSH_REASONS = ['Missing marking keywords', 'Incomplete elaboration', 'Data not cited', 'Misread command word'];

export function honestPrediction(student, db) {
  if (student.form !== 6) return null;
  const over = cohortOverPrediction(db);
  const mock = student.history.at(-1).scores;
  const skills = skillState(student);
  const rows = [];
  for (const [subj, schoolLevel] of Object.entries(student.schoolPredicted)) {
    if (subj === 'CSD') {
      rows.push({ subject: subj, name: subjectName(subj), school: schoolLevel === 'A' ? 'Attained' : 'Not Attained', honest: mock.CSD >= 45 ? 'Attained' : 'At risk', gap: 0, mock: mock.CSD, reasons: ['CSD is graded Attained / Not Attained.'], range: null });
      continue;
    }
    const reasons = [];
    const bias = over[subj]?.mean ?? 0.6;
    reasons.push(`Past ${over[subj]?.n ?? 0} cohort results: school predictions in this subject ran ${bias.toFixed(1)} level(s) above actual HKDSE.`);
    const subjMistakes = student.mistakes.filter((m) => m.subject === subj && m.form >= 4);
    const lost = subjMistakes.reduce((a, m) => a + m.marksLost, 0);
    const harsh = subjMistakes.filter((m) => HARSH_REASONS.includes(m.reason)).reduce((a, m) => a + m.marksLost, 0);
    let penalty = 0;
    if (lost > 0 && harsh / lost > 0.45) {
      penalty += 0.4;
      reasons.push(`${Math.round((harsh / lost) * 100)}% of marks lost are mark-scheme issues (keywords, elaboration, data citation) that HKEAA markers penalise more strictly than school markers.`);
    }
    const e = ELECTIVE_MAP[subj];
    const essayWeight = e?.skills?.essay ?? (subj === 'CHI' || subj === 'ENG' ? 0.5 : 0);
    if (essayWeight >= 0.3 && skills.essay.now < 60) {
      penalty += 0.3;
      reasons.push(`Essay argumentation (${skills.essay.now}) is below the level extended-response questions require.`);
    }
    if (skills.quantitative.slope < -2 && ['PHY', 'CHEM', 'MATH', 'BAFS', 'ICT'].includes(subj)) {
      penalty += 0.3;
      reasons.push(`Quantitative trend is falling (${skills.quantitative.slope}/yr).`);
    }
    penalty = Math.min(penalty, 0.5);
    // Continuous level from the mock mark, then cohort deflation + mark-scheme penalty.
    const raw = Math.min(fractionalLevel(mock[subj]), lvlIdx(schoolLevel) + 0.49) - bias * 0.75 - penalty;
    const honestIdx = clamp(Math.min(Math.round(raw), lvlIdx(schoolLevel)), 1, 7);
    rows.push({
      subject: subj, name: subjectName(subj), school: schoolLevel, honest: LEVELS[honestIdx], gap: lvlIdx(schoolLevel) - honestIdx,
      mock: mock[subj], range: [LEVELS[clamp(Math.floor(raw - 0.4), 1, 7)], LEVELS[clamp(Math.ceil(raw + 0.2), 1, 7)]], reasons,
      confidence: Math.round(clamp(0.55 + Math.min(over[subj]?.n ?? 0, 60) / 200 + (subjMistakes.length > 2 ? 0.08 : 0), 0, 0.92) * 100),
    });
  }
  const order = ['CHI', 'ENG', 'MATH', 'CSD', ...(student.electives || [])];
  rows.sort((a, b) => order.indexOf(a.subject) - order.indexOf(b.subject));
  const school = Object.fromEntries(rows.filter((r) => r.subject !== 'CSD').map((r) => [r.subject, r.school]));
  const honest = Object.fromEntries(rows.filter((r) => r.subject !== 'CSD').map((r) => [r.subject, r.honest]));
  return { rows, schoolBest5: best5(school), honestBest5: best5(honest), school, honest };
}

export function best5(levels) {
  return Object.entries(levels).filter(([k]) => k !== 'CSD').map(([, l]) => LEVEL_POINTS[l] ?? 0).sort((a, b) => b - a).slice(0, 5).reduce((a, b) => a + b, 0);
}

// ---------------------------------------------------------------- Pathway simulator
function meetsReq(levels, req) {
  return Object.entries(req).every(([k, min]) => (LEVEL_POINTS[levels[k]] ?? 0) >= min);
}

export function evaluatePathways(student, levels, aspiration) {
  const score = best5(levels);
  const electives = student.electives || [];
  const jupas = JUPAS.map((p) => {
    const missing = [];
    if (!meetsReq(levels, p.req)) missing.push(`Core requirement ${Object.values(p.req).join('')}${Object.keys(p.req).length === 3 ? '2' : ''} (Chi/Eng/Maths) not met`);
    for (const group of p.prereq) {
      if (!group.some((k) => electives.includes(k) && (LEVEL_POINTS[levels[k]] ?? 0) >= 3)) missing.push(`Needs Level 3+ in ${group.map((k) => ELECTIVE_MAP[k]?.short || k).join(' / ')}`);
    }
    const gap = score - p.lq;
    let status;
    if (missing.length) status = 'Ineligible';
    else if (score >= p.median + 1) status = 'Safe';
    else if (score >= p.lq) status = 'Match';
    else if (score >= p.lq - 3) status = 'Reach';
    else status = 'Unrealistic';
    return { ...p, gap, status, missing };
  });
  const eligibleSub = (LEVEL_POINTS[levels.CHI] ?? 0) >= 2 && (LEVEL_POINTS[levels.ENG] ?? 0) >= 2 &&
    Object.entries(levels).filter(([k, l]) => k !== 'CSD' && (LEVEL_POINTS[l] ?? 0) >= 2).length >= 5;
  const subdegree = SUBDEGREE.map((s) => {
    const ok = s.minScore === 0 ? true : eligibleSub;
    return {
      ...s, status: ok ? (s.minScore === 0 ? 'Fallback' : 'Eligible') : 'Not yet (needs 5 × Level 2 incl. Chi & Eng)',
      fieldMatch: s.field === aspiration || s.field === 'Any',
    };
  }).sort((a, b) => Number(b.fieldMatch) - Number(a.fieldMatch) || Number(b.status === 'Eligible') - Number(a.status === 'Eligible'));
  return { levels, best5: score, jupas, subdegree, eligibleSubdegree: eligibleSub };
}

export function pathwayPlan(student, db, overrideLevels) {
  const hp = honestPrediction(student, db);
  const levels = overrideLevels || hp.honest;
  const sim = evaluatePathways(student, levels, student.aspiration);
  const schoolSim = evaluatePathways(student, hp.school, student.aspiration);
  const choices = (student.jupasChoices || []).map((id, i) => {
    const h = sim.jupas.find((p) => p.id === id);
    const s = schoolSim.jupas.find((p) => p.id === id);
    return { band: 'ABCDE'[i] || '-', id, inst: h.inst, name: h.name, zh: h.zh, lq: h.lq, median: h.median, honestStatus: h.status, schoolStatus: s.status, honestGap: h.gap, schoolGap: s.gap, missing: h.missing };
  });
  // Dual-track recommendation: 1–2 reach, 2 match, 1–2 safe + sub-degree safety nets.
  const fieldFirst = (a, b) => Number(b.field === student.aspiration) - Number(a.field === student.aspiration);
  const byStatus = (st) => sim.jupas.filter((p) => p.status === st).sort((a, b) => fieldFirst(a, b) || b.median - a.median);
  const recommended = [
    ...byStatus('Reach').slice(0, 1), ...byStatus('Match').slice(0, 2), ...byStatus('Safe').slice(0, 2),
  ];
  if (recommended.length < 5) recommended.push(...byStatus('Reach').slice(1, 1 + 5 - recommended.length));
  const safetyNet = sim.subdegree.filter((s) => s.status !== 'Not yet (needs 5 × Level 2 incl. Chi & Eng)').slice(0, 3);
  return { honest: hp, simulation: sim, schoolSimulation: { best5: schoolSim.best5 }, choices, recommended: recommended.map((p) => p.id), safetyNet: safetyNet.map((s) => s.id) };
}

// ---------------------------------------------------------------- Teacher triage
export function triage(db) {
  return db.students.map((s) => {
    const latest = s.history.at(-1);
    const prev = s.history.at(-3) || s.history[0];
    const strengths = Object.entries(latest.scores).sort((a, b) => b[1] - a[1]).slice(0, 2).map(([k, v]) => `${subjectName(k).split(' ').slice(0, -1).join(' ') || k} (${v})`);
    const alerts = [];
    const talking = [];
    let severity = 0;
    let summary = {};
    if (s.form === 3) {
      const fit = electiveFit(s);
      for (const ev of fit.choices.evaluation) {
        if (ev.dropRisk === 'High') { severity += 3; alerts.push({ level: 'High', type: 'Elective mismatch', text: `${ev.name}: ${ev.riskReasons[0]}` }); }
        else if (ev.dropRisk === 'Medium') { severity += 1; alerts.push({ level: 'Medium', type: 'Elective watch', text: `${ev.name}: ${ev.riskReasons[0]}` }); }
      }
      for (const w of fit.choices.comboWarnings) { severity += w.level === 'High' ? 3 : w.level === 'Medium' ? 1 : 0; if (w.level !== 'Low') alerts.push({ level: w.level, type: 'Combination', text: w.text }); }
      const untried = (s.electiveChoices || []).filter((k) => !s.tasterResults?.[k]);
      if (untried.length) { severity += 1; alerts.push({ level: 'Low', type: 'No taster', text: `Has not tried the Real DSE Taster for ${untried.map((k) => ELECTIVE_MAP[k].short).join(', ')}.` }); }
      const swap = fit.recommended.filter((k) => !(s.electiveChoices || []).includes(k));
      if (swap.length && alerts.some((a) => a.level === 'High')) talking.push(`Discuss alternative: ${swap.map((k) => ELECTIVE_MAP[k].name).join(', ')} (higher fit).`);
      const q = fit.skills.quantitative;
      if (q.slope < -3) talking.push(`Quantitative skills falling ${q.slope}/yr since F.1 — check Maths support.`);
      if (untried.length) talking.push('Ask student to complete the remaining Real DSE Tasters before final submission.');
      summary = { choices: s.electiveChoices, recommended: fit.recommended, topFit: fit.ranking.slice(0, 3).map((r) => `${r.short} ${r.fit}`) };
    } else {
      const plan = pathwayPlan(s, db);
      const hp = plan.honest;
      const gapLevels = hp.rows.reduce((a, r) => a + Math.max(0, r.gap || 0), 0);
      const top3 = plan.choices.slice(0, 3);
      const dangerous = top3.filter((c) => ['Unrealistic', 'Ineligible'].includes(c.honestStatus));
      const anySafe = plan.choices.some((c) => ['Safe', 'Match'].includes(c.honestStatus));
      if (dangerous.length >= 2) { severity += 4; alerts.push({ level: 'High', type: 'JUPAS gap', text: `${dangerous.length} of top-3 JUPAS choices out of reach on honest prediction (Best 5: ${hp.honestBest5} vs school ${hp.schoolBest5}).` }); }
      if (!anySafe) { severity += 2; alerts.push({ level: 'High', type: 'No safety', text: 'No Match/Safe JUPAS choice on honest prediction — needs sub-degree safety net.' }); }
      const eng = hp.rows.find((r) => r.subject === 'ENG');
      if (eng && lvlIdx(eng.honest) < 3) { severity += 3; alerts.push({ level: 'High', type: '3322 risk', text: `English honest prediction Level ${eng.honest} — below university minimum (3).` }); }
      const chi = hp.rows.find((r) => r.subject === 'CHI');
      if (chi && lvlIdx(chi.honest) < 3) { severity += 2; alerts.push({ level: 'Medium', type: '3322 risk', text: `Chinese honest prediction Level ${chi.honest}.` }); }
      if (gapLevels >= 6) { severity += 1; alerts.push({ level: 'Medium', type: 'Inflation', text: `School predictions exceed calibrated grades by ${gapLevels} levels in total.` }); }
      if (dangerous.length) talking.push(`Re-band JUPAS: move ${dangerous.map((d) => d.name).join(', ')} out of Band A/B or keep only one as a reach.`);
      if (!anySafe || dangerous.length >= 2) talking.push(`Prepare safety net: ${plan.safetyNet.map((id) => db && SUBDEGREE_NAME[id]).join('; ')}.`);
      const worst = hp.rows.filter((r) => r.gap > 0).sort((a, b) => b.gap - a.gap)[0];
      if (worst) talking.push(`Focus revision on ${worst.name.split(' ')[0]} — ${worst.reasons[1] || worst.reasons[0]}`);
      summary = { schoolBest5: hp.schoolBest5, honestBest5: hp.honestBest5, choices: plan.choices.map((c) => ({ band: c.band, name: `${c.inst} ${c.name}`, status: c.honestStatus })), electives: s.electives };
    }
    return {
      id: s.id, name: s.name, nameZh: s.nameZh, form: s.form, cls: s.cls, classNo: s.classNo,
      average: latest.average, averageDelta: latest.average - prev.average, percentile: latest.percentile,
      severity, risk: severity >= 6 ? 'High' : severity >= 2 ? 'Medium' : 'Low',
      alerts, strengths, talkingPoints: talking.slice(0, 3), summary,
      counselStatus: s.counselStatus, notes: s.notes, story: s.story,
    };
  }).sort((a, b) => b.severity - a.severity);
}
const SUBDEGREE_NAME = Object.fromEntries(SUBDEGREE.map((s) => [s.id, `${s.inst} ${s.name}`]));

// ---------------------------------------------------------------- HKEAA insights
export function effectiveLabel(it) {
  return it.human || it.ai || null;
}

export function reportStats(rep) {
  const total = rep.items.reduce((a, i) => a + i.maxMarks, 0);
  const got = rep.items.reduce((a, i) => a + i.awarded, 0);
  return {
    totalMarks: total, awarded: got, pct: total ? Math.round((got / total) * 100) : 0,
    verified: rep.items.filter((i) => i.status === 'verified').length,
    aiLabeled: rep.items.filter((i) => i.status === 'ai').length,
    unlabeled: rep.items.filter((i) => i.status === 'unlabeled').length,
  };
}

export function insights(db, { includeAi = true } = {}) {
  const cells = {}; // subject -> type -> {HKEAA:{max,got}, Internal:{max,got}}
  const reasons = {}; // reason -> marks lost (HKEAA)
  const reasonBySubject = {};
  let counted = 0; let verified = 0;
  const flatten = [];
  for (const rep of db.reports) {
    for (const it of rep.items) {
      const parts = it.human?.splits?.length ? it.human.splits.map((sp) => ({ ...sp, label: sp.label })) : [it];
      const lab = effectiveLabel(it);
      if (!lab) continue;
      if (!includeAi && it.status !== 'verified') continue;
      counted++; if (it.status === 'verified') verified++;
      for (const p of parts) {
        const type = p.questionType || lab.questionType;
        const reason = p.lossReason || lab.lossReason;
        const c = (((cells[rep.subject] ||= {})[type] ||= { HKEAA: { max: 0, got: 0, n: 0 }, Internal: { max: 0, got: 0, n: 0 } }))[rep.source === 'HKEAA' ? 'HKEAA' : 'Internal'];
        c.max += p.maxMarks; c.got += p.awarded; c.n++;
        const lost = p.maxMarks - p.awarded;
        if (rep.source === 'HKEAA' && lost > 0 && reason && !reason.startsWith('None')) {
          reasons[reason] = (reasons[reason] || 0) + lost;
          ((reasonBySubject[rep.subject] ||= {})[reason] = ((reasonBySubject[rep.subject] || {})[reason] || 0) + lost);
          flatten.push({ subject: rep.subject, type, reason, lost, topic: p.topic || lab.topic });
        }
      }
    }
  }
  const heatmap = [];
  for (const [subject, types] of Object.entries(cells)) {
    for (const [type, v] of Object.entries(types)) {
      const hk = v.HKEAA.max ? 1 - v.HKEAA.got / v.HKEAA.max : null;
      const internal = v.Internal.max ? 1 - v.Internal.got / v.Internal.max : null;
      heatmap.push({ subject, type, hkeaaLoss: hk == null ? null : Math.round(hk * 100), internalLoss: internal == null ? null : Math.round(internal * 100), gap: hk != null && internal != null ? Math.round((hk - internal) * 100) : null, n: v.HKEAA.n + v.Internal.n });
    }
  }
  const over = cohortOverPrediction(db);
  const overPrediction = Object.entries(over).map(([subject, v]) => ({ subject, name: subjectName(subject), ...v })).sort((a, b) => b.mean - a.mean);
  const reasonList = Object.entries(reasons).map(([reason, lost]) => ({ reason, lost })).sort((a, b) => b.lost - a.lost);

  // Actionable teaching adjustments: worst (subject, type) cells by HKEAA loss + leniency gap.
  const ADVICE = {
    'Missing marking keywords': 'Build a keyword bank from the last 3 HKEAA reports; require students to underline credited terms in every structured answer.',
    'Incomplete elaboration': "Teach the 'cause → mechanism → effect' chain explicitly; mark internal tests with HKEAA's 'max 1 for listing' rule.",
    'Data not cited': 'Make "quote two figures with units" a non-negotiable success criterion for every DBQ in class.',
    'Calculation / unit error': 'Deduct the final-answer mark for missing units in all internal tests — match HKEAA practice.',
    'Misread command word': 'Run 5-minute command-word warm-ups (State / Describe / Explain / Evaluate) and annotate stems before answering.',
    'Conceptual error': 'Use diagnostic MCs with misconception distractors at the start of each topic; reteach before moving on.',
    'Diagram error': 'Use a labelling checklist (axes, curves, equilibrium, arrows) and award 0 for unlabelled diagrams internally.',
    'Time management / blank': 'Introduce timed sections in F.5 uniform tests; train essay planning in 4 minutes.',
  };
  const recs = heatmap.filter((h) => h.hkeaaLoss != null).map((h) => {
    const rs = reasonBySubject[h.subject] || {};
    const sub = flatten.filter((f) => f.subject === h.subject && f.type === h.type);
    const tally = {};
    sub.forEach((f) => { tally[f.reason] = (tally[f.reason] || 0) + f.lost; });
    const top = Object.entries(tally).sort((a, b) => b[1] - a[1])[0]?.[0] || Object.entries(rs).sort((a, b) => b[1] - a[1])[0]?.[0];
    return { ...h, priority: h.hkeaaLoss + Math.max(0, h.gap || 0) * 1.5, topReason: top };
  }).sort((a, b) => b.priority - a.priority).slice(0, 6).map((h) => ({
    subject: h.subject, name: subjectName(h.subject), type: h.type, hkeaaLoss: h.hkeaaLoss, internalLoss: h.internalLoss, gap: h.gap, topReason: h.topReason,
    action: ADVICE[h.topReason] || 'Review exemplar scripts with students.',
    headline: `${subjectName(h.subject).split(' ')[0]} · ${h.type}: HKEAA loss ${h.hkeaaLoss}%${h.gap != null ? ` vs internal ${h.internalLoss}% (school ${h.gap > 0 ? 'more lenient by' : 'stricter by'} ${Math.abs(h.gap)} pts)` : ''}`,
  }));

  return {
    heatmap, reasons: reasonList, overPrediction, recommendations: recs,
    coverage: { itemsCounted: counted, verified, reports: db.reports.length },
    types: QUESTION_TYPES,
    subjects: [...new Set(heatmap.map((h) => h.subject))],
  };
}

// ---------------------------------------------------------------- Weakness profile (export)
export function weaknessProfile(student, db) {
  const groups = {};
  for (const m of student.mistakes) {
    const k = `${m.subject}|${m.topic}|${m.reason}`;
    (groups[k] ||= { subject: m.subject, subjectName: subjectName(m.subject), topic: m.topic, reason: m.reason, questionType: m.questionType, marksLost: 0, occurrences: 0, lastSeen: m.term });
    groups[k].marksLost += m.marksLost; groups[k].occurrences++; groups[k].lastSeen = m.term;
  }
  const topWeaknesses = Object.values(groups).sort((a, b) => b.marksLost - a.marksLost || b.occurrences - a.occurrences).slice(0, 6);
  const byType = {};
  const byReason = {};
  for (const m of student.mistakes) {
    byType[m.questionType] = (byType[m.questionType] || 0) + m.marksLost;
    byReason[m.reason] = (byReason[m.reason] || 0) + m.marksLost;
  }
  const skills = skillState(student);
  const hp = student.form === 6 ? honestPrediction(student, db) : null;
  const profile = {
    schema: 'pathlight.weakness-profile/v1',
    generatedAt: new Date().toISOString(),
    student: { id: student.id, displayName: student.name.split(' ')[0] + ' ' + student.name.split(' ').slice(-1)[0][0] + '.', form: `F.${student.form}`, curriculum: 'HKDSE' },
    form: student.form,
    subjects: student.form === 6 ? ['CHI', 'ENG', 'MATH', ...(student.electives || [])] : student.electiveChoices,
    skills: Object.fromEntries(Object.entries(skills).map(([k, v]) => [k, { current: v.now, trendPerYear: v.slope }])),
    topWeaknesses,
    marksLostByQuestionType: byType,
    marksLostByReason: byReason,
    hkeaaGaps: hp ? hp.rows.filter((r) => r.gap > 0).map((r) => ({ subject: r.subject, schoolPredicted: r.school, calibrated: r.honest, drivers: r.reasons.slice(1) })) : [],
    targets: hp ? { honestBest5: hp.honestBest5, schoolBest5: hp.schoolBest5 } : { electiveChoices: student.electiveChoices },
  };
  const contextPrompt = `You are my HKDSE revision tutor. I am a ${profile.student.form} student in Hong Kong.
My recurring mistakes (from my school's F.1–F.${student.form} records and HKEAA-style marking):
${topWeaknesses.map((w, i) => `${i + 1}. ${w.subjectName} — ${w.topic}: "${w.reason}" on ${w.questionType} questions (${w.marksLost} marks lost, ${w.occurrences}×)`).join('\n')}
Skill levels (0-100): ${Object.entries(profile.skills).map(([k, v]) => `${SKILL_NAME[k]} ${v.current} (${v.trendPerYear >= 0 ? '+' : ''}${v.trendPerYear}/yr)`).join(', ')}.
${hp ? `My calibrated Best-5 is ${hp.honestBest5} (school predicts ${hp.schoolBest5}).` : ''}
Give me short, DSE-style drills that target exactly these mark-scheme gaps, mark my answers strictly like an HKEAA marker, and tell me which marking point I missed.`;
  return { profile, contextPrompt };
}
