// Indicative programme data for the demo. Scores use a simple Best-5 scale
// (5** = 7, 5* = 6, 5 = 5 ... 1 = 1). Figures are illustrative demo values
// shaped like published admission statistics — NOT official JUPAS data.

export const JUPAS = [
  { id: 'U01', inst: 'HKU', name: 'Medicine (MBBS)', zh: '內外全科醫學', field: 'Health', median: 33, lq: 32, req: { CHI: 3, ENG: 3, MATH: 2 }, prereq: [['CHEM']], weightedNote: 'Chem + Bio favoured' },
  { id: 'U02', inst: 'CUHK', name: 'Global Business Studies', zh: '環球商業學', field: 'Business', median: 31, lq: 30, req: { CHI: 3, ENG: 4, MATH: 3 }, prereq: [] },
  { id: 'U03', inst: 'HKU', name: 'Economics & Finance', zh: '經濟及金融', field: 'Business', median: 29, lq: 28, req: { CHI: 3, ENG: 4, MATH: 3 }, prereq: [] },
  { id: 'U04', inst: 'HKUST', name: 'Engineering (School-based)', zh: '工程學', field: 'Engineering', median: 27, lq: 25, req: { CHI: 3, ENG: 3, MATH: 3 }, prereq: [['PHY', 'CHEM', 'ICT']] },
  { id: 'U05', inst: 'CUHK', name: 'Pharmacy', zh: '藥劑學', field: 'Health', median: 28, lq: 27, req: { CHI: 3, ENG: 3, MATH: 2 }, prereq: [['CHEM']] },
  { id: 'U06', inst: 'PolyU', name: 'Accountancy', zh: '會計學', field: 'Business', median: 25, lq: 24, req: { CHI: 3, ENG: 3, MATH: 3 }, prereq: [] },
  { id: 'U07', inst: 'PolyU', name: 'Nursing', zh: '護理學', field: 'Health', median: 23, lq: 22, req: { CHI: 3, ENG: 3, MATH: 2 }, prereq: [['BIO', 'CHEM']] },
  { id: 'U08', inst: 'CityU', name: 'Computer Science', zh: '電腦科學', field: 'Engineering', median: 23, lq: 21, req: { CHI: 3, ENG: 3, MATH: 3 }, prereq: [] },
  { id: 'U09', inst: 'HKBU', name: 'Communication (Journalism)', zh: '傳理學', field: 'Arts & Social Sci', median: 23, lq: 22, req: { CHI: 3, ENG: 3, MATH: 2 }, prereq: [] },
  { id: 'U10', inst: 'CityU', name: 'Business Administration', zh: '工商管理', field: 'Business', median: 22, lq: 21, req: { CHI: 3, ENG: 3, MATH: 2 }, prereq: [] },
  { id: 'U11', inst: 'LingnanU', name: 'Social Sciences', zh: '社會科學', field: 'Arts & Social Sci', median: 21, lq: 20, req: { CHI: 3, ENG: 3, MATH: 2 }, prereq: [] },
  { id: 'U12', inst: 'EdUHK', name: 'Education (Geography / History)', zh: '教育學', field: 'Education', median: 20, lq: 19, req: { CHI: 3, ENG: 3, MATH: 2 }, prereq: [['GEOG', 'HIST', 'CHIST']] },
  { id: 'U13', inst: 'HKMU', name: 'Applied Science (Nursing-related)', zh: '應用科學', field: 'Health', median: 19, lq: 18, req: { CHI: 3, ENG: 3, MATH: 2 }, prereq: [] },
  { id: 'U14', inst: 'PolyU', name: 'Physical Education & Sport Science (EdUHK-type)', zh: '體育及運動科學', field: 'Education', median: 20, lq: 18, req: { CHI: 3, ENG: 3, MATH: 2 }, prereq: [] },
  { id: 'U15', inst: 'HKMU', name: 'Business Management', zh: '商業管理', field: 'Business', median: 18, lq: 17, req: { CHI: 3, ENG: 3, MATH: 2 }, prereq: [] },
  { id: 'U16', inst: 'HSUHK', name: 'Supply Chain Management', zh: '供應鏈管理', field: 'Business', median: 18, lq: 17, req: { CHI: 3, ENG: 3, MATH: 2 }, prereq: [] },
];

