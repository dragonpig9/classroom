import React, { useEffect, useState } from 'react';
import { Compass, Sparkles, AlertTriangle, Save, FlaskConical, Info } from 'lucide-react';
import { api } from '../api.js';
import { Card, Badge, Loading, ErrorBox, RiskBadge, Progress, useFetch } from '../ui.jsx';

export default function ElectiveAdvisor({ studentId, meta, notify, onGoTasters }) {
  const { data, loading, error, setData } = useFetch(`/api/students/${studentId}/fit`);
  const [draft, setDraft] = useState([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  useEffect(() => { if (data) setDraft(data.choices.keys); }, [data]);

  if (loading) return <Loading />;
  if (error) return <ErrorBox error={error} />;
  const byKey = Object.fromEntries(data.ranking.map((r) => [r.key, r]));
  const toggle = (k) => setDraft((d) => (d.includes(k) ? d.filter((x) => x !== k) : d.length < 3 ? [...d, k] : d));
  const save = async (keys) => {
    setBusy(true); setErr(null);
    try { const r = await api.put(`/api/students/${studentId}/choices`, { choices: keys }); setData(r); notify('Elective choices saved — teacher dashboard updated'); }
    catch (e) { setErr(e); } finally { setBusy(false); }
  };
  const dirty = draft.join() !== data.choices.keys.join();
  const highRisk = data.choices.evaluation.filter((e) => e.dropRisk === 'High');

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="My current choices 我的選科" subtitle="Evaluated against F.1–F.3 record, projected F.5 skills and Real DSE Tasters" icon={Compass}>
          {highRisk.length > 0 && (
            <div className="mb-3 flex gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <div><b>Drop-Risk Warning:</b> {highRisk.map((h) => h.name).join(', ')} show{highRisk.length === 1 ? 's' : ''} a high chance of struggling (or dropping) in F.5. Read why below before submitting your form.</div>
            </div>
          )}
          <div className="space-y-3">
            {data.choices.evaluation.map((e) => (
              <div key={e.key} className="rounded-lg border border-slate-200 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="font-medium">{e.name} <span className="text-slate-400">{e.zh}</span></div>
                  <div className="flex items-center gap-2"><span className="text-sm font-semibold">Fit {e.fit}</span><RiskBadge level={e.dropRisk} label={`Drop-risk ${e.dropRisk}`} /></div>
                </div>
                {e.riskReasons.length > 0 ? (
                  <ul className="mt-2 list-disc space-y-0.5 pl-5 text-sm text-slate-600">{e.riskReasons.map((x, i) => <li key={i}>{x}</li>)}</ul>
                ) : <p className="mt-1 text-sm text-slate-500">Strong evidence across junior record and skills.</p>}
                {!e.tasterAttempted && <button className="btn-ghost mt-1 px-0 text-brand-700" onClick={onGoTasters}><FlaskConical className="h-4 w-4" />Try the Real DSE Taster for {e.short}</button>}
              </div>
            ))}
            {data.choices.comboWarnings.map((w, i) => (
              <div key={i} className="flex items-start gap-2 text-sm"><RiskBadge level={w.level} label={`Combination · ${w.level}`} /><span className="text-slate-700">{w.text}</span></div>
            ))}
          </div>
        </Card>

        <Card title="Recommended combination 建議組合" subtitle="Highest fit with no high drop-risk and no clashing combination" icon={Sparkles}>
          <div className="grid gap-2 sm:grid-cols-3">
            {data.recommended.map((k, i) => {
              const r = byKey[k];
              return (
                <div key={k} className="rounded-lg border border-brand-100 bg-brand-50 p-3">
                  <div className="text-xs font-medium text-brand-700">#{i + 1}</div>
                  <div className="font-semibold text-slate-900">{r.short}</div>
                  <div className="text-xs text-slate-500">{r.zh}</div>
                  <div className="mt-2 text-2xl font-semibold text-brand-700">{r.fit}</div>
                  <RiskBadge level={r.dropRisk} label={`Risk ${r.dropRisk}`} />
                </div>
              );
            })}
          </div>
          <div className="mt-4 space-y-2 text-sm text-slate-600">
            <p className="flex gap-1.5"><Info className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />Fit = 40% related F.1–F.3 subjects + 40% skills projected to F.5 + 20% Real Taster (discounted 15% because tasters are still easier than F.5).</p>
            <div className="flex flex-wrap gap-2">
              <button className="btn-outline" onClick={() => setDraft(data.recommended)}>Load recommendation into my form</button>
            </div>
          </div>
          <div className="mt-4 border-t border-slate-100 pt-3">
            <div className="label mb-2">Edit my 3 electives ({draft.length}/3)</div>
            <div className="flex flex-wrap gap-1.5">
              {meta.electives.map((e) => (
                <button key={e.key} onClick={() => toggle(e.key)} className={`rounded-full border px-2.5 py-1 text-xs font-medium ${draft.includes(e.key) ? 'border-brand-500 bg-brand-600 text-white' : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'}`}>{e.short} {e.zh}</button>
              ))}
            </div>
            <ErrorBox error={err} />
            <button className="btn-primary mt-3" disabled={!dirty || draft.length !== 3 || busy} onClick={() => save(draft)}><Save className="h-4 w-4" />{busy ? 'Saving…' : 'Save choices'}</button>
          </div>
        </Card>
      </div>

      <Card title="Elective Fit Engine — all 12 electives" subtitle="Ranked by fit. Bars show each evidence source on a 0–100 scale." bodyClass="p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px]">
            <thead className="bg-slate-50"><tr><th className="th">#</th><th className="th">Elective</th><th className="th w-36">F.1–F.3 related</th><th className="th w-36">Real Taster</th><th className="th w-36">Skills @ F.5</th><th className="th">Fit</th><th className="th">Drop-risk</th></tr></thead>
            <tbody>
              {data.ranking.map((r, i) => (
                <tr key={r.key} className={`border-t border-slate-100 ${draft.includes(r.key) ? 'bg-brand-50/50' : ''}`}>
                  <td className="td text-slate-400">{i + 1}</td>
                  <td className="td"><div className="font-medium">{r.short} <span className="text-slate-400">{r.zh}</span></div>{data.choices.keys.includes(r.key) && <Badge tone="blue">Chosen</Badge>}</td>
                  <td className="td"><div className="flex items-center gap-2"><Progress value={r.junior} /><span className="w-7 text-xs">{r.junior}</span></div></td>
                  <td className="td">{r.tasterPct != null ? <div className="flex items-center gap-2"><Progress value={r.tasterPct} tone="amber" /><span className="w-7 text-xs">{r.tasterPct}</span></div> : <span className="text-xs text-slate-400">not tried</span>}</td>
                  <td className="td"><div className="flex items-center gap-2"><Progress value={r.projected} tone="green" /><span className="w-7 text-xs">{r.projected}</span></div></td>
                  <td className="td text-base font-semibold">{r.fit}</td>
                  <td className="td"><span title={r.riskReasons.join('\n')}><RiskBadge level={r.dropRisk} /></span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
