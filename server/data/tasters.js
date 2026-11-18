// "Real HKDSE Tasters": DSE-style questions (original, written in the style of
// senior-form papers) with mark schemes that the server grades instantly.
//
// type: 'mc'         -> options[], answer (index)
//       'numeric'    -> answer, tolerance, unit (optional unit mark), marks
//       'structured' -> points[] each { keywords: [[alt, alt], ...], mark, desc }
//                       a point is awarded if EVERY keyword group has one alt
//                       present in the answer; capped at `marks`.

export const TASTERS = {
  PHY: [
    {
      id: 'PHY-1', type: 'mc', marks: 1, paper: 'Paper 1A (MC)', topic: 'Force & Motion',
      stem: 'A ball is thrown vertically upwards. Neglecting air resistance, which statement about the ball at its highest point is correct?',
      options: ['Velocity is zero and acceleration is zero', 'Velocity is zero and acceleration is 9.81 m s⁻² downwards', 'Velocity is maximum and acceleration is zero', 'Velocity is zero and the net force is zero'],
      answer: 1,
      explanation: 'Gravity still acts at the top, so a = g downwards even though v = 0.',
      trap: 'Classic DSE trap: "momentarily at rest" ≠ "in equilibrium". About 40% of F.4 candidates choose A.',
    },
    {
      id: 'PHY-2', type: 'numeric', marks: 3, paper: 'Paper 1B (Structured)', topic: 'Electricity & Magnetism',
      stem: 'Two resistors of 6 Ω and 3 Ω are connected in parallel across a 6 V battery of negligible internal resistance. Calculate the total current drawn from the battery (in A).',
      answer: 3, tolerance: 0.05, unit: 'A',
      scheme: ['1/R = 1/6 + 1/3 → R = 2 Ω  (1M)', 'I = V/R = 6/2  (1M)', '= 3 A with correct unit  (1A)'],
      trap: 'Adding resistors in series (9 Ω → 0.67 A) scores 0. Missing unit loses the final A mark.',
    },
    {
      id: 'PHY-3', type: 'structured', marks: 3, paper: 'Paper 1B (Structured)', topic: 'Heat & Gases',
      stem: 'Explain, using the kinetic theory, why the pressure of a fixed mass of gas in a sealed container increases when it is heated.',
      points: [
        { keywords: [['kinetic energy', 'k.e.', 'speed', 'faster']], mark: 1, desc: 'Average KE / speed of molecules increases' },
        { keywords: [['collide', 'collision', 'hit', 'bombard']], mark: 1, desc: 'Molecules collide with walls more frequently' },
        { keywords: [['force', 'momentum', 'harder']], mark: 1, desc: 'Each collision exerts a greater force (rate of change of momentum) on walls' },
      ],
      trap: 'Saying "molecules expand" is a conceptual error — awarded 0 for that line.',
    },
  ],
  CHEM: [
    {
      id: 'CHEM-1', type: 'mc', marks: 1, paper: 'Paper 1A (MC)', topic: 'Microscopic World',
      stem: 'Which of the following substances has a giant covalent structure?',
      options: ['Iodine', 'Silicon dioxide', 'Sodium chloride', 'Carbon dioxide'],
      answer: 1,
      explanation: 'SiO₂ is a giant covalent network; I₂ and CO₂ are simple molecular; NaCl is giant ionic.',
      trap: 'CO₂ vs SiO₂ — same group, completely different structures.',
    },
    {
      id: 'CHEM-2', type: 'numeric', marks: 3, paper: 'Paper 1B (Structured)', topic: 'Mole Calculation',
      stem: '25.0 cm³ of 0.100 M NaOH(aq) exactly neutralises 20.0 cm³ of HCl(aq). Calculate the molarity of the HCl(aq) (in M, 3 s.f.).',
      answer: 0.125, tolerance: 0.002, unit: 'M',
      scheme: ['mol NaOH = 0.100 × 25.0/1000 = 2.50×10⁻³  (1M)', 'mol ratio 1:1 → mol HCl = 2.50×10⁻³  (1M)', '[HCl] = 2.50×10⁻³ ÷ 0.0200 = 0.125 M  (1A)'],
      trap: 'Forgetting to convert cm³ → dm³ gives 1.25×10⁻⁴ — no marks after the first step.',
    },
    {
      id: 'CHEM-3', type: 'structured', marks: 3, paper: 'Paper 1B (Structured)', topic: 'Redox',
      stem: 'A piece of magnesium ribbon is added to copper(II) sulphate solution. State TWO observations and write the ionic equation.',
      points: [
        { keywords: [['brown', 'reddish', 'pink']], mark: 1, desc: 'Reddish-brown solid deposited' },
        { keywords: [['blue'], ['fade', 'paler', 'colourless', 'colorless', 'lighter']], mark: 1, desc: 'Blue solution fades / becomes paler' },
        { keywords: [['mg'], ['cu2+', 'cu²⁺', 'cu 2+'], ['mg2+', 'mg²⁺', 'mg 2+']], mark: 1, desc: 'Mg(s) + Cu²⁺(aq) → Mg²⁺(aq) + Cu(s)' },
      ],
      trap: '"Copper is formed" is NOT an observation — HKEAA only credits what is seen.',
    },
  ],
  BIO: [
    {
      id: 'BIO-1', type: 'mc', marks: 1, paper: 'Paper 1A (MC)', topic: 'Cells & Molecules',
      stem: 'Red blood cells placed in distilled water burst. Which process best explains this?',
      options: ['Active transport of water into the cell', 'Diffusion of salts out of the cell', 'Osmosis of water into the cell', 'Phagocytosis'],
      answer: 2,
      explanation: 'Water moves by osmosis from higher water potential (distilled water) into the cell; no cell wall to resist.',
      trap: 'Students often write "water diffuses" — DSE requires the term osmosis + partially permeable membrane.',
    },
    {
      id: 'BIO-2', type: 'structured', marks: 4, paper: 'Paper 1B (Experimental design)', topic: 'Photosynthesis & Respiration',
      stem: 'Design an experiment to investigate the effect of light intensity on the rate of photosynthesis of a water plant. State the independent variable, how you would measure the rate, and TWO variables to control.',
      points: [
        { keywords: [['distance', 'light intensity', 'lamp']], mark: 1, desc: 'IV: light intensity, varied by distance of lamp' },
        { keywords: [['bubble', 'oxygen', 'gas', 'volume']], mark: 1, desc: 'Count bubbles / volume of O₂ per unit time' },
        { keywords: [['temperature', 'water bath', 'heat']], mark: 1, desc: 'Control temperature (e.g. heat filter / water bath)' },
        { keywords: [['carbon dioxide', 'co2', 'hydrogencarbonate', 'bicarbonate', 'same plant', 'species', 'size']], mark: 1, desc: 'Control CO₂ concentration / same plant' },
      ],
      trap: 'Missing "per unit time" means you measured amount, not rate — a frequent HKEAA examiner comment.',
    },
    {
      id: 'BIO-3', type: 'mc', marks: 1, paper: 'Paper 1A (MC)', topic: 'Genetics & Evolution',
      stem: 'In a monohybrid cross between two heterozygous tall pea plants (Tt × Tt), what proportion of offspring is expected to be homozygous?',
      options: ['1/4', '1/2', '3/4', '1'],
      answer: 1,
      explanation: 'TT (1/4) + tt (1/4) = 1/2 homozygous.',
      trap: 'Many count only TT (1/4). Read whether the question asks for genotype or phenotype.',
    },
  ],
  ECON: [
    {
      id: 'ECON-1', type: 'mc', marks: 1, paper: 'Paper 1 (MC)', topic: 'Market Intervention',
      stem: 'The government imposes an effective price ceiling on rental flats. Which of the following will most likely result?',
      options: ['A surplus of flats', 'A shortage of flats and possible non-price competition', 'An increase in quantity supplied', 'The equilibrium price rises'],
      answer: 1,
      explanation: 'An effective ceiling is set below equilibrium: Qd > Qs, so a shortage and non-price allocation (queuing, connections).',
      trap: '"Effective" is the key word — an ineffective ceiling (above equilibrium) has no effect.',
    },
    {
      id: 'ECON-2', type: 'numeric', marks: 2, paper: 'Paper 2 (Calculation)', topic: 'Elasticity',
      stem: 'When the price of bubble tea rises from $40 to $44, quantity demanded falls from 500 to 450 cups. Calculate the price elasticity of demand (absolute value, using the initial point method).',
      answer: 1, tolerance: 0.02,
      scheme: ['%ΔQd = −50/500 = −10%, %ΔP = 4/40 = 10%  (1M)', 'Ed = |−10% / 10%| = 1 (unitary)  (1A)'],
      trap: 'Inverting the ratio (%ΔP/%ΔQ) scores 0. DSE accepts initial-point unless told to use mid-point.',
    },
    {
      id: 'ECON-3', type: 'structured', marks: 4, paper: 'Paper 2 (Data response)', topic: 'Money & Banking',
      stem: 'Explain how an increase in the required reserve ratio would affect the money supply in Hong Kong. (Assume banks hold no excess reserves.)',
      points: [
        { keywords: [['reserve'], ['increase', 'higher', 'more', 'rise']], mark: 1, desc: 'Banks must keep more reserves for each dollar of deposits' },
        { keywords: [['loan', 'lend', 'credit']], mark: 1, desc: 'Less excess reserves available for lending' },
        { keywords: [['multiplier', '1/r', 'deposit creation', 'derivative deposit']], mark: 1, desc: 'Banking multiplier (1/rr) falls / less deposit creation' },
        { keywords: [['money supply'], ['fall', 'decrease', 'decline', 'reduce']], mark: 1, desc: 'Money supply decreases' },
      ],
      trap: 'Writing "interest rate rises so people borrow less" is a different mechanism — no marks for the multiplier step.',
    },
  ],
  BAFS: [
    {
      id: 'BAFS-1', type: 'mc', marks: 1, paper: 'Paper 1 (MC)', topic: 'Financial Accounting',
      stem: 'Under the accrual concept, rent of $12,000 paid on 1 October for the 12 months ending 30 September next year. For the year ended 31 December, the rent expense to be shown is:',
      options: ['$12,000', '$3,000', '$9,000', '$0'],
      answer: 1,
      explanation: 'Only 3 months (Oct–Dec) belong to this year: 12,000 × 3/12 = $3,000; $9,000 is prepaid.',
      trap: '$9,000 is the prepayment (asset), not the expense.',
    },
    {
      id: 'BAFS-2', type: 'numeric', marks: 3, paper: 'Paper 2B (Accounting)', topic: 'Ratio Analysis',
      stem: 'A company has current assets of $180,000 (including inventory $60,000) and current liabilities of $80,000. Calculate the quick (acid-test) ratio to 2 d.p.',
      answer: 1.5, tolerance: 0.01, unit: ':1',
      scheme: ['Quick assets = 180,000 − 60,000 = 120,000  (1M)', 'Quick ratio = 120,000 / 80,000  (1M)', '= 1.50 : 1  (1A)'],
      trap: 'Using the current ratio (2.25) instead — read the ratio name carefully.',
    },
    {
      id: 'BAFS-3', type: 'structured', marks: 3, paper: 'Paper 1 (Short question)', topic: 'Management',
      stem: 'Explain TWO advantages for a small Hong Kong café of operating as a limited company instead of a sole proprietorship.',
      points: [
        { keywords: [['limited liability', 'personal asset', 'personal property']], mark: 1, desc: 'Limited liability protects owners\' personal assets' },
        { keywords: [['capital', 'shares', 'fund']], mark: 1, desc: 'Easier to raise capital by issuing shares' },
        { keywords: [['continuity', 'separate legal', 'perpetual', 'legal entity']], mark: 1, desc: 'Separate legal entity — continuity of existence' },
      ],
      trap: 'Listing points without explaining the impact on the café caps you at 1 mark ("Max 1 for listing").',
    },
  ],
  GEOG: [
    {
      id: 'GEOG-1', type: 'mc', marks: 1, paper: 'Paper 1 (MC)', topic: 'Map Reading',
      stem: 'On a 1:20 000 map, two points are 4.5 cm apart. What is the actual ground distance?',
      options: ['90 m', '450 m', '900 m', '9 km'],
      answer: 2,
      explanation: '4.5 cm × 20 000 = 90 000 cm = 900 m.',
      trap: 'Unit conversion (cm → m) is the most common slip in DSE Geog map work.',
    },
    {
      id: 'GEOG-2', type: 'structured', marks: 4, paper: 'Paper 1 (DBQ)', topic: 'Climate Change',
      stem: 'Figure: HK mean annual temperature rose from 22.6 °C (1980) to 23.9 °C (2020). Describe the trend and explain ONE human cause of this change.',
      points: [
        { keywords: [['increase', 'rise', 'rose', 'upward']], mark: 1, desc: 'Describes overall rising trend' },
        { keywords: [['1.3', '22.6', '23.9']], mark: 1, desc: 'Quotes data with units (rise of 1.3 °C)' },
        { keywords: [['greenhouse', 'carbon dioxide', 'co2', 'fossil', 'burning']], mark: 1, desc: 'Human cause: burning fossil fuels → more greenhouse gases' },
        { keywords: [['urban heat', 'concrete', 'urbanisation', 'urbanization', 'trap', 'absorb']], mark: 1, desc: 'Mechanism: enhanced greenhouse effect / urban heat island traps heat' },
      ],
      trap: 'No figures quoted = max 1 for description. "Must quote data with units" appears in almost every Geog examination report.',
    },
    {
      id: 'GEOG-3', type: 'mc', marks: 1, paper: 'Paper 1 (MC)', topic: 'Rivers & Coasts',
      stem: 'Which process is mainly responsible for the formation of a wave-cut notch?',
      options: ['Longshore drift', 'Hydraulic action and abrasion at the cliff base', 'Freeze-thaw weathering', 'Deposition'],
      answer: 1,
      explanation: 'Wave erosion (hydraulic action, abrasion) concentrates between high and low water marks at the cliff base.',
      trap: 'Freeze-thaw is rare in HK — context matters.',
    },
  ],
  HIST: [
    {
      id: 'HIST-1', type: 'mc', marks: 1, paper: 'Paper 1 (DBQ)', topic: 'Cold War',
      stem: 'Which event most directly marked the beginning of the Berlin Blockade (1948)?',
      options: ['The Marshall Plan announcement', 'The introduction of the Deutschmark in the Western zones', 'The building of the Berlin Wall', 'The formation of NATO'],
      answer: 1,
      explanation: 'The currency reform in June 1948 triggered the Soviet blockade.',
      trap: 'The Wall (1961) is a frequent chronology error.',
    },
    {
      id: 'HIST-2', type: 'structured', marks: 4, paper: 'Paper 1 (DBQ)', topic: 'Cold War',
      stem: 'Source A (a 1947 US cartoon) shows Uncle Sam handing dollar bags to European nations while a Soviet bear watches. What is the message of the cartoon? Explain with reference to Source A and your own knowledge.',
      points: [
        { keywords: [['marshall', 'economic aid', 'dollar', 'aid']], mark: 1, desc: 'Identifies US economic aid / Marshall Plan' },
        { keywords: [['contain', 'communis', 'soviet influence', 'spread']], mark: 1, desc: 'Purpose: contain communism / Soviet influence' },
        { keywords: [['source a', 'cartoon', 'bag', 'bear']], mark: 1, desc: 'Explicit reference to features of Source A' },
        { keywords: [['1947', 'truman', 'europe', 'recover']], mark: 1, desc: 'Own knowledge: Truman Doctrine / European recovery context' },
      ],
      trap: 'Describing the cartoon without stating its message scores max 1. "With reference to Source A" is mandatory.',
    },
    {
      id: 'HIST-3', type: 'mc', marks: 1, paper: 'Paper 1 (DBQ)', topic: 'Modernisation of HK',
      stem: 'Which development best explains Hong Kong’s rapid industrialisation in the 1950s–60s?',
      options: ['Influx of capital, entrepreneurs and labour from Mainland China', 'The opening of the Cross-Harbour Tunnel', 'Membership of the WTO', 'The Basic Law'],
      answer: 0,
      explanation: 'Post-1949 migration brought Shanghai industrialists, capital and cheap labour.',
      trap: 'Chronology: tunnel (1972), WTO (1995), Basic Law (1990).',
    },
  ],
  CHIST: [
    {
      id: 'CHIST-1', type: 'mc', marks: 1, paper: '卷一 (資料題)', topic: '秦漢',
      stem: '秦始皇推行「書同文」政策的主要目的是：',
      options: ['推廣儒家思想', '統一文字以加強中央集權及政令推行', '方便與外國通商', '保存六國文化'],
      answer: 1,
      explanation: '統一文字有助政令通行全國，鞏固中央集權。',
      trap: '「焚書坑儒」與「書同文」常被混淆。',
    },
    {
      id: 'CHIST-2', type: 'structured', marks: 4, paper: '卷一 (資料題)', topic: '明清',
      stem: '試根據資料及就你所知，解釋明代廢除宰相制度對中央政治的影響。（提示：須引用資料並加以說明）',
      points: [
        { keywords: [['宰相', '丞相', '中書省']], mark: 1, desc: '指出朱元璋廢除丞相 / 中書省' },
        { keywords: [['皇權', '君權', '集中', '專制']], mark: 1, desc: '皇權高度集中 / 君主專制加強' },
        { keywords: [['內閣', '大學士']], mark: 1, desc: '後設內閣大學士輔政' },
        { keywords: [['宦官', '太監', '司禮監']], mark: 1, desc: '宦官專權出現（司禮監批紅）' },
      ],
      trap: '只抄錄資料而沒有「就你所知」補充，最多只得一半分數。',
    },
    {
      id: 'CHIST-3', type: 'mc', marks: 1, paper: '卷一 (資料題)', topic: '近代中國',
      stem: '下列哪一項是戊戌變法失敗的主要原因？',
      options: ['列強支持變法', '以慈禧太后為首的守舊勢力反對', '人民普遍支持', '變法時間過長'],
      answer: 1,
      explanation: '守舊派掌握實權，變法僅百日即告失敗。',
      trap: '「百日維新」—時間其實很短。',
    },
  ],
  ICT: [
    {
      id: 'ICT-1', type: 'numeric', marks: 2, paper: 'Paper 1 (Structured)', topic: 'Algorithms & Pseudocode',
      stem: 'Trace the pseudocode:  s ← 0;  for i ← 1 to 5 do  if i mod 2 = 1 then s ← s + i;  end.  What is the final value of s?',
      answer: 9, tolerance: 0,
      scheme: ['Odd i = 1, 3, 5 identified  (1M)', 's = 1 + 3 + 5 = 9  (1A)'],
      trap: 'Off-by-one errors on loop bounds are the #1 mark-loss in ICT Paper 1 tracing questions.',
    },
    {
      id: 'ICT-2', type: 'mc', marks: 1, paper: 'Paper 1 (MC)', topic: 'Databases',
      stem: 'Which field is the most suitable primary key for a STUDENT table?',
      options: ['Student name', 'Date of birth', 'Student ID', 'Class'],
      answer: 2,
      explanation: 'A primary key must be unique and non-null — only Student ID guarantees this.',
      trap: 'Names can duplicate — DSE expects you to justify with "unique".',
    },
    {
      id: 'ICT-3', type: 'structured', marks: 3, paper: 'Paper 1 (Structured)', topic: 'Networking',
      stem: 'A school wants to protect its Wi-Fi network. Suggest and explain THREE security measures.',
      points: [
        { keywords: [['wpa', 'encrypt']], mark: 1, desc: 'Use WPA2/WPA3 encryption' },
        { keywords: [['password', 'authentication', 'login', 'account']], mark: 1, desc: 'User authentication / strong passwords' },
        { keywords: [['firewall', 'mac', 'filter', 'hidden ssid', 'ssid']], mark: 1, desc: 'Firewall / MAC filtering / hide SSID' },
      ],
      trap: '"Install antivirus" protects devices, not the network — often not credited.',
    },
  ],
  DAT: [
    {
      id: 'DAT-1', type: 'mc', marks: 1, paper: 'Paper 1 (Compulsory)', topic: 'Materials',
      stem: 'Which material is most suitable for a child’s outdoor toy that must be lightweight, weather-resistant and brightly coloured?',
      options: ['Mild steel', 'HDPE (high-density polyethylene)', 'Pine wood', 'Glass'],
      answer: 1,
      explanation: 'HDPE is light, tough, weather-resistant and can be pigmented.',
      trap: 'Justify with properties AND context (user = child).',
    },
    {
      id: 'DAT-2', type: 'structured', marks: 4, paper: 'Paper 1 (Design)', topic: 'Design Process',
      stem: 'Outline FOUR stages of the design process you would follow to design a portable phone stand for elderly users.',
      points: [
        { keywords: [['identify', 'need', 'problem', 'brief']], mark: 1, desc: 'Identify need / design brief' },
        { keywords: [['research', 'investigat', 'anthropometric', 'ergonomic']], mark: 1, desc: 'Research (ergonomics, anthropometrics of elderly)' },
        { keywords: [['idea', 'sketch', 'develop', 'generate']], mark: 1, desc: 'Generate & develop ideas' },
        { keywords: [['test', 'evaluat', 'prototype', 'model']], mark: 1, desc: 'Prototype, test & evaluate' },
      ],
      trap: 'Generic stages without linking to "elderly users" are marked down for lack of context.',
    },
    {
      id: 'DAT-3', type: 'numeric', marks: 2, paper: 'Paper 2 (Electronics)', topic: 'Electronics',
      stem: 'An LED needs 2 V and 20 mA. It is powered by a 9 V battery. Calculate the series resistor required (in Ω).',
      answer: 350, tolerance: 1, unit: 'Ω',
      scheme: ['V across R = 9 − 2 = 7 V  (1M)', 'R = 7 / 0.020 = 350 Ω  (1A)'],
      trap: 'Using 9 V instead of 7 V gives 450 Ω.',
    },
  ],
  MUSIC: [
    {
      id: 'MUSIC-1', type: 'mc', marks: 1, paper: 'Paper 1 (Listening)', topic: 'Listening',
      stem: 'A cadence that moves from chord V to chord I is called:',
      options: ['Plagal cadence', 'Perfect cadence', 'Imperfect cadence', 'Interrupted cadence'],
      answer: 1,
      explanation: 'V–I is a perfect (authentic) cadence; IV–I plagal; ?–V imperfect; V–vi interrupted.',
      trap: 'Imperfect ends ON V, perfect ends ON I.',
    },
    {
      id: 'MUSIC-2', type: 'mc', marks: 1, paper: 'Paper 1 (Listening)', topic: 'Listening',
      stem: 'Which period is characterised by basso continuo, terraced dynamics and the concerto grosso?',
      options: ['Renaissance', 'Baroque', 'Classical', 'Romantic'],
      answer: 1,
      explanation: 'Basso continuo and terraced dynamics are Baroque hallmarks.',
      trap: 'Classical = Alberti bass and gradual dynamics.',
    },
    {
      id: 'MUSIC-3', type: 'structured', marks: 3, paper: 'Paper 1 (Listening)', topic: 'Listening',
      stem: 'You hear an excerpt from a Cantonese opera aria. Identify THREE musical features you would describe in the listening paper.',
      points: [
        { keywords: [['gong', 'percussion', 'luo', 'bangu', '鑼', '鼓']], mark: 1, desc: 'Percussion ensemble (gong, bangu)' },
        { keywords: [['erhu', 'gaohu', 'string', '高胡', '二胡']], mark: 1, desc: 'Gaohu / bowed strings accompaniment' },
        { keywords: [['banghuang', 'bang', 'huang', 'aria', 'pentatonic', '梆黃', '梆子', '二黃']], mark: 1, desc: 'Banghuang aria type / pentatonic melody' },
      ],
      trap: 'Generic terms ("nice melody") earn nothing — use specific terminology.',
    },
  ],
  PE: [
    {
      id: 'PE-1', type: 'mc', marks: 1, paper: 'Paper 1 (MC)', topic: 'Exercise Physiology',
      stem: 'During a 100 m sprint, the predominant energy system is:',
      options: ['Aerobic system', 'ATP-PC (phosphagen) system', 'Lactic acid system only', 'Fat oxidation'],
      answer: 1,
      explanation: 'High-intensity efforts under ~10 s rely mainly on ATP-PC.',
      trap: 'Lactic acid system dominates ~10 s – 2 min, not a 10-second sprint.',
    },
    {
      id: 'PE-2', type: 'numeric', marks: 2, paper: 'Paper 1 (Structured)', topic: 'Exercise Physiology',
      stem: 'Estimate the maximum heart rate (bpm) of a 16-year-old student using the 220 − age formula, then calculate 70% of it for a training zone (give the 70% value).',
      answer: 142.8, tolerance: 0.5, unit: 'bpm',
      scheme: ['HRmax = 220 − 16 = 204 bpm  (1M)', '70% × 204 = 142.8 bpm  (1A)'],
      trap: 'Many forget that PE written papers include calculations.',
    },
    {
      id: 'PE-3', type: 'structured', marks: 3, paper: 'Paper 2 (Structured)', topic: 'Sports Psychology',
      stem: 'Explain, using the inverted-U theory, how arousal affects the performance of a basketball free-throw shooter.',
      points: [
        { keywords: [['optimal', 'optimum', 'moderate']], mark: 1, desc: 'Performance best at moderate / optimal arousal' },
        { keywords: [['low', 'under']], mark: 1, desc: 'Under-arousal → lack of focus, poor performance' },
        { keywords: [['high', 'over', 'anxiety']], mark: 1, desc: 'Over-arousal → anxiety, tension, poor fine motor control' },
      ],
      trap: 'Applying the theory to the specific skill (fine motor, free throw) is needed for full marks.',
    },
  ],
};

