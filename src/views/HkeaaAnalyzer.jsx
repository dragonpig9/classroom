import React, { useEffect, useMemo, useState } from 'react';
import { ScanSearch, Upload, Cpu, CheckCheck, Trash2, Sparkles, UserCheck, Split, Plus, X, FileText, Bot, CheckCircle2, CircleDashed, Pencil } from 'lucide-react';
import { api } from '../api.js';
import { Card, Badge, Loading, ErrorBox, Modal, Progress, useFetch } from '../ui.jsx';

const SAMPLE = `HKEAA 2025 HKDSE Examination — Economics Paper 2
Candidate: 6C-2025-21 (uploaded by subject teacher)
Q2(a) | With the aid of a diagram, explain how a unit tax affects producer surplus. | 2/4 | Diagram axes not labelled; did not identify tax burden.
Q2(b) | Calculate the tax revenue collected by the government (Table 2). | 1/2 | Correct method; unit missing.
Q4 | Refer to Figure 3. Describe the change in HK's unemployment rate in 2023-2025. | 1/3 | No data quoted from Figure 3.
Q6(c) | Explain why the HKMA cannot use monetary policy under the Linked Exchange Rate System. | 2/4 | Missing keyword "interest rate parity"; brief.
Q9 | To what extent do you agree that free trade benefits all Hong Kong citizens? Discuss. | 4/8 | One-sided argument; no evaluation.`;

const STATUS = {
  unlabeled: { tone: 'slate', label: 'Unlabeled', Icon: CircleDashed },
  ai: { tone: 'violet', label: 'AI-labeled', Icon: Bot },
  verified: { tone: 'green', label: 'Verified', Icon: CheckCircle2 },
};

