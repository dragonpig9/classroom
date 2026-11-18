// Deterministic seed generator — the same realistic dataset every boot.
import { ELECTIVES, ELECTIVE_MAP, JUNIOR_SUBJECTS, TOPICS, LEVELS } from './data/subjects.js';
import { JUPAS } from './data/programmes.js';
import { TASTERS, gradeQuestion } from './data/tasters.js';
import { simulateClassify } from './ai.js';

function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
let rand = mulberry32(20261118);
const r = () => rand();
const gauss = () => { const u = 1 - r(); const v = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
const pick = (arr) => arr[Math.floor(r() * arr.length)];
const clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, x));
const round1 = (x) => Math.round(x * 10) / 10;

// Which cognitive skills each subject draws on.
const SUBJECT_SKILL = {
  CHI: { essay: 0.5, memorization: 0.3, dataResponse: 0.2 },
  ENG: { essay: 0.5, dataResponse: 0.5 },
  MATH: { quantitative: 1 },
  ISCI: { quantitative: 0.4, memorization: 0.4, dataResponse: 0.2 },
  JGEOG: { dataResponse: 0.6, memorization: 0.4 },
  JHIST: { essay: 0.5, memorization: 0.5 },
  JCHIST: { memorization: 0.6, essay: 0.4 },
  LS: { essay: 0.5, dataResponse: 0.5 },
  COMP: { quantitative: 0.6, memorization: 0.4 },
  DT: { quantitative: 0.4, dataResponse: 0.6 },
  JMUSIC: { memorization: 0.5, dataResponse: 0.5 },
  JPE: { memorization: 1 },
  CSD: { essay: 0.5, dataResponse: 0.5 },
  ...Object.fromEntries(ELECTIVES.map((e) => [e.key, e.skills])),
};
const TALENT_SUBJECTS = ['JMUSIC', 'JPE', 'DT', 'COMP', 'JCHIST', 'JGEOG'];

const F3_NAMES = [
  ['Chan Tsz Ching', '陳芷晴', 'F'], ['Lee Ho Yin', '李浩然', 'M'], ['Cheung Wing Sze', '張詠詩', 'F'], ['Ng Chun Hei', '吳俊熙', 'M'],
  ['Lau Hiu Tung', '劉曉彤', 'F'], ['Leung Ka Chun', '梁家俊', 'M'], ['Ho Sze Wing', '何思穎', 'F'], ['Tam Pak Hin', '譚柏軒', 'M'],
  ['Yip Cheuk Yiu', '葉卓瑤', 'F'], ['Kwok Man Lok', '郭文樂', 'M'], ['Fung Hoi Ching', '馮凱晴', 'F'], ['Mak Chi Hang', '麥志恒', 'M'],
  ['Tsang Yan Ting', '曾欣婷', 'F'], ['Lam Tsz Long', '林子朗', 'M'], ['Siu Lok Yi', '蕭樂兒', 'F'], ['Choi Wai Kit', '蔡偉傑', 'M'],
];
const F6_NAMES = [
  ['Wong Ka Lok', '黃嘉樂', 'M'], ['Chow Hoi Lam', '周凱琳', 'F'], ['Yeung Tsz Hin', '楊子軒', 'M'], ['Lai Wing Yan', '黎詠欣', 'F'],
  ['Cheng Chun Yin', '鄭俊賢', 'M'], ['Kwan Ching Man', '關靜雯', 'F'], ['So Ka Ho', '蘇家豪', 'M'], ['Tang Hiu Yan', '鄧曉欣', 'F'],
  ['Law Chi Fung', '羅志峰', 'M'], ['Poon Sum Yee', '潘心怡', 'F'], ['Hui Long Hin', '許朗軒', 'M'], ['Wan Pui Kei', '溫佩琪', 'F'],
  ['Chu Ming Hei', '朱銘熙', 'M'], ['Lo Yuen Ting', '盧婉婷', 'F'], ['Ma Tsz Kit', '馬子傑', 'M'], ['Kong Sze Nga', '江思雅', 'F'],
];

