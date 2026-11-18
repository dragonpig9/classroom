// AI layer: live Claude when ANTHROPIC_API_KEY is set, otherwise a
// deterministic rule-based simulation so the demo always works on Render.
import Anthropic from '@anthropic-ai/sdk';
import { TOPICS, QUESTION_TYPES, LOSS_REASONS, NUANCE_TAGS, SUBJECT_NAME } from './data/subjects.js';

const MODEL = process.env.ANTHROPIC_MODEL || 'claude-opus-5-5';
let client = null;
export function aiEnabled() {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}
function getClient() {
  if (!client) client = new Anthropic({ timeout: 90_000, maxRetries: 1 });
  return client;
}
export function aiStatus() {
  return aiEnabled()
    ? { mode: 'live', provider: 'Anthropic', model: MODEL }
    : { mode: 'simulation', provider: 'Deterministic rules engine', model: null };
}

// ---------------- Deterministic simulation ----------------

const TYPE_RULES = [
  ['MC', /\b(mc|multiple[- ]choice)\b/i],
  ['Experimental Design', /(design (an|the)? ?(experiment|investigation)|investigat|procedure|fair test|control variable)/i],
  ['Essay / Extended', /(essay|to what extent|discuss|evaluate|論述|do you agree)/i],
  ['Calculation', /(calculate|find the|determine the value|how many|compute)/i],
  ['Diagram / Graph', /(diagram|draw|sketch|graph|plot)/i],
  ['Data-Based (DBQ)', /(refer to|source [a-z]|figure|table|according to|with reference to|資料)/i],
];
const REASON_RULES = [
  ['Time management / blank', /(not attempted|blank|time|not completed)/i],
  ['Calculation / unit error', /(unit|significant fig|s\.f\.|conver|calculation error|arithmetic|formula)/i],
  ['Diagram error', /(label|axes|axis|graph not|diagram)/i],
  ['Data not cited', /(quote|data|cite|refer to the|grid reference|figure \d|table \d|with units)/i],
  ['Misread command word', /(command word|misread|discussed .* not|asked for|instead of)/i],
  ['Missing marking keywords', /(keyword|key term|missing the|did not mention|not name|terminology|not an observation)/i],
  ['Conceptual error', /(conceptual|confus|wrong|incorrect|misconcept|inverted)/i],
  ['Incomplete elaboration', /(brief|superficial|elaborat|one-sided|listing|no evaluation|incomplete|vague|did not explain|without explaining)/i],
];
const NUANCE_RULES = [
  ['Unit mark', /unit/i],
  ['Max 1 mark for listing', /listing|listed/i],
  ["Command word 'Explain' = cause + effect", /explain|mechanism/i],
  ['Must quote data with units', /quote|data/i],
  ['Diagram labels required', /label/i],
  ['ECF applicable', /carried forward|ecf/i],
  ['Communication mark', /essay|structure|one-sided/i],
];

function topicFor(subject, text) {
  const list = TOPICS[subject] || [];
  const t = text.toLowerCase();
  const kw = {
    'Demand & Supply': ['demand', 'supply'], 'Market Intervention': ['ceiling', 'floor', 'minimum wage', 'quota', 'tax'],
    'Elasticity': ['elasticity', 'revenue'], 'Money & Banking': ['money', 'reserve', 'bank', 'monetary', 'hkma', 'exchange rate'], 'AD-AS / Macro': ['gdp', 'unemployment', 'inflation'],
    'Efficiency & Equity': ['equity', 'efficien'], 'Force & Motion': ['force', 'incline', 'motion', 'acceleration'],
    'Heat & Gases': ['gas', 'heat', 'kinetic', 'temperature'], 'Electricity & Magnetism': ['current', 'resistor', 'e.m.f', 'coil', 'emf'],
    'Mole Calculation': ['molarity', 'titration', 'mole'], 'Redox': ['magnesium', 'copper', 'redox'], 'Microscopic World': ['electron', 'graphite', 'diamond', 'structure'],
    'Health & Diseases': ['diabetes', 'insulin', 'disease'], 'Cells & Molecules': ['enzyme', 'cell', 'osmosis'], 'Organisms & Environment': ['transpiration', 'alveoli', 'gas exchange'],
    'Financial Accounting': ['profit or loss', 'adjustment', 'accrued', 'prepaid'], 'Ratio Analysis': ['ratio', 'liquidity'], 'Management': ['limited company', 'sole'],
    'Map Reading': ['map', 'spot height', 'grid'], 'Urbanisation': ['urban', 'settlement'], 'Climate Change': ['climate', 'heat island', 'greenhouse'],
    'Cold War': ['cold war', 'marshall', 'source'], 'World Wars': ['war'],
  };
  for (const topic of list) {
    if (t.includes(topic.toLowerCase())) return topic;
    if ((kw[topic] || []).some((k) => t.includes(k))) return topic;
  }
  return list[0] || 'General';
}