export default function HkeaaAnalyzer({ meta, notify }) {
  const [showSyn, setShowSyn] = useState(false);
  const list = useFetch(`/api/hkeaa/reports${showSyn ? '?synthetic=1' : ''}`);
  const [selId, setSelId] = useState(null);
  const [report, setReport] = useState(null);
  const [busy, setBusy] = useState(null);
  const [err, setErr] = useState(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [focus, setFocus] = useState(null);

  useEffect(() => { if (!selId && list.data?.length) setSelId(list.data[0].id); }, [list.data]);
  useEffect(() => {
    if (!selId) return;
    setReport(null);
    api.get(`/api/hkeaa/reports/${selId}`).then(setReport).catch(setErr);
  }, [selId]);

  const refreshListRow = (rep) => list.setData((list.data || []).map((r) => (r.id === rep.id ? { ...r, ...rep.stats, aiEngine: rep.aiEngine } : r)));
  const recognize = async () => {
    setBusy('ai'); setErr(null);
    try { const r = await api.post(`/api/hkeaa/reports/${report.id}/recognize`); setReport(r); refreshListRow(r); notify(`AI recognition complete (${r.engine})`); }
    catch (e) { setErr(e); } finally { setBusy(null); }
  };
  const verifyAll = async () => {
    setBusy('all');
    try { await api.post(`/api/hkeaa/reports/${report.id}/verify-all`); const r = await api.get(`/api/hkeaa/reports/${report.id}`); setReport(r); refreshListRow(r); notify('All AI labels accepted'); }
    finally { setBusy(null); }
  };
  const remove = async () => {
    if (!confirm('Delete this report?')) return;
    await api.del(`/api/hkeaa/reports/${report.id}`);
    setSelId(null); setReport(null); list.reload();
  };
  const onItemSaved = (item, stats) => {
    const r = { ...report, items: report.items.map((i) => (i.id === item.id ? item : i)), stats };
    setReport(r); refreshListRow(r);
  };

  return (
    <div className="grid gap-4 xl:grid-cols-[300px_1fr]">
      <Card title="Reports & scripts" subtitle="HKEAA Examination Reports + internal tests" icon={FileText} bodyClass="p-2"
        actions={<button className="btn-primary py-1" onClick={() => setUploadOpen(true)}><Upload className="h-4 w-4" />Upload</button>}>
        <label className="mb-2 flex items-center gap-2 px-2 text-xs text-slate-500"><input type="checkbox" checked={showSyn} onChange={(e) => setShowSyn(e.target.checked)} />Show cohort summary extracts (2023–25)</label>
        {list.loading && !list.data ? <Loading /> : (
          <ul className="max-h-[680px] space-y-1 overflow-auto">
            {(list.data || []).map((r) => (
              <li key={r.id}>
                <button onClick={() => setSelId(r.id)} className={`w-full rounded-lg px-2.5 py-2 text-left ${selId === r.id ? 'bg-brand-50 ring-1 ring-brand-200' : 'hover:bg-slate-50'}`}>
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-sm font-medium">{r.subject} · {r.year} {r.paper}</span>
                    <Badge tone={r.source === 'HKEAA' ? 'blue' : 'amber'}>{r.source === 'HKEAA' ? '考評局' : 'Internal'}</Badge>
                  </div>
                  <div className="truncate text-xs text-slate-500">{r.alias}</div>
                  <div className="mt-1 flex items-center gap-2"><Progress value={r.verified} max={r.verified + r.aiLabeled + r.unlabeled} tone="green" /><span className="whitespace-nowrap text-[11px] text-slate-500">{r.verified}✓ {r.aiLabeled}AI {r.unlabeled}○</span></div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <div className="space-y-4">
        <ErrorBox error={err} />
        {!report ? <Card><Loading label="Select a report" /></Card> : (
          <>
            <Card title={`${meta.subjectNames[report.subject] || report.subject} — ${report.year} ${report.paper}`}
              subtitle={`${report.source === 'HKEAA' ? 'HKEAA 考評局 Examination Report' : 'In-school assessment'} · ${report.alias}${report.schoolPredictedLevel ? ` · School predicted ${report.schoolPredictedLevel} → HKDSE ${report.actualLevel}` : ''}`}
              icon={ScanSearch}
              actions={<>
                <button className="btn-primary" disabled={busy === 'ai'} onClick={recognize}><Sparkles className={`h-4 w-4 ${busy === 'ai' ? 'animate-pulse' : ''}`} />{busy === 'ai' ? 'Recognising…' : 'Run AI recognition'}</button>
                <button className="btn-outline" disabled={busy === 'all' || !report.stats.aiLabeled} onClick={verifyAll}><CheckCheck className="h-4 w-4" />Accept all AI ({report.stats.aiLabeled})</button>
                <button className="btn-ghost text-red-600" onClick={remove} title="Delete report"><Trash2 className="h-4 w-4" /></button>
              </>}>
              <div className="flex flex-wrap items-center gap-3 text-sm">
                <span><b>{report.stats.awarded}</b>/{report.stats.totalMarks} marks ({report.stats.pct}%)</span>
                <Badge tone="green"><CheckCircle2 className="h-3 w-3" />{report.stats.verified} verified</Badge>
                <Badge tone="violet"><Bot className="h-3 w-3" />{report.stats.aiLabeled} AI-labeled</Badge>
                <Badge tone="slate"><CircleDashed className="h-3 w-3" />{report.stats.unlabeled} unlabeled</Badge>
                <span className="flex items-center gap-1 text-xs text-slate-500"><Cpu className="h-3.5 w-3.5" />Engine: {report.aiEngine || 'not run yet'} {meta.ai.mode === 'simulation' && '(set ANTHROPIC_API_KEY for live Claude)'}</span>
              </div>
            </Card>

            <div className="grid gap-4 2xl:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
              <Card title="Source document" subtitle="Report extract / marked-script transcription" icon={FileText} bodyClass="p-0">
                <div className="max-h-[720px] overflow-auto p-3 font-mono text-xs leading-relaxed">
                  {report.rawText.split('\n').map((line, i) => {
                    const hit = focus && line.trim().startsWith(focus);
                    return <div key={i} className={`whitespace-pre-wrap rounded px-1 ${hit ? 'bg-amber-100 ring-1 ring-amber-300' : ''}`}>{line || ' '}</div>;
                  })}
                  {report.hasImage && <p className="mt-2 text-slate-500">📎 Original file: {report.fileName || 'uploaded image'}</p>}
                </div>
              </Card>
              <div className="space-y-3">
                {report.items.map((it) => (
                  <ItemTagger key={it.id + (it.ai?.engine || '') + it.status} reportId={report.id} subject={report.subject} item={it} meta={meta} onSaved={onItemSaved} onFocus={() => setFocus(it.label)} notify={notify} />
                ))}
              </div>
            </div>
          </>
        )}
      </div>
      <UploadModal open={uploadOpen} onClose={() => setUploadOpen(false)} meta={meta}
        onCreated={(rep) => { setUploadOpen(false); list.reload(); setSelId(rep.id); notify(`Report ingested: ${rep.items.length} question rows (${rep.extractionEngine})`); }} />
    </div>
  );
}

function ItemTagger({ reportId, subject, item, meta, onSaved, onFocus, notify }) {
  const base = item.human || item.ai || {};
  const [type, setType] = useState(base.questionType || '');
  const [topic, setTopic] = useState(base.topic || '');
  const [reason, setReason] = useState(base.lossReason || '');
  const [nuances, setNuances] = useState(item.human?.nuances || item.ai?.suggestedNuances || []);
  const [awarded, setAwarded] = useState(item.awarded);
  const [note, setNote] = useState(item.human?.note || '');
  const [splits, setSplits] = useState(item.human?.splits || []);
  const [showSplit, setShowSplit] = useState(Boolean(item.human?.splits?.length));
  const [editing, setEditing] = useState(item.status !== 'verified');
  const [err, setErr] = useState(null);
  const [saving, setSaving] = useState(false);
  const st = STATUS[item.status];
  const topics = meta.topics[subject] || [];
  const reasons = [...meta.lossReasons, 'None (full marks)'];

  const save = async () => {
    setSaving(true); setErr(null);
    try {
      const r = await api.patch(`/api/hkeaa/reports/${reportId}/items/${item.id}`, { questionType: type, topic, lossReason: reason, nuances, awarded: Number(awarded), note, splits: showSplit ? splits : [] });
      onSaved(r.item, r.stats); setEditing(false);
      notify(`${item.label} verified${r.item.human.overrodeAi ? ' (AI overridden)' : ''}`);
    } catch (e) { setErr(e); } finally { setSaving(false); }
  };
  const splitSum = splits.reduce((a, s) => a + Number(s.maxMarks || 0), 0);

  return (
    <div className={`card p-3 ${item.status === 'verified' ? 'border-emerald-200' : ''}`} onMouseEnter={onFocus}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold">{item.label}</span>
            <Badge tone={st.tone}><st.Icon className="h-3 w-3" />{st.label}</Badge>
            <span className="text-sm font-medium">{item.awarded}/{item.maxMarks}</span>
            {item.human?.overrodeAi && <Badge tone="amber">Human override</Badge>}
          </div>
          <p className="mt-1 text-sm text-slate-700">{item.text}</p>
          {item.comment && <p className="mt-0.5 text-xs italic text-slate-500">Examiner/marker: “{item.comment}”</p>}
        </div>
        {!editing && <button className="btn-ghost py-1" onClick={() => setEditing(true)}><Pencil className="h-3.5 w-3.5" />Edit</button>}
      </div>

      {item.ai && (
        <div className="mt-2 flex flex-wrap items-center gap-1.5 rounded-md bg-violet-50 px-2 py-1.5 text-xs text-violet-900">
          <Bot className="h-3.5 w-3.5" /><b>AI:</b> {item.ai.questionType} · {item.ai.topic} · {item.ai.lossReason}
          <span className="ml-auto flex items-center gap-1">confidence {Math.round(item.ai.confidence * 100)}%<span className="inline-block h-1.5 w-12 rounded bg-violet-200"><span className="block h-1.5 rounded bg-violet-600" style={{ width: `${item.ai.confidence * 100}%` }} /></span></span>
          {editing && <button className="rounded bg-white px-1.5 py-0.5 font-medium text-violet-700 ring-1 ring-violet-200" onClick={() => { setType(item.ai.questionType); setTopic(item.ai.topic); setReason(item.ai.lossReason); setNuances(item.ai.suggestedNuances || []); }}>Use AI labels</button>}
          {item.ai.rationale && <div className="w-full text-[11px] text-violet-700">{item.ai.rationale}</div>}
        </div>
      )}

      {!editing && item.human && (
        <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs">
          <UserCheck className="h-3.5 w-3.5 text-emerald-700" /><b>Teacher:</b> <Badge>{item.human.questionType}</Badge><Badge>{item.human.topic}</Badge><Badge tone="red">{item.human.lossReason}</Badge>
          {item.human.nuances.map((n) => <Badge key={n} tone="amber">{n}</Badge>)}
          {item.human.splits?.length > 0 && <Badge tone="blue"><Split className="h-3 w-3" />{item.human.splits.length} parts</Badge>}
          {item.human.note && <span className="text-slate-500">“{item.human.note}”</span>}
        </div>
      )}

      {editing && (
        <div className="mt-3 space-y-2">
          <div className="grid gap-2 sm:grid-cols-4">
            <label className="text-xs"><span className="label">Question type</span><select className="input mt-0.5" value={type} onChange={(e) => setType(e.target.value)}><option value="">—</option>{meta.questionTypes.map((t) => <option key={t}>{t}</option>)}</select></label>
            <label className="text-xs"><span className="label">Syllabus topic</span><select className="input mt-0.5" value={topic} onChange={(e) => setTopic(e.target.value)}><option value="">—</option>{topics.map((t) => <option key={t}>{t}</option>)}</select></label>
            <label className="text-xs"><span className="label">Mark-loss reason</span><select className="input mt-0.5" value={reason} onChange={(e) => setReason(e.target.value)}><option value="">—</option>{reasons.map((t) => <option key={t}>{t}</option>)}</select></label>
            <label className="text-xs"><span className="label">Marks awarded</span><input type="number" min={0} max={item.maxMarks} className="input mt-0.5" value={awarded} onChange={(e) => setAwarded(e.target.value)} /></label>
          </div>
          <div>
            <span className="label">HKEAA marking nuances</span>
            <div className="mt-1 flex flex-wrap gap-1">
              {meta.nuanceTags.map((n) => <button key={n} onClick={() => setNuances((x) => (x.includes(n) ? x.filter((y) => y !== n) : [...x, n]))} className={`rounded-full border px-2 py-0.5 text-[11px] ${nuances.includes(n) ? 'border-amber-400 bg-amber-100 text-amber-900' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}>{n}</button>)}
            </div>
          </div>
          <div>
            <button className="btn-ghost px-0 text-xs" onClick={() => { setShowSplit((v) => !v); if (!splits.length) setSplits([{ label: `${item.label}-i`, maxMarks: Math.ceil(item.maxMarks / 2), awarded: Math.min(item.awarded, Math.ceil(item.maxMarks / 2)), questionType: type, lossReason: reason }, { label: `${item.label}-ii`, maxMarks: Math.floor(item.maxMarks / 2), awarded: Math.max(0, item.awarded - Math.ceil(item.maxMarks / 2)), questionType: type, lossReason: reason }]); }}>
              <Split className="h-3.5 w-3.5" />{showSplit ? 'Remove mark split' : 'Split marks into sub-parts'}
            </button>
            {showSplit && (
              <div className="mt-1 space-y-1 rounded-lg bg-slate-50 p-2">
                {splits.map((s, i) => (
                  <div key={i} className="grid grid-cols-[80px_60px_60px_1fr_1fr_24px] items-center gap-1 text-xs">
                    <input className="input py-1" value={s.label} onChange={(e) => setSplits(splits.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))} />
                    <input className="input py-1" type="number" title="max marks" value={s.maxMarks} onChange={(e) => setSplits(splits.map((x, j) => (j === i ? { ...x, maxMarks: Number(e.target.value) } : x)))} />
                    <input className="input py-1" type="number" title="awarded" value={s.awarded} onChange={(e) => setSplits(splits.map((x, j) => (j === i ? { ...x, awarded: Number(e.target.value) } : x)))} />
                    <select className="input py-1" value={s.questionType || ''} onChange={(e) => setSplits(splits.map((x, j) => (j === i ? { ...x, questionType: e.target.value } : x)))}>{meta.questionTypes.map((t) => <option key={t}>{t}</option>)}</select>
                    <select className="input py-1" value={s.lossReason || ''} onChange={(e) => setSplits(splits.map((x, j) => (j === i ? { ...x, lossReason: e.target.value } : x)))}>{reasons.map((t) => <option key={t}>{t}</option>)}</select>
                    <button className="text-slate-400 hover:text-red-600" onClick={() => setSplits(splits.filter((_, j) => j !== i))}><X className="h-4 w-4" /></button>
                  </div>
                ))}
                <div className="flex items-center justify-between text-xs">
                  <button className="btn-ghost px-1 py-0.5 text-xs" onClick={() => setSplits([...splits, { label: `${item.label}-${splits.length + 1}`, maxMarks: 1, awarded: 0, questionType: type, lossReason: reason }])}><Plus className="h-3 w-3" />Add part</button>
                  <span className={splitSum === item.maxMarks ? 'text-emerald-700' : 'text-red-600'}>Max marks {splitSum}/{item.maxMarks}</span>
                </div>
              </div>
            )}
          </div>
          <input className="input" placeholder="Teacher note (optional) — e.g. examiner accepted 'deposit creation' as alternative" value={note} onChange={(e) => setNote(e.target.value)} />
          <ErrorBox error={err} />
          <div className="flex gap-2">
            <button className="btn-primary" disabled={saving || !type || !reason} onClick={save}><UserCheck className="h-4 w-4" />{saving ? 'Saving…' : 'Verify labels'}</button>
            {item.status === 'verified' && <button className="btn-ghost" onClick={() => setEditing(false)}>Cancel</button>}
          </div>
        </div>
      )}
    </div>
  );
}

function UploadModal({ open, onClose, meta, onCreated }) {
  const [form, setForm] = useState({ subject: 'ECON', year: 2025, paper: 'Paper 2', source: 'HKEAA', alias: '', schoolPredictedLevel: '', actualLevel: '', rawText: '' });
  const [file, setFile] = useState(null);
  const [autoAi, setAutoAi] = useState(true);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const subjects = useMemo(() => ['CHI', 'ENG', 'MATH', ...meta.electives.map((e) => e.key)], [meta]);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const onFile = (f) => {
    if (!f) return;
    const reader = new FileReader();
    if (f.type.startsWith('text/') || f.name.endsWith('.txt') || f.name.endsWith('.csv')) {
      reader.onload = () => { setForm((x) => ({ ...x, rawText: String(reader.result) })); setFile(null); };
      reader.readAsText(f);
    } else {
      reader.onload = () => setFile({ name: f.name, dataUrl: String(reader.result) });
      reader.readAsDataURL(f);
    }
  };
  const submit = async () => {
    setBusy(true); setErr(null);
    try {
      const rep = await api.post('/api/hkeaa/reports', { ...form, image: file?.dataUrl, fileName: file?.name });
      let final = rep;
      if (autoAi) final = await api.post(`/api/hkeaa/reports/${rep.id}/recognize`);
      onCreated({ ...final, extractionEngine: rep.extractionEngine });
      setForm({ ...form, rawText: '', alias: '' }); setFile(null);
    } catch (e) { setErr(e); } finally { setBusy(false); }
  };

  return (
    <Modal open={open} onClose={onClose} title="Upload HKEAA Examination Report / marked script" wide>
      <div className="grid gap-3 md:grid-cols-4">
        <label className="text-xs"><span className="label">Subject</span><select className="input mt-0.5" value={form.subject} onChange={set('subject')}>{subjects.map((s) => <option key={s} value={s}>{meta.subjectNames[s]}</option>)}</select></label>
        <label className="text-xs"><span className="label">Year</span><input className="input mt-0.5" type="number" value={form.year} onChange={set('year')} /></label>
        <label className="text-xs"><span className="label">Paper</span><input className="input mt-0.5" value={form.paper} onChange={set('paper')} /></label>
        <label className="text-xs"><span className="label">Source</span><select className="input mt-0.5" value={form.source} onChange={set('source')}><option value="HKEAA">HKEAA 考評局 report</option><option value="Internal">Internal test / mock</option></select></label>
        <label className="text-xs md:col-span-2"><span className="label">Candidate alias (no real names)</span><input className="input mt-0.5" placeholder="e.g. 6C-2025-21" value={form.alias} onChange={set('alias')} /></label>
        <label className="text-xs"><span className="label">School predicted level</span><select className="input mt-0.5" value={form.schoolPredictedLevel} onChange={set('schoolPredictedLevel')}><option value="">—</option>{meta.levels.slice(1).map((l) => <option key={l}>{l}</option>)}</select></label>
        <label className="text-xs"><span className="label">Actual HKDSE level</span><select className="input mt-0.5" value={form.actualLevel} onChange={set('actualLevel')}><option value="">—</option>{meta.levels.slice(1).map((l) => <option key={l}>{l}</option>)}</select></label>
      </div>
      <div className="mt-3">
        <div className="flex items-center justify-between"><span className="label">Report text — one row per question: <code>Q3(b) | question | 2/4 | examiner comment</code></span><button className="btn-ghost py-0.5 text-xs" onClick={() => setForm({ ...form, rawText: SAMPLE, alias: form.alias || '6C-2025-21' })}>Load sample</button></div>
        <textarea className="input mt-1 min-h-[180px] font-mono text-xs" value={form.rawText} onChange={set('rawText')} placeholder="Paste the report extract or your transcription of the script's mark breakdown…" />
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <label className="btn-outline cursor-pointer"><Upload className="h-4 w-4" />Attach image / PDF / .txt<input type="file" className="hidden" accept="image/png,image/jpeg,image/webp,application/pdf,.txt,.csv" onChange={(e) => onFile(e.target.files[0])} /></label>
        {file && <Badge tone="blue">{file.name}</Badge>}
        <span className="text-xs text-slate-500">{meta.ai.mode === 'live' ? 'Claude vision will extract rows from images/PDFs.' : 'Simulation mode parses the text rows; images are stored for reference.'}</span>
        <label className="ml-auto flex items-center gap-2 text-sm"><input type="checkbox" checked={autoAi} onChange={(e) => setAutoAi(e.target.checked)} />Run AI recognition after ingest</label>
      </div>
      <ErrorBox error={err} />
      <div className="mt-4 flex justify-end gap-2">
        <button className="btn-ghost" onClick={onClose}>Cancel</button>
        <button className="btn-primary" disabled={busy || (!form.rawText.trim() && !file)} onClick={submit}><Upload className="h-4 w-4" />{busy ? 'Ingesting…' : 'Ingest report'}</button>
      </div>
    </Modal>
  );
}