// Scripted personas so the demo always shows the key stories.
const PERSONAS = {
  'Chan Tsz Ching': { a: 0.4, skills: { memorization: 80, dataResponse: 70, quantitative: 76, essay: 66 }, slopes: { quantitative: -8.5 }, choices: ['PHY', 'CHEM', 'BIO'], story: 'Picked triple science because friends did; F.3 quantitative trend falling sharply.' },
  'Lee Ho Yin': { a: 0.9, skills: { memorization: 70, dataResponse: 78, quantitative: 85, essay: 72 }, slopes: { quantitative: 2 }, choices: ['PHY', 'CHEM', 'ICT'] },
  'Cheung Wing Sze': { a: 0.3, skills: { memorization: 72, dataResponse: 70, quantitative: 55, essay: 82 }, slopes: { essay: 3 }, choices: ['HIST', 'CHIST', 'GEOG'] },
  'Ng Chun Hei': { a: -0.2, skills: { memorization: 58, dataResponse: 62, quantitative: 60, essay: 52 }, slopes: { essay: -4 }, choices: ['ECON', 'BAFS', 'HIST'], story: 'Parents prefer Econ + BAFS; weak essay argumentation trend.' },
  'Wong Ka Lok': { a: 0.25, skills: { memorization: 68, dataResponse: 64, quantitative: 66, essay: 54 }, slopes: { essay: -1.5, dataResponse: -1 }, electives: ['ECON', 'BAFS', 'GEOG'], jupasAmbition: 6, story: 'Targets HKU Econ & Fin based on school prediction.' },
  'Chow Hoi Lam': { a: 1.2, skills: { memorization: 88, dataResponse: 84, quantitative: 82, essay: 78 }, electives: ['BIO', 'CHEM', 'PHY'], jupasAmbition: 1 },
  'Yeung Tsz Hin': { a: -0.6, skills: { memorization: 55, dataResponse: 57, quantitative: 62, essay: 48 }, electives: ['ICT', 'PHY'], jupasAmbition: 7, story: 'Wants CS / Engineering; only 2 electives; Eng at risk of Level 2.' },
};

function skillAt(s, form) {
  const out = {};
  for (const k of Object.keys(s.skills0)) out[k] = clamp(s.skills0[k] + (s.slopes[k] || 0) * (form - 1) + gauss() * 1.5, 25, 98);
  return out;
}

function scoreFor(subject, s, skills, termIdx) {
  const w = SUBJECT_SKILL[subject] || { essay: 0.25, memorization: 0.25, dataResponse: 0.25, quantitative: 0.25 };
  let comp = 0; let tot = 0;
  for (const [k, v] of Object.entries(w)) { comp += skills[k] * v; tot += v; }
  comp /= tot;
  const base = 0.6 * comp + 0.4 * (64 + 11 * s.a) + (s.talent[subject] || 0) + gauss() * 3.2 - termIdx * 0.15;
  return Math.round(clamp(base, 22, 99));
}

const PCT = (score) => {
  // Percentile vs. a modelled cohort (mean 63, sd 13).
  const z = (score - 63) / 13;
  const t = 1 / (1 + 0.2316419 * Math.abs(z));
  const d = 0.3989423 * Math.exp((-z * z) / 2);
  const p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  return Math.round((z > 0 ? 1 - p : p) * 100);
};