export function publicTaster(subject) {
  // Strip answers/schemes before sending questions to a student.
  return (TASTERS[subject] || []).map((q) => {
    const { answer, points, scheme, explanation, trap, tolerance, ...rest } = q;
    return { ...rest, pointCount: points ? points.length : undefined };
  });
}

function norm(s) {
  return String(s || '').toLowerCase().replace(/\s+/g, ' ');
}

export function gradeQuestion(q, raw) {
  if (q.type === 'mc') {
    const ok = Number(raw) === q.answer;
    return {
      id: q.id, awarded: ok ? q.marks : 0, max: q.marks, correct: ok,
      feedback: ok ? 'Correct.' : `Incorrect — answer is ${String.fromCharCode(65 + q.answer)}.`,
      scheme: [q.explanation], trap: q.trap,
    };
  }
  if (q.type === 'numeric') {
    const text = String(raw ?? '').trim();
    const num = parseFloat(text.replace(/[^0-9.\-eE]/g, ''));
    const ok = Number.isFinite(num) && Math.abs(num - q.answer) <= q.tolerance;
    let awarded = 0;
    let feedback;
    if (ok) {
      const unitOk = !q.unit || norm(text).includes(norm(q.unit)) || q.unit === ':1';
      awarded = unitOk ? q.marks : q.marks - 1;
      feedback = unitOk ? 'Correct final answer.' : `Correct value but unit "${q.unit}" missing — final A mark lost.`;
    } else if (Number.isFinite(num)) {
      awarded = Math.abs(num - q.answer) / Math.abs(q.answer || 1) < 0.15 ? 1 : 0;
      feedback = awarded ? 'Close — method mark awarded but final answer inaccurate.' : `Incorrect. Expected ≈ ${q.answer}${q.unit ? ' ' + q.unit : ''}.`;
    } else {
      feedback = 'No numerical answer given.';
    }
    return { id: q.id, awarded, max: q.marks, correct: ok, feedback, scheme: q.scheme, trap: q.trap };
  }
  // structured: keyword mark scheme
  const ans = norm(raw);
  const hits = q.points.map((p) => ({
    desc: p.desc,
    hit: ans.length > 0 && p.keywords.every((group) => group.some((k) => ans.includes(norm(k)))),
    mark: p.mark,
  }));
  const awarded = Math.min(q.marks, hits.filter((h) => h.hit).reduce((a, h) => a + h.mark, 0));
  return {
    id: q.id, awarded, max: q.marks, correct: awarded === q.marks,
    feedback: awarded === q.marks ? 'Full marks — all marking points covered.' : `${awarded}/${q.marks}: ${hits.filter((h) => !h.hit).length} marking point(s) missing.`,
    points: hits, scheme: q.points.map((p) => `${p.desc} (${p.mark}M)`), trap: q.trap,
  };
}