export function simulateClassify(subject, items) {
  return items.map((it) => {
    const text = `${it.label} ${it.text}`;
    const comment = it.comment || '';
    let questionType = 'Short Structured';
    let typeHits = 0;
    for (const [type, re] of TYPE_RULES) if (re.test(text)) { questionType = type; typeHits++; break; }
    if (/^q?\s*\d+\s*$/i.test(it.label) && /multiple-choice section|mc section/i.test(text)) questionType = 'MC';
    let lossReason = it.awarded >= it.maxMarks ? 'None (full marks)' : 'Incomplete elaboration';
    let reasonHits = 0;
    if (it.awarded < it.maxMarks) {
      for (const [reason, re] of REASON_RULES) if (re.test(comment)) { lossReason = reason; reasonHits++; break; }
    }
    const suggestedNuances = NUANCE_RULES.filter(([, re]) => re.test(comment + ' ' + it.text)).map(([n]) => n).slice(0, 3);
    const confidence = Math.round((0.55 + 0.18 * typeHits + 0.17 * reasonHits + (it.text.length > 40 ? 0.03 : 0)) * 100) / 100;
    return {
      questionType, topic: topicFor(subject, `${it.text} ${comment}`), lossReason,
      suggestedNuances, confidence: Math.min(confidence, 0.93), engine: 'simulation',
      rationale: `Type matched ${typeHits ? 'command-word rule' : 'default'}; loss reason ${reasonHits ? 'from examiner comment keywords' : 'defaulted'}.`,
    };
  });
}

// Parse pasted report text into items. Preferred format per line:
//   Q3(b) | question text | 2/4 | examiner comment
// Free-form lines containing "Qn ... x/y" are also accepted.
export function parseReportText(raw) {
  const items = [];
  const lines = String(raw || '').split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  for (const line of lines) {
    const label = line.match(/^(Q\s*\d+\s*(?:\([a-z0-9ivx]+\))*)/i);
    const marks = line.match(/(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)/);
    if (!label || !marks) continue;
    let text = ''; let comment = '';
    if (line.includes('|')) {
      const parts = line.split('|').map((p) => p.trim());
      text = parts[1] || '';
      comment = parts.slice(3).join(' | ') || '';
    } else {
      const before = line.slice(label[0].length, marks.index).replace(/^[\s:\-–.]+/, '');
      text = before.trim();
      comment = line.slice(marks.index + marks[0].length).replace(/^[\s:\-–.]+/, '').trim();
    }
    items.push({
      id: `I${items.length + 1}`, label: label[1].replace(/\s+/g, ''), text, comment,
      awarded: Number(marks[1]), maxMarks: Number(marks[2]), ai: null, human: null, status: 'unlabeled',
    });
  }
  return items;
}

// ---------------- Live Claude ----------------

function extractJson(text) {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const body = fenced ? fenced[1] : text;
  const start = Math.min(...['[', '{'].map((c) => { const i = body.indexOf(c); return i < 0 ? Infinity : i; }));
  const end = Math.max(body.lastIndexOf(']'), body.lastIndexOf('}'));
  return JSON.parse(body.slice(start, end + 1));
}

async function callClaude({ system, content, maxTokens = 8000 }) {
  const response = await getClient().messages.create({
    model: MODEL,
    max_tokens: maxTokens,
    output_config: { effort: 'low' },
    system,
    messages: [{ role: 'user', content }],
  });
  if (response.stop_reason === 'refusal') throw new Error('Model declined the request');
  return response.content.filter((b) => b.type === 'text').map((b) => b.text).join('\n');
}