function makeMistakes(s, maxForm, subjectsByForm) {
  const weak = Object.entries(s.skills0).map(([k, v]) => [k, v + (s.slopes[k] || 0) * (maxForm - 1)]).sort((a, b) => a[1] - b[1]);
  const weakest = weak[0][0];
  const second = weak[1][0];
  const reasonBySkill = {
    quantitative: ['Calculation / unit error', 'Conceptual error'],
    essay: ['Incomplete elaboration', 'Misread command word'],
    dataResponse: ['Data not cited', 'Diagram error'],
    memorization: ['Missing marking keywords', 'Conceptual error'],
  };
  const typeBySkill = {
    quantitative: ['Calculation', 'Short Structured'],
    essay: ['Essay / Extended', 'Short Structured'],
    dataResponse: ['Data-Based (DBQ)', 'Diagram / Graph'],
    memorization: ['MC', 'Short Structured'],
  };
  const out = [];
  const n = 12 + Math.floor(r() * 6);
  for (let i = 0; i < n; i++) {
    const form = 1 + Math.floor(r() * maxForm);
    const subs = subjectsByForm[form];
    const subject = pick(subs);
    const skill = r() < 0.55 ? weakest : r() < 0.6 ? second : pick(Object.keys(s.skills0));
    const topicKey = { ISCI: 'CHEM', JGEOG: 'GEOG', JHIST: 'HIST', JCHIST: 'CHIST', COMP: 'ICT', LS: 'ECON', DT: 'DAT', JMUSIC: 'MUSIC', JPE: 'PE', CSD: 'HIST' }[subject] || subject;
    out.push({
      id: `${s.id}-M${i + 1}`,
      form,
      term: `F.${form} ${r() < 0.5 ? 'T1' : 'T2'}`,
      subject,
      topic: pick(TOPICS[topicKey] || ['General']),
      questionType: pick(typeBySkill[skill]),
      reason: pick(reasonBySkill[skill]),
      skill,
      marksLost: 1 + Math.floor(r() * 4),
      source: form >= 6 ? 'Mock exam' : pick(['Uniform test', 'Term exam', 'Quiz']),
    });
  }
  return out.sort((a, b) => a.form - b.form);
}

function idxOfLevel(l) { return LEVELS.indexOf(l); }
export function schoolLevelFromScore(score) {
  // Internal (lenient) conversion used by the school's own prediction.
  if (score >= 82) return '5**';
  if (score >= 74) return '5*';
  if (score >= 65) return '5';
  if (score >= 55) return '4';
  if (score >= 45) return '3';
  if (score >= 34) return '2';
  return '1';
}

function makeStudent(nameTuple, form, idx) {
  const [name, nameZh, gender] = nameTuple;
  const p = PERSONAS[name] || {};
  const a = p.a ?? gauss() * 0.75;
  const skills0 = p.skills || {
    memorization: clamp(64 + 10 * a + gauss() * 9, 35, 95),
    dataResponse: clamp(63 + 10 * a + gauss() * 9, 35, 95),
    quantitative: clamp(62 + 11 * a + gauss() * 11, 30, 96),
    essay: clamp(60 + 10 * a + gauss() * 10, 30, 95),
  };
  const slopes = { memorization: gauss() * 1.5, dataResponse: gauss() * 1.5, quantitative: gauss() * 2.5, essay: gauss() * 2, ...(p.slopes || {}) };
  const talent = {};
  if (r() < 0.45) talent[pick(TALENT_SUBJECTS)] = 6 + r() * 10;
  const cls = form === 3 ? '3C' : '6C';
  const s = { id: `S${cls}${String(idx + 1).padStart(2, '0')}`, a, skills0, slopes, talent };

  const history = [];
  const skillHistory = [];
  const subjectsByForm = {};
  let electives = null;
  if (form === 6) {
    electives = p.electives || chooseByFit(s, r() < 0.8 ? 3 : 2, 0.25);
  }
  let termIdx = 0;
  for (let f = 1; f <= form; f++) {
    const sk = skillAt(s, f);
    skillHistory.push({ form: f, ...Object.fromEntries(Object.entries(sk).map(([k, v]) => [k, Math.round(v)])) });
    const subjects = f <= 3 ? JUNIOR_SUBJECTS.map((j) => j.key) : ['CHI', 'ENG', 'MATH', 'CSD', ...electives];
    subjectsByForm[f] = subjects;
    const terms = f === 6 ? ['T1', 'Mock'] : ['T1', 'T2'];
    for (const t of terms) {
      const scores = {};
      for (const sub of subjects) scores[sub] = scoreFor(sub, s, sk, termIdx);
      const avg = Math.round(Object.values(scores).reduce((x, y) => x + y, 0) / subjects.length);
      history.push({ label: `F.${f} ${t}`, form: f, term: t, scores, average: avg, percentile: PCT(avg) });
      termIdx++;
    }
  }

  const student = {
    id: s.id, name, nameZh, gender, form, cls, classNo: idx + 1,
    profile: { a: round1(a), skills0: mapRound(skills0), slopes: mapRound(slopes, 1), talent: mapRound(talent) },
    history, skillHistory,
    mistakes: makeMistakes(s, form, subjectsByForm),
    notes: [],
    counselStatus: 'pending',
    story: p.story || null,
  };

  if (form === 3) {
    student.electiveChoices = p.choices || chooseByFit(s, 3, 0.45);
    student.tasterResults = {};
    // ~70% of students already sampled a few tasters.
    if (r() < 0.75 || p.choices) {
      const tried = new Set([...student.electiveChoices.slice(0, 2 + Math.floor(r() * 2)), pick(ELECTIVES).key]);
      for (const subj of tried) student.tasterResults[subj] = simulateTaster(subj, s, skillHistory.at(-1));
    }
  } else {
    student.electives = electives;
    const mock = history.at(-1).scores;
    student.schoolPredicted = Object.fromEntries(
      Object.entries(mock).filter(([k]) => k !== 'CSD').map(([k, v]) => [k, schoolLevelFromScore(v)]),
    );
    student.schoolPredicted.CSD = mock.CSD >= 40 ? 'A' : 'NA';
    const ambition = p.jupasAmbition ?? Math.floor(r() * 5);
    student.jupasChoices = pickJupas(student, ambition);
    student.aspiration = pick(['Business', 'Health', 'Engineering', 'Arts & Social Sci', 'Education']);
    if (name === 'Wong Ka Lok') student.aspiration = 'Business';
    if (name === 'Yeung Tsz Hin') student.aspiration = 'Engineering';
  }
  return student;
}

