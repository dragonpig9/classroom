import React, { useMemo, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend, BarChart, Bar, ReferenceLine } from 'recharts';
import { TrendingUp, TrendingDown, Activity, Brain, ListX, Table2 } from 'lucide-react';
import { Card, Stat, Loading, ErrorBox, ChartTip, SERIES, Badge, useFetch } from '../ui.jsx';

const shortName = (meta, k) => (meta.subjectNames[k] || k).replace(/ [^ ]*[一-鿿]+.*$/, '');

export default function ProfileView({ studentId, meta, compact = false }) {
  const { data: s, loading, error } = useFetch(`/api/students/${studentId}`);
  const subjects = useMemo(() => {
    if (!s) return [];
    const set = new Set();
    s.history.forEach((h) => Object.keys(h.scores).forEach((k) => set.add(k)));
    return [...set];
  }, [s]);
  const defaultSel = useMemo(() => {
    if (!s) return [];
    return s.form === 6 ? ['ENG', 'MATH', ...(s.electives || [])].slice(0, 5) : ['ENG', 'MATH', 'ISCI', 'JHIST'];
  }, [s]);
  const [slots, setSlots] = useState(null); // subject -> colour slot (stable)
  const sel = slots || Object.fromEntries(defaultSel.map((k, i) => [k, i]));
  const toggle = (k) => {
    const next = { ...sel };
    if (k in next) delete next[k];
    else {
      const used = new Set(Object.values(next));
      const free = [0, 1, 2, 3, 4, 5].find((i) => !used.has(i));
      if (free === undefined) return;
      next[k] = free;
    }
    setSlots(next);
  };
  const [showTable, setShowTable] = useState(false);
  const [mFilter, setMFilter] = useState('all');

  if (loading) return <Loading />;
  if (error) return <ErrorBox error={error} />;

  const latest = s.history.at(-1);
  const first = s.history[0];
  const rows = s.history.map((h) => ({ label: h.label, average: h.average, percentile: h.percentile, ...h.scores }));
  const radar = meta.skills.map((sk) => ({ skill: `${sk.name}`, first: s.skillHistory[0][sk.key], now: s.skillHistory.at(-1)[sk.key] }));
  const mistakes = s.mistakes.filter((m) => mFilter === 'all' || m.subject === mFilter);
  const byType = Object.entries(s.mistakes.reduce((a, m) => ({ ...a, [m.questionType]: (a[m.questionType] || 0) + m.marksLost }), {})).map(([type, lost]) => ({ type, lost })).sort((a, b) => b.lost - a.lost);
  const trend = latest.average - first.average;

  return (
    <div className="space-y-4">
      {!compact && (
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">{s.name} <span className="text-slate-500">{s.nameZh}</span></h1>
            <p className="text-sm text-slate-500">Class {s.cls} · No. {s.classNo} · Longitudinal record F.1 → F.{s.form}</p>
          </div>
          {s.form === 6 && <div className="flex gap-1">{s.electives.map((e) => <Badge key={e} tone="blue">{shortName(meta, e)}</Badge>)}</div>}
        </div>
      )}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label={`Latest average · ${latest.label}`} value={latest.average} sub={`F.1 T1: ${first.average}`} />
        <Stat label="Form percentile" value={`P${latest.percentile}`} sub={`from P${first.percentile} in F.1`} tone={latest.percentile >= first.percentile ? 'green' : 'amber'} />
        <Stat label="Overall trend" value={<span className="flex items-center gap-1">{trend >= 0 ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}{trend > 0 ? '+' : ''}{trend}</span>} sub="points since F.1" tone={trend >= 0 ? 'green' : 'red'} />
        <Stat label="Mistakes logged" value={s.mistakes.length} sub={`${s.mistakes.reduce((a, m) => a + m.marksLost, 0)} marks lost in total`} />
      </div>

      <Card title="Subject trajectory 成績走勢" subtitle="Select up to 6 subjects · gaps = subject not taken that term" icon={Activity}
        actions={<button className="btn-outline py-1" onClick={() => setShowTable((v) => !v)}><Table2 className="h-4 w-4" />{showTable ? 'Chart' : 'Table'}</button>}>
        <div className="mb-3 flex flex-wrap gap-1.5">
          {subjects.map((k) => {
            const on = k in sel;
            return (
              <button key={k} onClick={() => toggle(k)} className={`flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs ${on ? 'border-slate-300 bg-white font-medium text-slate-800' : 'border-transparent bg-slate-100 text-slate-500'}`}>
                {on && <span className="h-2 w-2 rounded-full" style={{ background: SERIES[sel[k]] }} />}{shortName(meta, k)}
              </button>
            );
          })}
        </div>
        {showTable ? (
          <div className="max-h-80 overflow-auto">
            <table className="w-full"><thead className="sticky top-0 bg-white"><tr><th className="th">Term</th>{Object.keys(sel).map((k) => <th key={k} className="th">{shortName(meta, k)}</th>)}<th className="th">Avg</th><th className="th">Pctl</th></tr></thead>
              <tbody>{rows.map((r) => <tr key={r.label} className="border-t border-slate-100"><td className="td font-medium">{r.label}</td>{Object.keys(sel).map((k) => <td key={k} className="td">{r[k] ?? '—'}</td>)}<td className="td">{r.average}</td><td className="td">P{r.percentile}</td></tr>)}</tbody></table>
          </div>
        ) : (
          <div className="h-72">
            <ResponsiveContainer>
              <LineChart data={rows} margin={{ top: 8, right: 16, left: -16, bottom: 0 }}>
                <CartesianGrid stroke="#eceae6" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} tickLine={false} axisLine={{ stroke: '#d4d2cc' }} interval={0} angle={-30} textAnchor="end" height={50} />
                <YAxis domain={[20, 100]} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                {s.form === 6 && <ReferenceLine x="F.4 T1" stroke="#a3a19a" strokeDasharray="4 4" label={{ value: 'Senior / DSE', position: 'insideTopLeft', fontSize: 11, fill: '#7a786f' }} />}
                <Tooltip content={<ChartTip />} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                {Object.entries(sel).map(([k, slot]) => (
                  <Line key={k} dataKey={k} name={shortName(meta, k)} stroke={SERIES[slot]} strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5, strokeWidth: 2, stroke: '#fff' }} connectNulls={false} />
                ))}
                <Line dataKey="average" name="Average" stroke="#52514e" strokeWidth={2} strokeDasharray="5 4" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card title="Form percentile 級排名百分位" subtitle="vs. modelled form cohort" icon={TrendingUp}>
          <div className="h-56">
            <ResponsiveContainer>
              <AreaChart data={rows} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
                <CartesianGrid stroke="#eceae6" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 10 }} tickLine={false} interval={1} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <Tooltip content={<ChartTip fmt={(v) => `P${v}`} />} />
                <Area dataKey="percentile" name="Percentile" stroke={SERIES[0]} strokeWidth={2} fill={SERIES[0]} fillOpacity={0.12} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card title="Skill radar 能力雷達" subtitle={`F.1 vs F.${s.form}`} icon={Brain}>
          <div className="h-56">
            <ResponsiveContainer>
              <RadarChart data={radar} outerRadius="70%">
                <PolarGrid stroke="#e2e0da" />
                <PolarAngleAxis dataKey="skill" tick={{ fontSize: 10 }} />
                <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
                <Radar name="F.1" dataKey="first" stroke={SERIES[1]} fill={SERIES[1]} fillOpacity={0.08} strokeWidth={2} />
                <Radar name={`F.${s.form} (now)`} dataKey="now" stroke={SERIES[0]} fill={SERIES[0]} fillOpacity={0.15} strokeWidth={2} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Tooltip content={<ChartTip />} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-1 grid grid-cols-2 gap-1 text-xs">
            {meta.skills.map((sk) => {
              const v = s.skills[sk.key];
              return <div key={sk.key} className="flex justify-between rounded bg-slate-50 px-2 py-1"><span>{sk.name} {sk.zh}</span><span className={v.slope < -2 ? 'font-semibold text-red-600' : 'text-slate-600'}>{v.slope > 0 ? '+' : ''}{v.slope}/yr</span></div>;
            })}
          </div>
        </Card>
        <Card title="Marks lost by question type" subtitle="All forms, all sources" icon={ListX}>
          <div className="h-64">
            <ResponsiveContainer>
              <BarChart data={byType} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 0 }}>
                <CartesianGrid stroke="#eceae6" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11 }} tickLine={false} />
                <YAxis type="category" dataKey="type" width={110} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <Tooltip content={<ChartTip fmt={(v) => `${v} marks`} />} cursor={{ fill: '#f3f2ef' }} />
                <Bar dataKey="lost" name="Marks lost" fill={SERIES[0]} radius={[0, 4, 4, 0]} barSize={14} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <Card title="Mistake log 錯題紀錄" subtitle="Tagged by question type & mark-loss reason — feeds the Revision Hub" icon={ListX}
        actions={<select className="input w-auto py-1" value={mFilter} onChange={(e) => setMFilter(e.target.value)}><option value="all">All subjects</option>{[...new Set(s.mistakes.map((m) => m.subject))].map((k) => <option key={k} value={k}>{shortName(meta, k)}</option>)}</select>}
        bodyClass="p-0">
        <div className="max-h-80 overflow-auto">
          <table className="w-full">
            <thead className="sticky top-0 bg-slate-50"><tr><th className="th">Term</th><th className="th">Subject</th><th className="th">Topic</th><th className="th">Question type</th><th className="th">Reason</th><th className="th text-right">Lost</th><th className="th">Source</th></tr></thead>
            <tbody>
              {[...mistakes].reverse().map((m) => (
                <tr key={m.id} className="border-t border-slate-100">
                  <td className="td whitespace-nowrap">{m.term}</td><td className="td">{shortName(meta, m.subject)}</td><td className="td">{m.topic}</td>
                  <td className="td"><Badge>{m.questionType}</Badge></td><td className="td">{m.reason}</td><td className="td text-right font-medium">−{m.marksLost}</td><td className="td text-xs text-slate-500">{m.source}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