const CLASSIFIER_SYSTEM = `You are an experienced HKDSE examiner and Hong Kong secondary-school subject panel head.
You label question-level mark data from HKEAA Examination Reports and in-school tests.
Reply with JSON only — no prose.`;

export async function recognizeItems(subject, items) {
  if (!aiEnabled()) return { engine: 'simulation', labels: simulateClassify(subject, items) };
  const topics = TOPICS[subject] || [];
  const prompt = `Subject: ${SUBJECT_NAME[subject] || subject}
Allowed questionType values: ${JSON.stringify(QUESTION_TYPES)}
Allowed topic values: ${JSON.stringify(topics)}
Allowed lossReason values: ${JSON.stringify([...LOSS_REASONS, 'None (full marks)'])}
Allowed nuance tags: ${JSON.stringify(NUANCE_TAGS)}

For each item below, return an object {"label", "questionType", "topic", "lossReason", "suggestedNuances" (0-3 tags), "confidence" (0-1), "rationale" (max 20 words)}.
Return a JSON array in the same order as the input.

Items:
${JSON.stringify(items.map(({ label, text, comment, awarded, maxMarks }) => ({ label, text, comment, awarded, maxMarks })), null, 1)}`;
  try {
    const out = extractJson(await callClaude({ system: CLASSIFIER_SYSTEM, content: prompt }));
    if (!Array.isArray(out) || out.length !== items.length) throw new Error('Label count mismatch');
    const fallback = simulateClassify(subject, items);
    const labels = out.map((o, i) => ({
      questionType: QUESTION_TYPES.includes(o.questionType) ? o.questionType : fallback[i].questionType,
      topic: o.topic || fallback[i].topic,
      lossReason: o.lossReason || fallback[i].lossReason,
      suggestedNuances: Array.isArray(o.suggestedNuances) ? o.suggestedNuances.filter((n) => NUANCE_TAGS.includes(n)) : [],
      confidence: Math.max(0, Math.min(1, Number(o.confidence) || 0.7)),
      rationale: String(o.rationale || '').slice(0, 200),
      engine: `claude:${MODEL}`,
    }));
    return { engine: `claude:${MODEL}`, labels };
  } catch (err) {
    console.warn('[ai] recognizeItems fell back to simulation:', err.message);
    return { engine: 'simulation (fallback after API error)', labels: simulateClassify(subject, items), error: err.message };
  }
}

// Extract items from an uploaded image/PDF or messy text.
export async function extractReport({ rawText, image }) {
  const parsed = parseReportText(rawText);
  if (!aiEnabled() || (!image && parsed.length)) {
    return { engine: 'simulation', items: parsed, note: image && !aiEnabled() ? 'Image stored; set ANTHROPIC_API_KEY to enable vision extraction. Parsed text instead.' : undefined };
  }
  try {
    const content = [];
    if (image) {
      const m = String(image).match(/^data:(image\/(?:png|jpeg|gif|webp)|application\/pdf);base64,(.+)$/);
      if (!m) throw new Error('Unsupported upload type');
      content.push(m[1] === 'application/pdf'
        ? { type: 'document', source: { type: 'base64', media_type: m[1], data: m[2] } }
        : { type: 'image', source: { type: 'base64', media_type: m[1], data: m[2] } });
    }
    content.push({ type: 'text', text: `Extract every question-level row from this HKEAA examination report / marked script.${rawText ? `\nTeacher notes / pasted text:\n${rawText}` : ''}
Return a JSON array of {"label": "Q3(b)", "text": question summary, "comment": examiner/marker comment or "", "awarded": number, "maxMarks": number}.` });
    const arr = extractJson(await callClaude({ system: CLASSIFIER_SYSTEM, content }));
    const items = arr.map((o, i) => ({ id: `I${i + 1}`, label: String(o.label || `Q${i + 1}`), text: String(o.text || ''), comment: String(o.comment || ''), awarded: Number(o.awarded) || 0, maxMarks: Number(o.maxMarks) || 1, ai: null, human: null, status: 'unlabeled' }));
    return { engine: `claude:${MODEL}`, items };
  } catch (err) {
    console.warn('[ai] extractReport fell back:', err.message);
    return { engine: 'simulation (fallback after API error)', items: parsed, error: err.message };
  }
}

