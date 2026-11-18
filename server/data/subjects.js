// Subject catalogue for HK secondary (F.1–F.3 junior curriculum, F.4–F.6 HKDSE).

export const JUNIOR_SUBJECTS = [
  { key: 'CHI', name: 'Chinese Language', zh: '中國語文' },
  { key: 'ENG', name: 'English Language', zh: '英國語文' },
  { key: 'MATH', name: 'Mathematics', zh: '數學' },
  { key: 'ISCI', name: 'Integrated Science', zh: '綜合科學' },
  { key: 'JGEOG', name: 'Geography', zh: '地理' },
  { key: 'JHIST', name: 'History', zh: '歷史' },
  { key: 'JCHIST', name: 'Chinese History', zh: '中國歷史' },
  { key: 'LS', name: 'Life & Society', zh: '生活與社會' },
  { key: 'COMP', name: 'Computer Literacy', zh: '電腦' },
  { key: 'DT', name: 'Design & Technology', zh: '設計與科技' },
  { key: 'JMUSIC', name: 'Music', zh: '音樂' },
  { key: 'JPE', name: 'Physical Education', zh: '體育' },
];

export const CORE_SUBJECTS = [
  { key: 'CHI', name: 'Chinese Language', zh: '中國語文' },
  { key: 'ENG', name: 'English Language', zh: '英國語文' },
  { key: 'MATH', name: 'Mathematics (Compulsory)', zh: '數學' },
  { key: 'CSD', name: 'Citizenship & Social Development', zh: '公民與社會發展' },
];

// The 12 senior electives. `junior` = which F.1–F.3 subjects predict success;
// `skills` = which cognitive skills the HKDSE papers reward; `f5Demands`
// describes what changes after the "easy" taster content.
export const ELECTIVES = [
  {
    key: 'PHY', name: 'Physics', zh: '物理', short: 'Phy',
    junior: { MATH: 0.5, ISCI: 0.5 },
    skills: { quantitative: 0.6, dataResponse: 0.25, memorization: 0.15 },
    f5Demands: 'F.5 Electricity & Magnetism and Paper 1B structured calculations demand multi-step algebra under time pressure.',
    gate: { skill: 'quantitative', min: 66 },
  },
  {
    key: 'CHEM', name: 'Chemistry', zh: '化學', short: 'Chem',
    junior: { ISCI: 0.6, MATH: 0.4 },
    skills: { quantitative: 0.4, memorization: 0.4, dataResponse: 0.2 },
    f5Demands: 'Mole calculations, organic reaction pathways and volumetric analysis combine heavy memorisation with quantitative work.',
    gate: { skill: 'quantitative', min: 62 },
  },
  {
    key: 'BIO', name: 'Biology', zh: '生物', short: 'Bio',
    junior: { ISCI: 0.6, ENG: 0.4 },
    skills: { memorization: 0.4, dataResponse: 0.35, essay: 0.25 },
    f5Demands: 'Paper 1B experimental-design and data-interpretation questions require precise scientific English, not just recall.',
    gate: { skill: 'dataResponse', min: 60 },
  },
  {
    key: 'ECON', name: 'Economics', zh: '經濟', short: 'Econ',
    junior: { MATH: 0.4, ENG: 0.3, LS: 0.3 },
    skills: { dataResponse: 0.35, quantitative: 0.3, essay: 0.35 },
    f5Demands: 'Macroeconomics (money creation, AD-AS) and Paper 2 extended responses need diagram fluency plus evaluative writing.',
    gate: { skill: 'essay', min: 60 },
  },
  {
    key: 'BAFS', name: 'Business, Accounting & Financial Studies', zh: '企業、會計與財務概論', short: 'BAFS',
    junior: { MATH: 0.5, ENG: 0.3, LS: 0.2 },
    skills: { quantitative: 0.45, dataResponse: 0.3, essay: 0.25 },
    f5Demands: 'Accounting module: adjustments, partnership and ratio analysis are long, error-sensitive calculations.',
    gate: { skill: 'quantitative', min: 58 },
  },
  {
    key: 'GEOG', name: 'Geography', zh: '地理', short: 'Geog',
    junior: { JGEOG: 0.6, ISCI: 0.2, ENG: 0.2 },
    skills: { dataResponse: 0.45, essay: 0.35, memorization: 0.2 },
    f5Demands: 'Map reading, resource interpretation and 1:20 000 topographic maps plus Paper 2 essays on specific case studies.',
    gate: { skill: 'dataResponse', min: 58 },
  },
  {
    key: 'HIST', name: 'History', zh: '歷史', short: 'Hist',
    junior: { JHIST: 0.6, ENG: 0.4 },
    skills: { essay: 0.55, memorization: 0.25, dataResponse: 0.2 },
    f5Demands: 'Paper 2 essays demand sustained argumentation with periodisation and evidence across 20th-century world history.',
    gate: { skill: 'essay', min: 62 },
  },
  {
    key: 'CHIST', name: 'Chinese History', zh: '中國歷史', short: 'CHist',
    junior: { JCHIST: 0.6, CHI: 0.4 },
    skills: { essay: 0.45, memorization: 0.45, dataResponse: 0.1 },
    f5Demands: 'Huge memorisation load across dynasties plus 論述題 requiring structured argument in written Chinese.',
    gate: { skill: 'memorization', min: 62 },
  },
  {
    key: 'ICT', name: 'Information & Communication Technology', zh: '資訊及通訊科技', short: 'ICT',
    junior: { COMP: 0.5, MATH: 0.5 },
    skills: { quantitative: 0.55, dataResponse: 0.25, memorization: 0.2 },
    f5Demands: 'Algorithm design, pseudocode tracing and SBA programming are logic-heavy — very different from F.3 office-software tasks.',
    gate: { skill: 'quantitative', min: 60 },
  },
  {
    key: 'DAT', name: 'Design & Applied Technology', zh: '設計與應用科技', short: 'DAT',
    junior: { DT: 0.6, MATH: 0.2, COMP: 0.2 },
    skills: { essay: 0.35, quantitative: 0.3, dataResponse: 0.35 },
    f5Demands: 'Written design-process justification and the SBA design folio carry heavy weighting — making things is only part of it.',
    gate: { skill: 'essay', min: 55 },
  },
  {
    key: 'MUSIC', name: 'Music', zh: '音樂', short: 'Music',
    junior: { JMUSIC: 0.8, CHI: 0.1, ENG: 0.1 },
    skills: { memorization: 0.35, dataResponse: 0.35, essay: 0.3 },
    f5Demands: 'Listening paper (score reading, harmony identification) plus composing and performing modules at Grade 5+ standard.',
    gate: { skill: 'dataResponse', min: 55 },
  },
  {
    key: 'PE', name: 'Physical Education', zh: '體育', short: 'PE',
    junior: { JPE: 0.5, ISCI: 0.3, ENG: 0.2 },
    skills: { memorization: 0.45, dataResponse: 0.3, essay: 0.25 },
    f5Demands: 'Two written papers on exercise physiology, biomechanics and sports psychology — 60% written exam, not just practical.',
    gate: { skill: 'memorization', min: 58 },
  },
];