function mapRound(o, d = 0) {
  const f = 10 ** d;
  return Object.fromEntries(Object.entries(o).map(([k, v]) => [k, Math.round(v * f) / f]));
}

function chooseByFit(s, n, noise) {
  const scored = ELECTIVES.map((e) => {
    let v = 0;
    for (const [k, w] of Object.entries(e.skills)) v += w * s.skills0[k];
    v += (s.talent[{ MUSIC: 'JMUSIC', PE: 'JPE', DAT: 'DT', ICT: 'COMP', CHIST: 'JCHIST', GEOG: 'JGEOG' }[e.key]] || 0) * 1.5;
    // popularity bias in HK schools
    if (['ECON', 'BIO', 'CHEM', 'BAFS', 'PHY'].includes(e.key)) v += 4;
    return [e.key, v + gauss() * noise * 25];
  }).sort((x, y) => y[1] - x[1]);
  return scored.slice(0, n).map((x) => x[0]);
}

function simulateTaster(subject, s, skills) {
  const qs = TASTERS[subject];
  const e = ELECTIVE_MAP[subject];
  let fit = 0;
  for (const [k, w] of Object.entries(e.skills)) fit += w * skills[k];
  // Tasters still look easier than F.5 reality: generous bonus.
  const pAns = clamp((fit + 12) / 100, 0.2, 0.97);
  let score = 0; let max = 0;
  for (const q of qs) { max += q.marks; score += Math.round(q.marks * clamp(pAns + gauss() * 0.15, 0, 1)); }
  return { score, max, pct: Math.round((score / max) * 100), attempts: 1, attemptedAt: '2026-10-1' + Math.floor(r() * 9), source: 'Taster lesson (seeded)' };
}

function pickJupas(student, ambition) {
  const preds = Object.entries(student.schoolPredicted).filter(([k]) => k !== 'CSD').map(([, l]) => idxOfLevel(l));
  const best5 = preds.sort((x, y) => y - x).slice(0, 5).reduce((x, y) => x + y, 0);
  const target = best5 + ambition * 0.7;
  const eligible = JUPAS.filter((p) => p.prereq.every((g) => g.some((k) => student.electives.includes(k))));
  const sorted = [...eligible].sort((x, y) => Math.abs(x.median - target) - Math.abs(y.median - target));
  return sorted.slice(0, 5).sort((x, y) => y.median - x.median).map((p) => p.id);
}