// ---------------- Personalised practice generator ----------------

const DRILL_BANK = {
  'Calculation / unit error': (t) => [`Show every step and box your final answer WITH unit: a 3-step ${t} calculation (DSE Paper 1B style, 4 marks).`, `Error-spotting: a worked ${t} solution contains one unit slip and one rounding slip — find and fix both.`],
  'Missing marking keywords': (t) => [`Write a 3-mark answer on ${t} that uses at least THREE examiner keywords; then underline them.`, `Keyword flashcards: 8 HKEAA-credited terms for ${t} with one-line definitions.`],
  'Incomplete elaboration': (t) => [`PEEL drill: one point on ${t} → Point, Explain (cause → effect), Example from HK, Link back.`, `Upgrade a 1/4 answer on ${t} to 4/4 by adding the missing "because… therefore…" chain.`],
  'Data not cited': (t) => [`Given a table on ${t}, write a description that quotes TWO figures with units and one comparison (e.g. "rose by 1.3 °C").`, `Rewrite: replace vague words ("a lot", "increased") in a ${t} answer with exact data.`],
  'Misread command word': (t) => [`Command-word sort: 6 ${t} prompts — classify as State / Describe / Explain / Evaluate and write the expected answer length.`, `Answer the same ${t} stem twice: once for "Describe", once for "Explain". Compare mark allocation.`],
  'Conceptual error': (t) => [`Misconception check: 5 true/false statements on ${t}; justify each false one in one line.`, `Concept map for ${t}: link 6 key ideas with labelled arrows.`],
  'Diagram error': (t) => [`Draw and FULLY label a ${t} diagram (axes, curves, equilibrium points, arrows); check against the HKEAA labelling checklist.`],
  'Time management / blank': (t) => [`Timed sprint: plan a ${t} extended answer in 4 minutes (skeleton only), then write in 12.`],
};

export function simulatePractice(profile, count = 6) {
  const drills = [];
  const weak = profile.topWeaknesses || [];
  let i = 0;
  while (drills.length < count && weak.length) {
    const w = weak[i % weak.length];
    const gen = DRILL_BANK[w.reason] || DRILL_BANK['Conceptual error'];
    const options = gen(`${w.subjectName} — ${w.topic}`);
    const prompt = options[Math.floor(i / weak.length) % options.length];
    drills.push({
      id: `D${drills.length + 1}`, subject: w.subject, subjectName: w.subjectName, topic: w.topic,
      targets: w.reason, questionType: w.questionType,
      prompt, markScheme: `Mark-scheme focus: ${w.reason.toLowerCase()} — the #${(i % weak.length) + 1} recurring loss in your F.1–F.${profile.form} record (${w.marksLost} marks lost).`,
      difficulty: i < weak.length ? 'Core' : 'Stretch', minutes: 6 + (i % 3) * 4,
    });
    i++;
  }
  return drills;
}

export async function generatePractice(profile, count = 6) {
  if (!aiEnabled()) return { engine: 'simulation', drills: simulatePractice(profile, count) };
  const prompt = `You are an external revision AI (RevisionDojo-style) for a Hong Kong HKDSE student.
Here is the student's exported weakness profile:
${JSON.stringify(profile, null, 1)}

Generate ${count} targeted practice drills that attack the student's exact mistake tags and HKEAA mark-scheme gaps.
Return a JSON array of {"subject" (code), "subjectName", "topic", "targets" (loss reason targeted), "questionType", "prompt" (the actual question, DSE style, include marks), "markScheme" (concise HKEAA-style marking points), "difficulty" ("Core"|"Stretch"), "minutes" (number)}.`;
  try {
    const arr = extractJson(await callClaude({ system: 'You write precise HKDSE-style practice questions with mark schemes. Reply with JSON only.', content: prompt }));
    return { engine: `claude:${MODEL}`, drills: arr.slice(0, count).map((d, i) => ({ id: `D${i + 1}`, ...d })) };
  } catch (err) {
    console.warn('[ai] generatePractice fell back:', err.message);
    return { engine: 'simulation (fallback after API error)', drills: simulatePractice(profile, count), error: err.message };
  }
}
