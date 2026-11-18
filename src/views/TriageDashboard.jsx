import React, { useMemo, useState } from 'react';
import { Users, Search, MessageSquarePlus, CheckCircle2, Clock, Flag, LineChart, ChevronRight, Lightbulb, TrendingUp, TrendingDown } from 'lucide-react';
import { api } from '../api.js';
import { Card, Badge, Loading, ErrorBox, RiskBadge, Stat, Modal, StatusBadge, useFetch } from '../ui.jsx';
import ProfileView from './ProfileView.jsx';

const FILTERS = [
  { key: 'all', label: 'All 32' },
  { key: 'f3', label: 'F.3 · elective mismatch' },
  { key: 'f6', label: 'F.6 · JUPAS danger gap' },
  { key: 'high', label: 'High risk' },
  { key: 'pending', label: 'Not yet counselled' },
];
const STATUS = {
  pending: { label: 'Pending', tone: 'slate', Icon: Clock },
  met: { label: 'Met', tone: 'green', Icon: CheckCircle2 },
  'follow-up': { label: 'Follow-up', tone: 'amber', Icon: Flag },
};

export default function TriageDashboard({ meta, notify }) {
  const { data, loading, error, reload } = useFetch('/api/teacher/triage');
  const [filter, setFilter] = useState('all');
  const [q, setQ] = useState('');
  const [selId, setSelId] = useState(null);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const rows = useMemo(() => {
    if (!data) return [];
    return data.rows.filter((r) => {
      if (q && !`${r.name} ${r.nameZh} ${r.cls}`.toLowerCase().includes(q.toLowerCase())) return false;
      if (filter === 'f3') return r.form === 3 && r.alerts.some((a) => a.level !== 'Low');
      if (filter === 'f6') return r.form === 6 && r.alerts.some((a) => a.level === 'High');
      if (filter === 'high') return r.risk === 'High';
      if (filter === 'pending') return r.counselStatus === 'pending';
      return true;
    });
  }, [data, filter, q]);

  if (loading && !data) return <Loading />;
  if (error) return <ErrorBox error={error} />;
  const sel = data.rows.find((r) => r.id === selId) || rows[0];

  const saveNote = async (status) => {
    setBusy(true);
    try {
      await api.post(`/api/students/${sel.id}/notes`, { text: note, status, by: meta.teacher.split(' 梁')[0] });
      setNote(''); reload(); notify(status ? `${sel.name} marked ${STATUS[status].label}` : 'Note saved');
    } finally { setBusy(false); }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <Stat label="Caseload" value={data.counts.total} sub="3C homeroom (16) + 6C (16)" />
        <Stat label="High risk" value={data.counts.high} tone="red" sub="Need 1-on-1 this week" />
        <Stat label="F.3 mismatch alerts" value={data.counts.f3Alerts} tone="amber" sub="Elective choice concerns" />
        <Stat label="F.6 danger gaps" value={data.counts.f6Danger} tone="red" sub="JUPAS vs honest prediction" />
        <Stat label="Counselled" value={`${data.counts.met}/${data.counts.total}`} tone="green" sub="Marked as met" />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.35fr_1fr]">
        <Card title="Smart triage — sorted by urgency" icon={Users} bodyClass="p-0"
          actions={<div className="relative"><Search className="absolute left-2 top-2 h-4 w-4 text-slate-400" /><input className="input w-44 py-1 pl-7" placeholder="Search name…" value={q} onChange={(e) => setQ(e.target.value)} /></div>}>
          <div className="flex flex-wrap gap-1.5 border-b border-slate-100 px-3 py-2">
            {FILTERS.map((f) => <button key={f.key} onClick={() => setFilter(f.key)} className={`rounded-full px-2.5 py-1 text-xs font-medium ${filter === f.key ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>{f.label}</button>)}
          </div>
          <div className="max-h-[640px] overflow-auto">
            <table className="w-full">
              <thead className="sticky top-0 z-10 bg-slate-50"><tr><th className="th">Student</th><th className="th">Avg</th><th className="th">Risk</th><th className="th">Top concern</th><th className="th">Status</th><th className="th"></th></tr></thead>
              <tbody>
                {rows.map((r) => {
                  const st = STATUS[r.counselStatus];
                  const top = r.alerts.find((a) => a.level === 'High') || r.alerts[0];
                  return (
                    <tr key={r.id} onClick={() => setSelId(r.id)} className={`cursor-pointer border-t border-slate-100 ${sel?.id === r.id ? 'bg-brand-50' : 'hover:bg-slate-50'}`}>
                      <td className="td"><div className="font-medium">{r.name}</div><div className="text-xs text-slate-500">{r.cls}-{String(r.classNo).padStart(2, '0')} · {r.nameZh}</div></td>
                      <td className="td whitespace-nowrap"><span className="font-medium">{r.average}</span> <span className={`text-xs ${r.averageDelta < 0 ? 'text-red-600' : 'text-emerald-700'}`}>{r.averageDelta > 0 ? '+' : ''}{r.averageDelta}</span></td>
                      <td className="td"><RiskBadge level={r.risk} /></td>
                      <td className="td max-w-[260px]"><div className="truncate text-xs text-slate-600" title={top?.text}>{top ? <><b>{top.type}:</b> {top.text}</> : 'No alerts'}</div></td>
                      <td className="td"><Badge tone={st.tone}><st.Icon className="h-3 w-3" />{st.label}</Badge></td>
                      <td className="td"><ChevronRight className="h-4 w-4 text-slate-300" /></td>
                    </tr>
                  );
                })}
                {!rows.length && <tr><td className="td text-slate-400" colSpan={6}>No students match this filter.</td></tr>}
              </tbody>
            </table>
          </div>
        </Card>

        {sel && (
          <Card title={`1-on-1 counselling card · ${sel.name} ${sel.nameZh}`} subtitle={`${sel.cls}-${String(sel.classNo).padStart(2, '0')} · F.${sel.form} · P${sel.percentile} in form`} icon={Lightbulb}
            actions={<button className="btn-outline py-1" onClick={() => setProfileOpen(true)}><LineChart className="h-4 w-4" />Full profile</button>}>
            <div className="space-y-3 text-sm">
              <div className="flex flex-wrap items-center gap-2"><RiskBadge level={sel.risk} label={`${sel.risk} priority`} />
                <span className="flex items-center gap-1 text-xs text-slate-500">{sel.averageDelta >= 0 ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}Avg {sel.average} ({sel.averageDelta > 0 ? '+' : ''}{sel.averageDelta} vs a year ago)</span>
              </div>
              {sel.story && <p className="rounded bg-slate-50 p-2 text-xs text-slate-600">{sel.story}</p>}
              <div><div className="label mb-1">Strengths</div><div className="flex flex-wrap gap-1">{sel.strengths.map((x) => <Badge key={x} tone="green">{x}</Badge>)}</div></div>
              {sel.form === 3 ? (
                <div className="grid grid-cols-2 gap-2">
                  <div><div className="label mb-1">Chose</div><div className="flex flex-wrap gap-1">{sel.summary.choices.map((k) => <Badge key={k} tone="blue">{k}</Badge>)}</div></div>
                  <div><div className="label mb-1">Engine suggests</div><div className="flex flex-wrap gap-1">{sel.summary.recommended.map((k) => <Badge key={k} tone={sel.summary.choices.includes(k) ? 'blue' : 'violet'}>{k}</Badge>)}</div></div>
                </div>
              ) : (
                <div>
                  <div className="label mb-1">Best 5 — school {sel.summary.schoolBest5} → honest {sel.summary.honestBest5}</div>
                  <ul className="space-y-0.5">{sel.summary.choices.map((c) => <li key={c.band} className="flex items-center justify-between gap-2 text-xs"><span><b>{c.band}</b> {c.name}</span><StatusBadge status={c.status} /></li>)}</ul>
                </div>
              )}
              <div>
                <div className="label mb-1">Alerts ({sel.alerts.length})</div>
                <ul className="space-y-1">{sel.alerts.map((a, i) => <li key={i} className="flex items-start gap-2 text-xs"><RiskBadge level={a.level} label={a.type} /><span className="text-slate-600">{a.text}</span></li>)}</ul>
                {!sel.alerts.length && <p className="text-xs text-slate-500">No alerts — routine check-in only.</p>}
              </div>
              {sel.talkingPoints.length > 0 && (
                <div className="rounded-lg border border-brand-100 bg-brand-50 p-2.5">
                  <div className="label mb-1 text-brand-700">Suggested talking points (3 min)</div>
                  <ol className="list-decimal space-y-0.5 pl-4 text-xs text-slate-700">{sel.talkingPoints.map((t, i) => <li key={i}>{t}</li>)}</ol>
                </div>
              )}
              <div>
                <div className="label mb-1">Counselling notes</div>
                <ul className="mb-2 max-h-28 space-y-1 overflow-auto">{sel.notes.map((n, i) => <li key={i} className="rounded bg-slate-50 px-2 py-1 text-xs"><span className="text-slate-400">{new Date(n.at).toLocaleDateString()} · {n.by}:</span> {n.text}</li>)}{!sel.notes.length && <li className="text-xs text-slate-400">No notes yet.</li>}</ul>
                <textarea className="input min-h-[60px]" placeholder="What was agreed in the 1-on-1?" value={note} onChange={(e) => setNote(e.target.value)} />
                <div className="mt-2 flex flex-wrap gap-2">
                  <button className="btn-primary" disabled={busy} onClick={() => saveNote('met')}><CheckCircle2 className="h-4 w-4" />Save & mark met</button>
                  <button className="btn-outline" disabled={busy} onClick={() => saveNote('follow-up')}><Flag className="h-4 w-4" />Needs follow-up</button>
                  <button className="btn-ghost" disabled={busy || !note.trim()} onClick={() => saveNote()}><MessageSquarePlus className="h-4 w-4" />Note only</button>
                </div>
              </div>
            </div>
          </Card>
        )}
      </div>
      <Modal open={profileOpen && !!sel} onClose={() => setProfileOpen(false)} title={sel ? `${sel.name} ${sel.nameZh} — longitudinal profile` : ''} wide>
        {sel && <ProfileView studentId={sel.id} meta={meta} />}
      </Modal>
    </div>
  );
}