// ---------- Cohort calibration history & HKEAA reports ----------

const OVERPRED = { CHI: 0.8, ENG: 1.0, MATH: 0.5, ECON: 0.9, PHY: 0.6, CHEM: 0.8, BIO: 0.7, BAFS: 0.6, GEOG: 0.6, HIST: 0.8, CHIST: 0.7, ICT: 0.4, DAT: 0.3, MUSIC: 0.2, PE: 0.4 };

function makeCohortHistory() {
  const rows = [];
  for (const year of [2023, 2024, 2025]) {
    for (const [subject, bias] of Object.entries(OVERPRED)) {
      const n = 8 + Math.floor(r() * 8);
      for (let i = 0; i < n; i++) {
        const pred = clamp(Math.round(4 + gauss() * 1.1), 2, 7);
        const actual = clamp(Math.round(pred - (bias + gauss() * 0.6)), 1, 7);
        rows.push({ year, subject, alias: `Alumni ${year}-${subject}-${i + 1}`, schoolPredicted: LEVELS[pred], actual: LEVELS[actual] });
      }
    }
  }
  return rows;
}

// Hand-written report excerpts (HKEAA Examination Report style) for the
// labeling workspace.
const HAND_REPORTS = [
  {
    subject: 'ECON', year: 2025, paper: 'Paper 2', source: 'HKEAA', alias: 'Candidate 6C-2025-07', schoolPredictedLevel: '5', actualLevel: '4',
    items: [
      ['Q1(a)', 'With the aid of a demand-supply diagram, explain the effect of an effective price ceiling on the rental market.', 'Diagram axes not labelled; did not show Qd > Qs; shortage not named.', 4, 2],
      ['Q1(b)', 'Calculate the change in total revenue when price rises from $40 to $44 (Table 1).', 'Correct method but answer given without $ unit.', 2, 1],
      ['Q3', 'Refer to Figure 2. Describe the trend of HK real GDP growth between 2019 and 2024.', 'Did not quote data from Figure 2; vague description only.', 3, 1],
      ['Q5(b)', 'Explain how an increase in the required reserve ratio affects the money supply.', 'Missing the keyword "banking multiplier"; mechanism incomplete.', 4, 2],
      ['Q8', 'To what extent do you agree that a minimum wage improves equity in Hong Kong? Discuss.', 'One-sided argument; no evaluation of efficiency loss; superficial elaboration.', 8, 3],
      ['Q2', 'Multiple choice section summary: 30 items.', 'Common confusion between change in demand and change in quantity demanded.', 30, 21],
    ],
  },
  {
    subject: 'PHY', year: 2024, paper: 'Paper 1B', source: 'HKEAA', alias: 'Candidate 6C-2024-12', schoolPredictedLevel: '5*', actualLevel: '4',
    items: [
      ['Q2(a)', 'Calculate the resultant force on the 2 kg block on the rough inclined plane.', 'Wrong component of weight used (cos instead of sin); conceptual error.', 3, 1],
      ['Q4(b)', 'Explain, using kinetic theory, why the pressure of the gas increases.', 'Did not mention rate of collisions; missing key terms.', 3, 1],
      ['Q6', 'Design an experiment to determine the specific heat capacity of a metal block.', 'Did not state how to reduce heat loss; procedure incomplete.', 5, 2],
      ['Q7(c)', 'Sketch a graph of induced e.m.f. against time for the rotating coil.', 'Graph not labelled; phase incorrect.', 3, 1],
      ['Q9(a)', 'Find the current in the 3 Ω resistor.', 'Unit missing and wrong significant figures.', 2, 1],
    ],
  },
  {
    subject: 'BIO', year: 2025, paper: 'Paper 1B', source: 'HKEAA', alias: 'Candidate 6C-2025-03', schoolPredictedLevel: '5', actualLevel: '4',
    items: [
      ['Q3(a)', 'Design an investigation on the effect of temperature on enzyme activity.', 'Measured amount not rate; no control variable stated.', 5, 2],
      ['Q5', 'Refer to Table 3. Compare the rate of transpiration of the two leaves.', 'Did not quote data with units from Table 3.', 3, 1],
      ['Q7(b)', 'Explain why a person with type 1 diabetes has high blood glucose level.', 'Confused insulin with glucagon; conceptual error.', 4, 1],
      ['Q10', 'Essay: Discuss how the structure of the alveoli is adapted for gas exchange.', 'Listed features without explaining function; lacked elaboration.', 10, 5],
    ],
  },
  {
    subject: 'BAFS', year: 2025, paper: 'Paper 2B (Accounting)', source: 'HKEAA', alias: 'Candidate 6C-2025-15', schoolPredictedLevel: '4', actualLevel: '3',
    items: [
      ['Q1', 'Prepare the statement of profit or loss with the year-end adjustments.', 'Accrued expenses treated as prepaid; calculation error carried forward.', 10, 5],
      ['Q2(b)', 'Calculate the quick ratio and comment on liquidity.', 'Ratio correct; comment did not refer to the data.', 4, 2],
      ['Q4', 'Explain TWO advantages of a limited company for the café.', 'Listing only, no explanation — max 1 mark for listing.', 4, 1],
    ],
  },
  {
    subject: 'GEOG', year: 2024, paper: 'Paper 1', source: 'HKEAA', alias: 'Candidate 6C-2024-05', schoolPredictedLevel: '4', actualLevel: '3',
    items: [
      ['Q1(a)', 'Refer to the 1:20 000 map. Calculate the distance between spot height 145 and the church.', 'Unit conversion error (cm to m).', 2, 0],
      ['Q1(c)', 'With reference to Figure 1, describe the distribution of settlements.', 'No grid references or data quoted.', 4, 2],
      ['Q3', 'Explain how human activities have intensified the urban heat island effect.', 'Did not explain the mechanism; superficial.', 6, 3],
    ],
  },
  {
    subject: 'HIST', year: 2024, paper: 'Paper 1 (DBQ)', source: 'HKEAA', alias: 'Candidate 6C-2024-09', schoolPredictedLevel: '5', actualLevel: '3',
    items: [
      ['Q2(a)', 'What is the message of Source A? Explain your answer with reference to Source A.', 'Described the cartoon but did not state the message.', 3, 1],
      ['Q2(c)', 'Is Source C useful for understanding the Cold War in Europe? Explain.', 'Misread command word: discussed reliability not usefulness.', 6, 2],
      ['Q4', 'To what extent was the Marshall Plan the main cause of the Cold War? Discuss.', 'One-sided; weak periodisation; essay not attempted fully due to time.', 8, 2],
    ],
  },
  {
    subject: 'ECON', year: 2026, paper: 'Mock Paper 2', source: 'Internal', alias: '6C Mock 2026 (class set)', schoolPredictedLevel: null, actualLevel: null,
    items: [
      ['Q1(a)', 'Explain the effect of a price floor on the labour market with a diagram.', 'Diagram fine; explanation brief.', 4, 3],
      ['Q2', 'Refer to Table 2. Calculate the price elasticity of demand.', 'Formula inverted.', 3, 1],
      ['Q5', 'Discuss whether HK should adopt a progressive profits tax.', 'Good structure but no evaluation.', 8, 5],
      ['Q6', 'With reference to Figure 4, explain the change in unemployment rate.', 'No data cited from Figure 4.', 4, 2],
    ],
  },
  {
    subject: 'CHEM', year: 2026, paper: 'Uniform Test 1', source: 'Internal', alias: '5C Chemistry UT1 (class set)', schoolPredictedLevel: null, actualLevel: null,
    items: [
      ['Q1', 'Calculate the molarity of the hydrochloric acid used in the titration.', 'Did not convert cm3 to dm3.', 3, 1],
      ['Q3', 'State TWO observations when magnesium is added to copper(II) sulphate solution.', '"Copper formed" is not an observation.', 2, 1],
      ['Q5', 'Draw the electron diagram of carbon dioxide.', 'Only outermost shell required; diagram labels missing.', 2, 1],
      ['Q6', 'Explain why graphite conducts electricity but diamond does not.', 'Missing keyword "delocalised electrons".', 3, 1],
    ],
  },
];

