import React, { useEffect, useState } from 'react';
import { Map, GraduationCap, LifeBuoy, SlidersHorizontal, Save, ArrowUp, ArrowDown, X, Plus } from 'lucide-react';
import { api } from '../api.js';
import { Card, Badge, Loading, ErrorBox, StatusBadge, Stat } from '../ui.jsx';

const LEVELS = ['1', '2', '3', '4', '5', '5*', '5**'];

export default function PathwayPlanner({ studentId, meta, notify }) {
  const [plan, setPlan] = useState(null);
  const [mode, setMode] = useState('honest');
  const [levels, setLevels] = useState(null);
  const [choices, setChoices] = useState([]);
  const [err, setErr] = useState(null);
  const [busy, setBusy] = useState(false);

  const run = async (lv) => {
    try {
      const r = await api.post(`/api/students/${studentId}/pathways`, lv ? { levels: lv } : {});
      setPlan(r);
      if (!lv) { setLevels(r.honest.honest); setChoices(r.choices.map((c) => c.id)); }
    } catch (e) { setErr(e); }
  };
  useEffect(() => { run(); }, [studentId]);

  if (err && !plan) return <ErrorBox error={err} />;
  if (!plan) return <Loading />;
  const sim = plan.simulation;
  const progs = plan.programmes;
  const setMode2 = (m) => {
    setMode(m);
    const lv = m === 'school' ? plan.honest.school : plan.honest.honest;
    setLevels(lv); run(lv);
  };
  const setLevel = (k, v) => { const lv = { ...levels, [k]: v }; setLevels(lv); setMode('custom'); run(lv); };
  const saveChoices = async () => {
    setBusy(true);
    try { await api.put(`/api/students/${studentId}/jupas`, { choices }); await run(levels); notify('JUPAS choices saved'); }
    catch (e) { setErr(e); } finally { setBusy(false); }
  };
  const move = (i, d) => setChoices((c) => { const n = [...c]; const j = i + d; if (j < 0 || j >= n.length) return n; [n[i], n[j]] = [n[j], n[i]]; return n; });
  const statusOf = (id) => sim.jupas.find((p) => p.id === id);
  const groups = ['Reach', 'Match', 'Safe'];
  const dirty = choices.join() !== plan.choices.map((c) => c.id).join();

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Simulated Best 5" value={sim.best5} sub={mode === 'honest' ? 'Honest calibrated grades' : mode === 'school' ? 'School predicted grades' : 'Custom what-if grades'} tone={mode === 'school' ? 'amber' : undefined} />
        <Stat label="School-prediction Best 5" value={plan.schoolSimulation.best5} sub="What your report card implies" />
        <Stat label="JUPAS programmes within reach" value={sim.jupas.filter((p) => ['Match', 'Safe'].includes(p.status)).length} sub={`of ${sim.jupas.length} tracked`} />
        <Stat label="Sub-degree safety net" value={sim.eligibleSubdegree ? 'Eligible' : 'Not yet'} sub="5 subjects at Level 2 incl. Chi & Eng" tone={sim.eligibleSubdegree ? 'green' : 'red'} />
      </div>

      <Card title="Grade scenario 成績模擬" subtitle="Switch scenario or set any subject to see how every pathway responds" icon={SlidersHorizontal}
        actions={<div className="flex rounded-lg bg-slate-100 p-0.5 text-sm">{[['honest', 'Honest'], ['school', 'School predicted'], ['custom', 'Custom']].map(([k, l]) => <button key={k} disabled={k === 'custom'} onClick={() => setMode2(k)} className={`rounded-md px-2.5 py-1 ${mode === k ? 'bg-white font-medium text-brand-700 shadow-sm' : 'text-slate-600'}`}>{l}</button>)}</div>}>
        <div className="flex flex-wrap gap-3">
          {Object.entries(levels).map(([k, v]) => (
            <label key={k} className="flex items-center gap-2 rounded-lg border border-slate-200 px-2 py-1.5 text-sm">
              <span className="font-medium">{(meta.subjectNames[k] || k).split(' ')[0].replace('Mathematics', 'Maths')}</span>
              <select className="input w-20 py-1" value={v} onChange={(e) => setLevel(k, e.target.value)}>{LEVELS.map((l) => <option key={l}>{l}</option>)}</select>
              {plan.honest.school[k] !== v && <span className="text-xs text-slate-400">school {plan.honest.school[k]}</span>}
            </label>
          ))}
        </div>
      </Card>

      <Card title="My JUPAS choices (Band A–E)" subtitle="Status under the current scenario vs. under school predictions" icon={GraduationCap}
        actions={dirty && <button className="btn-primary" disabled={busy} onClick={saveChoices}><Save className="h-4 w-4" />Save order</button>} bodyClass="p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px]">
            <thead className="bg-slate-50"><tr><th className="th">Band</th><th className="th">Programme</th><th className="th">LQ / Median</th><th className="th">Gap vs LQ</th><th className="th">This scenario</th><th className="th">If school prediction were right</th><th className="th"></th></tr></thead>
            <tbody>
              {choices.map((id, i) => {
                const p = statusOf(id);
                const old = plan.choices.find((c) => c.id === id);
                return (
                  <tr key={id} className="border-t border-slate-100">
                    <td className="td font-semibold">{'ABCDE'[i]}</td>
                    <td className="td"><div className="font-medium">{p.inst} · {p.name}</div><div className="text-xs text-slate-500">{p.zh}{p.missing.length ? ` · ${p.missing.join('; ')}` : ''}</div></td>
                    <td className="td text-sm">{p.lq} / {p.median}</td>
                    <td className={`td font-medium ${p.gap < 0 ? 'text-red-600' : 'text-emerald-700'}`}>{p.gap > 0 ? '+' : ''}{p.gap}</td>
                    <td className="td"><StatusBadge status={p.status} /></td>
                    <td className="td">{old ? <StatusBadge status={old.schoolStatus} /> : <span className="text-xs text-slate-400">new</span>}</td>
                    <td className="td whitespace-nowrap">
                      <button className="btn-ghost p-1" onClick={() => move(i, -1)} aria-label="Move up"><ArrowUp className="h-4 w-4" /></button>
                      <button className="btn-ghost p-1" onClick={() => move(i, 1)} aria-label="Move down"><ArrowDown className="h-4 w-4" /></button>
                      <button className="btn-ghost p-1" onClick={() => setChoices((c) => c.filter((x) => x !== id))} aria-label="Remove"><X className="h-4 w-4" /></button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {plan.recommended.length > 0 && (
          <div className="border-t border-slate-100 p-3 text-sm">
            <span className="font-medium">Suggested balanced band order: </span>
            {plan.recommended.map((id) => { const p = statusOf(id); return <Badge key={id} tone="slate" className="mr-1">{p.inst} {p.name.split(' (')[0]} · {p.status}</Badge>; })}
            <button className="btn-outline ml-2 mt-1" onClick={() => setChoices(plan.recommended)}>Use this order</button>
          </div>
        )}
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Track 1 · JUPAS degrees 學士" subtitle="Indicative Best-5 cut-offs (demo data)" icon={GraduationCap} bodyClass="p-3">
          <div className="space-y-3">
            {groups.map((g) => {
              const list = sim.jupas.filter((p) => p.status === g);
              return (
                <div key={g}>
                  <div className="mb-1 flex items-center gap-2"><StatusBadge status={g} /><span className="text-xs text-slate-500">{g === 'Reach' ? 'within 3 points below LQ' : g === 'Match' ? 'at or above LQ' : 'above median'}</span></div>
                  {list.length === 0 && <div className="pl-1 text-xs text-slate-400">None under this scenario</div>}
                  {list.map((p) => (
                    <div key={p.id} className="flex items-center justify-between gap-2 border-b border-slate-50 py-1 text-sm">
                      <span>{p.inst} · {p.name}</span>
                      <span className="flex items-center gap-2 text-xs text-slate-500">LQ {p.lq} <b className={p.gap < 0 ? 'text-red-600' : 'text-emerald-700'}>{p.gap > 0 ? '+' : ''}{p.gap}</b>
                        {!choices.includes(p.id) && choices.length < 5 && <button className="btn-ghost p-0.5" title="Add to my choices" onClick={() => setChoices((c) => [...c, p.id])}><Plus className="h-3.5 w-3.5" /></button>}
                      </span>
                    </div>
                  ))}
                </div>
              );
            })}
            <details className="text-sm"><summary className="cursor-pointer text-slate-500">Out of reach / ineligible ({sim.jupas.filter((p) => ['Unrealistic', 'Ineligible'].includes(p.status)).length})</summary>
              {sim.jupas.filter((p) => ['Unrealistic', 'Ineligible'].includes(p.status)).map((p) => <div key={p.id} className="flex justify-between py-0.5 text-xs text-slate-500"><span>{p.inst} · {p.name}</span><span>{p.status}{p.missing[0] ? ` — ${p.missing[0]}` : ` (${p.gap})`}</span></div>)}
            </details>
          </div>
        </Card>

        <Card title="Track 2 · Sub-degree safety net 副學士 / 高級文憑" subtitle="Associate Degree & Higher Diploma with articulation routes" icon={LifeBuoy} bodyClass="p-3">
          <div className="space-y-2">
            {sim.subdegree.map((s) => (
              <div key={s.id} className={`rounded-lg border p-2.5 text-sm ${s.fieldMatch ? 'border-brand-100 bg-brand-50/40' : 'border-slate-200'}`}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div><span className="font-medium">{s.name}</span> <span className="text-slate-400">{s.zh}</span></div>
                  <div className="flex gap-1"><Badge tone="violet">{s.type}</Badge><StatusBadge status={s.status.startsWith('Not') ? 'Ineligible' : s.status} /></div>
                </div>
                <div className="mt-1 text-xs text-slate-500">{s.inst} · Articulation: {s.articulation} · ~{Math.round(s.articulationRate * 100)}% articulate (demo)</div>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-slate-500">Results-day rule: apply to 1–2 sub-degree programmes in your field during the JUPAS waiting period so you never start from zero.</p>
        </Card>
      </div>
    </div>
  );
}