// Sub-degree: Associate Degree (Asso 副學士) & Higher Diploma (HD 高級文憑).
export const SUBDEGREE = [
  { id: 'S01', inst: 'HKU SPACE Community College', type: 'Associate', name: 'Associate of Business Administration', zh: '工商管理副學士', field: 'Business', minScore: 10, req: { CHI: 2, ENG: 2 }, articulation: 'Senior-year entry to HKU / CityU / PolyU business programmes', articulationRate: 0.38 },
  { id: 'S02', inst: 'PolyU HKCC', type: 'Associate', name: 'Associate in Engineering', zh: '工程副學士', field: 'Engineering', minScore: 10, req: { CHI: 2, ENG: 2 }, articulation: 'Senior-year places in PolyU Engineering', articulationRate: 0.42 },
  { id: 'S03', inst: 'CUHK SCS', type: 'Associate', name: 'Associate of Arts in Social Sciences', zh: '社會科學副文學士', field: 'Arts & Social Sci', minScore: 10, req: { CHI: 2, ENG: 2 }, articulation: 'UGC-funded senior-year places (Social Sciences)', articulationRate: 0.33 },
  { id: 'S04', inst: 'HKBU CIE', type: 'Associate', name: 'Associate of Science (Health Studies)', zh: '健康研究副理學士', field: 'Health', minScore: 10, req: { CHI: 2, ENG: 2 }, articulation: 'Top-up to nursing / health science degrees', articulationRate: 0.35 },
  { id: 'S05', inst: 'VTC IVE', type: 'Higher Diploma', name: 'HD in Nursing (Enrolled Nurse track)', zh: '護理學高級文憑', field: 'Health', minScore: 10, req: { CHI: 2, ENG: 2 }, articulation: 'THEi / overseas top-up; direct employment in Hospital Authority', articulationRate: 0.28 },
  { id: 'S06', inst: 'VTC IVE', type: 'Higher Diploma', name: 'HD in Software Engineering', zh: '軟件工程高級文憑', field: 'Engineering', minScore: 10, req: { CHI: 2, ENG: 2 }, articulation: 'THEi / CityU senior-year entry', articulationRate: 0.3 },
  { id: 'S07', inst: 'HKU SPACE Community College', type: 'Higher Diploma', name: 'HD in Accounting', zh: '會計學高級文憑', field: 'Business', minScore: 10, req: { CHI: 2, ENG: 2 }, articulation: 'HKMU / PolyU accounting top-up; HKICPA pathway', articulationRate: 0.36 },
  { id: 'S08', inst: 'HKCC', type: 'Associate', name: 'Associate in Education Studies', zh: '教育研究副學士', field: 'Education', minScore: 10, req: { CHI: 2, ENG: 2 }, articulation: 'EdUHK senior-year entry', articulationRate: 0.31 },
  { id: 'S09', inst: 'CUHK SCS', type: 'Higher Diploma', name: 'HD in Sports Coaching & Management', zh: '運動教練及管理高級文憑', field: 'Education', minScore: 10, req: { CHI: 2, ENG: 2 }, articulation: 'HKBU / EdUHK sports-science top-up', articulationRate: 0.25 },
  { id: 'S10', inst: 'VTC Youth College', type: 'Diploma (Foundation)', name: 'Diploma of Foundation Studies', zh: '基礎課程文憑', field: 'Any', minScore: 0, req: {}, articulation: 'Equivalent to DSE 22222 for HD entry the following year', articulationRate: 0.6 },
];