export const ELECTIVE_MAP = Object.fromEntries(ELECTIVES.map((e) => [e.key, e]));
export const SUBJECT_NAME = Object.fromEntries(
  [...JUNIOR_SUBJECTS, ...CORE_SUBJECTS, ...ELECTIVES].map((s) => [s.key, `${s.name} ${s.zh}`]),
);

export const SKILLS = [
  { key: 'memorization', name: 'Memorisation', zh: '記憶' },
  { key: 'dataResponse', name: 'Data Response', zh: '資料回應' },
  { key: 'quantitative', name: 'Quantitative Reasoning', zh: '數量推理' },
  { key: 'essay', name: 'Essay Argumentation', zh: '論述寫作' },
];

// HKDSE levels, ordered, with JUPAS-style points (5** = 7 in this demo).
export const LEVELS = ['U', '1', '2', '3', '4', '5', '5*', '5**'];
export const LEVEL_POINTS = { U: 0, 1: 1, 2: 2, 3: 3, 4: 4, 5: 5, '5*': 6, '5**': 7 };

export const QUESTION_TYPES = [
  'MC', 'Short Structured', 'Data-Based (DBQ)', 'Calculation', 'Essay / Extended', 'Experimental Design', 'Diagram / Graph',
];

export const LOSS_REASONS = [
  'Conceptual error',
  'Missing marking keywords',
  'Incomplete elaboration',
  'Calculation / unit error',
  'Misread command word',
  'Data not cited',
  'Diagram error',
  'Time management / blank',
];

export const NUANCE_TAGS = [
  'ECF applicable',
  "Command word 'Explain' = cause + effect",
  'Unit mark',
  'Max 1 mark for listing',
  'Communication mark',
  'Must quote data with units',
  'Diagram labels required',
  'Alternative answer accepted',
  'Over-length / irrelevant',
];

export const TOPICS = {
  ECON: ['Demand & Supply', 'Market Intervention', 'Elasticity', 'Market Structure', 'Money & Banking', 'AD-AS / Macro', 'Trade', 'Efficiency & Equity'],
  PHY: ['Heat & Gases', 'Force & Motion', 'Wave Motion', 'Electricity & Magnetism', 'Radioactivity', 'Momentum'],
  CHEM: ['Microscopic World', 'Acids & Bases', 'Redox', 'Mole Calculation', 'Organic Chemistry', 'Chemical Equilibrium', 'Rate of Reaction'],
  BIO: ['Cells & Molecules', 'Genetics & Evolution', 'Organisms & Environment', 'Health & Diseases', 'Photosynthesis & Respiration', 'Coordination & Response'],
  BAFS: ['Business Environment', 'Management', 'Financial Accounting', 'Cost Accounting', 'Ratio Analysis', 'Personal Finance'],
  GEOG: ['Map Reading', 'Rivers & Coasts', 'Climate Change', 'Urbanisation', 'Industry Location', 'Food Problems'],
  HIST: ['Modernisation of HK', 'Japan & Asia', 'World Wars', 'Cold War', 'International Cooperation'],
  CHIST: ['先秦', '秦漢', '隋唐', '宋元', '明清', '近代中國'],
  ICT: ['Algorithms & Pseudocode', 'Databases', 'Networking', 'Computer Systems', 'Social Implications'],
  ENG: ['Reading', 'Writing', 'Listening & Integrated Skills', 'Speaking'],
  MATH: ['Algebra', 'Functions', 'Geometry', 'Probability & Statistics', 'Trigonometry'],
  CHI: ['閱讀', '寫作', '聆聽及綜合', '說話'],
  DAT: ['Design Process', 'Materials', 'Electronics', 'Project'],
  MUSIC: ['Listening', 'Performing', 'Composing'],
  PE: ['Exercise Physiology', 'Biomechanics', 'Sports Psychology', 'Sports Management'],
};
