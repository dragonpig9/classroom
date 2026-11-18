import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Target, Scale, ArrowRight, Info } from 'lucide-react';
import { Card, Stat, Loading, ErrorBox, ChartTip, SERIES, Badge, useFetch } from '../ui.jsx';

const LEVELS = ['U', '1', '2', '3', '4', '5', '5*', '5**'];
const idx = (l) => LEVELS.indexOf(l);

export default function HonestPredictor({ studentId, onGoPathways }) {
  const { data, loading, error } = useFetch(`/api/students/${studentId}/prediction`);
  if (loading) return <Loading />;
  if (error) return <ErrorBox error={error} />;
  const graded = data.rows.filter((r) => r.subject !== 'CSD');
  const chart = graded.map((r) => ({ subject: r.name.split(' ')[0].replace('Mathematics', 'Maths'), school: idx(r.school), honest: idx(r.honest) }));
  const gap = data.schoolBest5 - data.honestBest5;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="School predicted Best 5" value={data.schoolBest5} sub="Internal mock → school conversion" />
        <Stat label="Calibrated (honest) Best 5" value={data.honestBest5} sub="Mark-scheme + cohort deflation" tone="amber" />
        <Stat label="Inflation gap" value={gap > 0 ? `−${gap}` : '0'} sub="points you should NOT plan on" tone={gap >= 3 ? 'red' : gap > 0 ? 'amber' : 'green'} />
        <Stat label="3322 core" value={['CHI', 'ENG'].every((k) => idx(data.honest[k]) >= 3) && idx(data.honest.MATH) >= 2 ? 'Met' : 'At risk'} sub="Chi 3 · Eng 3 · Maths 2 · CSD A" tone={['CHI', 'ENG'].every((k) => idx(data.honest[k]) >= 3) ? 'green' : 'red'} />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.1fr_1fr]">
        <Card title="School prediction vs Mark-Scheme Calibrated grade" subtitle="Side-by-side, per subject" icon={Scale}>
          <div className="h-72">
            <ResponsiveContainer>
              <BarChart data={chart} margin={{ top: 8, right: 8, left: -20, bottom: 0 }} barGap={2}>
                <CartesianGrid stroke="#eceae6" vertical={false} />
                <XAxis dataKey="subject" tick={{ fontSize: 11 }} tickLine={false} />
                <YAxis domain={[0, 7]} ticks={[1, 2, 3, 4, 5, 6, 7]} tickFormatter={(v) => LEVELS[v]} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <Tooltip content={<ChartTip fmt={(v) => `Level ${LEVELS[v]}`} />} cursor={{ fill: '#f3f2ef' }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="school" name="School predicted" fill={SERIES[1]} radius={[4, 4, 0, 0]} barSize={18} />
                <Bar dataKey="honest" name="Calibrated (honest)" fill={SERIES[0]} radius={[4, 4, 0, 0]} barSize={18} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card title="How the honest grade is calibrated" icon={Info}>
          <ol className="list-decimal space-y-2 pl-5 text-sm text-slate-600">
            <li><b>Start from your mock mark</b>, converted to a continuous DSE level (not the school's rounded-up band).</li>
            <li><b>Cohort deflation curve:</b> subtract how far this school's predictions overshot real HKDSE results for past cohorts (from collected HKEAA results, 2023–2025).</li>
            <li><b>Mark-scheme penalty:</b> if most of your lost marks are keyword / elaboration / data-citation issues — which HKEAA markers penalise more strictly than internal markers — subtract up to half a level.</li>
            <li><b>Skill trend:</b> weak essay argumentation or a falling quantitative trend adjusts essay-heavy or calculation-heavy subjects.</li>
          </ol>
          <p className="mt-3 rounded-lg bg-amber-50 p-2.5 text-sm text-amber-900">This is deliberately conservative. Plan JUPAS around the honest grade, and treat anything above it as upside on results day.</p>
          <button className="btn-primary mt-3" onClick={onGoPathways}>Plan 升學 pathways with honest grades <ArrowRight className="h-4 w-4" /></button>
        </Card>
      </div>

      <Card title="Subject-by-subject breakdown" icon={Target} bodyClass="p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px]">
            <thead className="bg-slate-50"><tr><th className="th">Subject</th><th className="th">Mock mark</th><th className="th">School</th><th className="th">Honest</th><th className="th">Likely range</th><th className="th">Confidence</th><th className="th">Why</th></tr></thead>
            <tbody>
              {data.rows.map((r) => (
                <tr key={r.subject} className="border-t border-slate-100 align-top">
                  <td className="td font-medium">{r.name}</td>
                  <td className="td">{r.mock}</td>
                  <td className="td"><Badge tone="amber">{r.school}</Badge></td>
                  <td className="td"><Badge tone={r.gap > 0 ? 'red' : 'green'}>{r.honest}</Badge>{r.gap > 0 && <span className="ml-1 text-xs text-red-600">−{r.gap}</span>}</td>
                  <td className="td text-xs">{r.range ? `${r.range[0]} – ${r.range[1]}` : '—'}</td>
                  <td className="td text-xs">{r.confidence ? `${r.confidence}%` : '—'}</td>
                  <td className="td"><ul className="list-disc space-y-0.5 pl-4 text-xs text-slate-600">{r.reasons.map((x, i) => <li key={i}>{x}</li>)}</ul></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