// Synthetic historical reports so the cohort heatmap is dense.
const SYN_TEMPLATES = {
  'MC': { text: 'Multiple-choice section ({topic}).', comments: ['Confused similar concepts.', 'Misread the stem.'], max: 10 },
  'Short Structured': { text: 'State and explain ONE factor affecting {topic}.', comments: ['Missing marking keyword.', 'Explanation too brief.'], max: 4 },
  'Data-Based (DBQ)': { text: 'Refer to Figure {n}. Describe and explain the trend in {topic}.', comments: ['Data not quoted with units.', 'Did not refer to the source.'], max: 6 },
  'Calculation': { text: 'Calculate the value required for {topic}.', comments: ['Unit missing.', 'Formula misapplied.'], max: 3 },
  'Essay / Extended': { text: 'Essay: To what extent ... {topic}? Discuss.', comments: ['Lacked elaboration and evaluation.', 'One-sided argument.', 'Not completed — time.'], max: 10 },
  'Experimental Design': { text: 'Design an experiment to investigate {topic}.', comments: ['Control variables not stated.', 'Procedure incomplete.'], max: 5 },
  'Diagram / Graph': { text: 'Draw a labelled diagram to illustrate {topic}.', comments: ['Labels missing.', 'Axes incorrect.'], max: 3 },
};
const SUBJECT_TYPES = {
  ECON: ['MC', 'Short Structured', 'Data-Based (DBQ)', 'Calculation', 'Essay / Extended', 'Diagram / Graph'],
  PHY: ['MC', 'Calculation', 'Short Structured', 'Experimental Design', 'Diagram / Graph'],
  CHEM: ['MC', 'Calculation', 'Short Structured', 'Experimental Design', 'Essay / Extended'],
  BIO: ['MC', 'Short Structured', 'Data-Based (DBQ)', 'Experimental Design', 'Essay / Extended'],
  BAFS: ['MC', 'Calculation', 'Short Structured', 'Essay / Extended'],
  GEOG: ['MC', 'Data-Based (DBQ)', 'Short Structured', 'Essay / Extended', 'Diagram / Graph'],
  HIST: ['Data-Based (DBQ)', 'Essay / Extended', 'Short Structured'],
  ENG: ['Short Structured', 'Essay / Extended', 'Data-Based (DBQ)'],
};
// Base HKEAA loss rate per type (school internal marking is more lenient).
const TYPE_LOSS = { 'MC': 0.28, 'Short Structured': 0.4, 'Data-Based (DBQ)': 0.48, 'Calculation': 0.35, 'Essay / Extended': 0.55, 'Experimental Design': 0.52, 'Diagram / Graph': 0.42 };
const INTERNAL_LENIENCY = { 'MC': 0.02, 'Short Structured': 0.1, 'Data-Based (DBQ)': 0.14, 'Calculation': 0.05, 'Essay / Extended': 0.2, 'Experimental Design': 0.15, 'Diagram / Graph': 0.1 };

