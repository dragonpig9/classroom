import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Lightbulb, Grid3X3, Scale, ListX, Target, Info } from 'lucide-react';
import { Card, Badge, Loading, ErrorBox, ChartTip, SERIES, Stat, useFetch } from '../ui.jsx';

// Sequential: one hue, light → dark. Diverging: two hues + neutral midpoint.
function lerp(a, b, t) {
  const pa = a.match(/\w\w/g).map((x) => parseInt(x, 16));
  const pb = b.match(/\w\w/g).map((x) => parseInt(x, 16));
  return '#' + pa.map((v, i) => Math.round(v + (pb[i] - v) * t).toString(16).padStart(2, '0')).join('');
}
const seq = (v) => (v <= 50 ? lerp('eef5fd', '6aa5e8', v / 50) : lerp('6aa5e8', '1a4f91', Math.min(1, (v - 50) / 30)));
const div = (g) => (g >= 0 ? lerp('f1f0ed', 'd95926', Math.min(1, g / 25)) : lerp('f1f0ed', '2a78d6', Math.min(1, -g / 25)));
const ink = (bg) => { const [r, g, b] = bg.match(/\w\w/g).map((x) => parseInt(x, 16)); return (r * 299 + g * 587 + b * 114) / 1000 < 140 ? '#ffffff' : '#0b0b0b'; };

export default function TeachingInsights({ meta }) {
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [metric, setMetric] = useState('hkeaa');
  const [hover, setHover] = useState(null);
  const { data, loading, error } = useFetch(`/api/hkeaa/insights${verifiedOnly ? '?verifiedOnly=1' : ''}`);
  if (loading && !data) return <Loading />;
  if (error) return <ErrorBox error={error} />;

  const cell = (s, t) => data.heatmap.find((h) => h.subject === s && h.type === t);
  const types = data.types.filter((t) => data.heatmap.some((h) => h.type === t));
  const CORE = { CHI: 'Chinese', ENG: 'English', MATH: 'Maths', CSD: 'CSD' };
  const subjName = (s) => CORE[s] || meta.electives.find((e) => e.key === s)?.short || s;
  const over = data.overPrediction.map((o) => ({ ...o, label: subjName(o.subject) }));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Pedagogical Feedback Dashboard 教學回饋</h1>
          <p className="text-sm text-slate-500">Aggregated from HKEAA Examination Reports vs. internal marking. Updates live as teachers label items in the analyzer.</p>
        </div>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={verifiedOnly} onChange={(e) => setVerifiedOnly(e.target.checked)} />Human-verified labels only</label>
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Question items analysed" value={data.coverage.itemsCounted} sub={`across ${data.coverage.reports} reports`} />
        <Stat label="Human-verified" value={`${Math.round((data.coverage.verified / Math.max(1, data.coverage.itemsCounted)) * 100)}%`} sub={`${data.coverage.verified} items`} tone="green" />
        <Stat label="Most over-predicted subject" value={over[0] ? subjName(over[0].subject) : '—'} sub={over[0] ? `+${over[0].mean} level vs HKDSE (n=${over[0].n})` : ''} tone="red" />
        <Stat label="Biggest mark sink" value={<span className="text-lg">{data.reasons[0]?.reason || '—'}</span>} sub={data.reasons[0] ? `${data.reasons[0].lost} marks lost in HKEAA papers` : ''} tone="amber" />
      </div>

      <Card title="Actionable teaching adjustments" subtitle="Highest HKEAA mark loss, weighted by how much more lenient internal marking is" icon={Lightbulb}>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {data.recommendations.map((r, i) => (
            <div key={i} className="rounded-lg border border-slate-200 p-3">
              <div className="flex items-center gap-2"><span className="grid h-6 w-6 place-items-center rounded-full bg-brand-600 text-xs font-semibold text-white">{i + 1}</span><span className="text-sm font-semibold">{subjName(r.subject)} · {r.type}</span></div>
              <div className="mt-2 flex flex-wrap gap-1"><Badge tone="red">HKEAA loss {r.hkeaaLoss}%</Badge>{r.internalLoss != null && <Badge tone="slate">Internal loss {r.internalLoss}%</Badge>}{r.topReason && <Badge tone="amber">{r.topReason}</Badge>}</div>
              <p className="mt-2 text-sm text-slate-700">{r.action}</p>
            </div>
          ))}
        </div>
      </Card>

      <Card title="Cohort heatmap — where marks are lost" icon={Grid3X3}
        subtitle={metric === 'hkeaa' ? '% of available marks lost in HKEAA papers (darker = more loss)' : 'HKEAA loss minus internal loss (orange = school marks more leniently; blue = school stricter)'}
        actions={<div className="flex rounded-lg bg-slate-100 p-0.5 text-sm">{[['hkeaa', 'HKEAA loss %'], ['gap', 'School leniency gap']].map(([k, l]) => <button key={k} onClick={() => setMetric(k)} className={`rounded-md px-2.5 py-1 ${metric === k ? 'bg-white font-medium shadow-sm' : 'text-slate-600'}`}>{l}</button>)}</div>}>
        <div className="overflow-x-auto">
          <table className="border-separate" style={{ borderSpacing: 2 }}>
            <thead><tr><th className="th">Subject</th>{types.map((t) => <th key={t} className="th min-w-[92px] text-center normal-case">{t}</th>)}</tr></thead>
            <tbody>
              {data.subjects.map((s) => (
                <tr key={s}>
                  <td className="td whitespace-nowrap font-medium">{subjName(s)}</td>
                  {types.map((t) => {
                    const c = cell(s, t);
                    const v = c ? (metric === 'hkeaa' ? c.hkeaaLoss : c.gap) : null;
                    if (v == null) return <td key={t} className="rounded bg-slate-50 text-center text-xs text-slate-300">—</td>;
                    const bg = metric === 'hkeaa' ? seq(v) : div(v);
                    return (
                      <td key={t} className="h-10 cursor-default rounded text-center text-xs font-medium" style={{ background: bg, color: ink(bg) }}
                        onMouseEnter={() => setHover({ s, t, c })} onMouseLeave={() => setHover(null)}>
                        {metric === 'gap' && v > 0 ? '+' : ''}{v}{metric === 'hkeaa' ? '%' : ''}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-2 min-h-[20px] text-xs text-slate-600">
          {hover ? <><b>{subjName(hover.s)} · {hover.t}:</b> HKEAA loss {hover.c.hkeaaLoss ?? '—'}% · internal loss {hover.c.internalLoss ?? '—'}% · gap {hover.c.gap ?? '—'} pts · {hover.c.n} items</> : <span className="flex items-center gap-1 text-slate-400"><Info className="h-3.5 w-3.5" />Hover a cell for details</span>}
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Where the school over-predicts" subtitle="Mean (school predicted − actual HKDSE level), past cohorts" icon={Scale}>
          <div className="h-72">
            <ResponsiveContainer>
              <BarChart data={over} layout="vertical" margin={{ top: 4, right: 24, left: 4, bottom: 0 }}>
                <CartesianGrid stroke="#eceae6" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11 }} tickLine={false} domain={[0, 'auto']} />
                <YAxis type="category" dataKey="label" width={70} interval={0} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <ReferenceLine x={0.5} stroke="#a3a19a" strokeDasharray="4 4" />
                <Tooltip content={<ChartTip fmt={(v, p) => `+${v} level (n=${p.payload.n})`} />} cursor={{ fill: '#f3f2ef' }} />
                <Bar dataKey="mean" name="Over-prediction" fill={SERIES[1]} radius={[0, 4, 4, 0]} barSize={12} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card title="Marks lost by reason (HKEAA papers)" subtitle="What examiners actually penalise" icon={ListX}>
          <div className="h-72">
            <ResponsiveContainer>
              <BarChart data={data.reasons} layout="vertical" margin={{ top: 4, right: 24, left: 4, bottom: 0 }}>
                <CartesianGrid stroke="#eceae6" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11 }} tickLine={false} />
                <YAxis type="category" dataKey="reason" width={160} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <Tooltip content={<ChartTip fmt={(v) => `${v} marks`} />} cursor={{ fill: '#f3f2ef' }} />
                <Bar dataKey="lost" name="Marks lost" fill={SERIES[0]} radius={[0, 4, 4, 0]} barSize={12} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
      <p className="flex items-center gap-1 text-xs text-slate-400"><Target className="h-3.5 w-3.5" />Calibration feeds the F.6 Honest DSE Predictor: the over-prediction per subject is the deflation curve applied to every student.</p>
    </div>
  );
}