function buildRawText(rep) {
  const head = rep.source === 'HKEAA'
    ? `HKEAA ${rep.year} HKDSE Examination — ${rep.subject} ${rep.paper}\nCandidate: ${rep.alias}\nSchool predicted: ${rep.schoolPredictedLevel ?? '—'}   Final level: ${rep.actualLevel ?? '—'}\n`
    : `INTERNAL ASSESSMENT ${rep.year} — ${rep.subject} ${rep.paper}\nGroup: ${rep.alias}\n`;
  return head + '\nQuestion | Item | Marks | Examiner / marker comment\n' +
    rep.items.map((it) => `${it.label} | ${it.text} | ${it.awarded}/${it.maxMarks} | ${it.comment}`).join('\n');
}

function makeReports() {
  const reports = [];
  let rid = 1;
  const mk = (base, items, status) => {
    const rep = { id: `R${String(rid++).padStart(3, '0')}`, ...base, createdAt: `${base.year}-08-0${1 + (rid % 8)}`, items };
    rep.rawText = buildRawText(rep);
    const ai = simulateClassify(rep.subject, rep.items);
    rep.items.forEach((it, i) => {
      if (status === 'unlabeled') return;
      it.ai = ai[i];
      it.status = 'ai';
      if (status === 'verified') {
        it.human = { questionType: ai[i].questionType, topic: ai[i].topic, lossReason: ai[i].lossReason, nuances: ai[i].suggestedNuances || [], note: '', splits: [], verifiedBy: 'Ms. Leung (seed)' };
        it.status = 'verified';
      }
    });
    rep.aiEngine = status === 'unlabeled' ? null : 'simulation';
    reports.push(rep);
  };

  HAND_REPORTS.forEach((h, i) => {
    const items = h.items.map(([label, text, comment, maxMarks, awarded], j) => ({ id: `I${j + 1}`, label, text, comment, maxMarks, awarded, ai: null, human: null, status: 'unlabeled' }));
    const status = i < 2 ? 'verified' : i < 4 ? 'ai' : 'unlabeled';
    const { items: _, ...base } = h;
    mk(base, items, status);
  });

  // Synthetic: past cohorts' HKEAA + matching internal mocks (verified).
  for (const [subject, types] of Object.entries(SUBJECT_TYPES)) {
    const topicKey = subject;
    for (const year of [2023, 2024, 2025]) {
      for (const source of ['HKEAA', 'Internal']) {
        const items = [];
        types.forEach((type, j) => {
          const tpl = SYN_TEMPLATES[type];
          const loss = clamp(TYPE_LOSS[type] + (source === 'Internal' ? -INTERNAL_LENIENCY[type] : 0) + gauss() * 0.08 + (subject === 'HIST' && type === 'Essay / Extended' ? 0.08 : 0), 0.05, 0.9);
          const topic = pick(TOPICS[topicKey]);
          items.push({
            id: `I${j + 1}`,
            label: `Q${j + 1}`,
            text: tpl.text.replace('{topic}', topic).replace('{n}', String(j + 1)),
            comment: pick(tpl.comments),
            maxMarks: tpl.max,
            awarded: Math.round(tpl.max * (1 - loss)),
            ai: null, human: null, status: 'unlabeled',
          });
        });
        mk({
          subject, year, paper: source === 'HKEAA' ? 'Cohort summary' : 'Mock (cohort summary)', source,
          alias: source === 'HKEAA' ? `Cohort ${year} (n≈${18 + Math.floor(r() * 12)}) report extract` : `Cohort ${year} internal mock`,
          schoolPredictedLevel: null, actualLevel: null, synthetic: true,
        }, items, 'verified');
      }
    }
  }
  return reports;
}

export function buildSeed() {
  rand = mulberry32(20261118);
  const students = [
    ...F3_NAMES.map((n, i) => makeStudent(n, 3, i)),
    ...F6_NAMES.map((n, i) => makeStudent(n, 6, i)),
  ];
  // A couple of worked notes so the triage panel feels lived-in.
  students[2].notes.push({ at: '2026-10-21T08:30:00Z', by: 'Ms. Leung', text: 'Strong essay skills — encouraged History + Chinese History. Parents supportive.' });
  students[2].counselStatus = 'met';
  return {
    meta: { seededAt: new Date().toISOString(), school: 'PathLight Demo Secondary School 學途示範中學', teacher: 'Ms. Leung Wai Man 梁慧敏老師', version: 1 },
    students,
    cohortHistory: makeCohortHistory(),
    reports: makeReports(),
    syncLog: [],
    practiceSets: [],
  };
}

// Re-export for tests.
export { gradeQuestion };
