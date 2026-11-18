import React, { useEffect, useState } from 'react';
import { BookOpenCheck, Copy, Download, RefreshCw, Send, Wand2, CheckCircle2, Link2, FileJson, Cpu } from 'lucide-react';
import { api } from '../api.js';
import { Card, Badge, Loading, ErrorBox, useFetch } from '../ui.jsx';

export default function RevisionHub({ studentId, notify }) {
  const wp = useFetch(`/api/students/${studentId}/weakness-profile`);
  const log = useFetch(`/api/integrations/sync-log?studentId=${studentId}`);
  const sets = useFetch(`/api/practice/${studentId}`);
  const [platform, setPlatform] = useState('RevisionDojo');
  const [webhook, setWebhook] = useState('');
  const [view, setView] = useState('prompt');
  const [busy, setBusy] = useState(null);
  const [err, setErr] = useState(null);
  const [count, setCount] = useState(6);
  const [current, setCurrent] = useState(null);
  useEffect(() => { if (sets.data?.length && !current) setCurrent(sets.data[0]); }, [sets.data]);

  if (wp.loading) return <Loading />;
  if (wp.error) return <ErrorBox error={wp.error} />;
  const { profile, contextPrompt } = wp.data;
  const json = JSON.stringify(profile, null, 2);

  const copy = async (text, what) => { try { await navigator.clipboard.writeText(text); notify(`${what} copied to clipboard`); } catch { notify('Copy failed — select the text manually'); } };
  const download = () => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
    a.download = `weakness-profile-${studentId}.json`; a.click();
  };
  const sync = async () => {
    setBusy('sync'); setErr(null);
    try { const r = await api.post('/api/integrations/revisiondojo/sync', { studentId, platform, webhookUrl: webhook || undefined }); log.setData([r, ...(log.data || [])]); notify(`Synced to ${platform}: ${r.responsePreview.queuedDrills} drills queued`); }
    catch (e) { setErr(e); } finally { setBusy(null); }
  };
  const generate = async () => {
    setBusy('gen'); setErr(null);
    try { const r = await api.post('/api/practice/generate', { studentId, count }); setCurrent(r); sets.setData([r, ...(sets.data || [])]); notify(`Generated ${r.drills.length} drills (${r.engine})`); }
    catch (e) { setErr(e); } finally { setBusy(null); }
  };
  const toggleDone = async (d) => {
    const r = await api.patch(`/api/practice/${current.id}/drills/${d.id}`, { done: !d.done });
    setCurrent({ ...current, drills: current.drills.map((x) => (x.id === d.id ? r : x)) });
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-[1fr_1.1fr]">
        <Card title="Personal Weakness & Mistake Profile" subtitle="Built from your F.1–F.6 mistake log, skills and HKEAA-calibrated gaps" icon={BookOpenCheck}>
          <ol className="space-y-2">
            {profile.topWeaknesses.map((w, i) => (
              <li key={i} className="flex items-start gap-3 rounded-lg border border-slate-200 p-2.5">
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-slate-100 text-xs font-semibold">{i + 1}</span>
                <div className="min-w-0 flex-1 text-sm">
                  <div className="font-medium">{w.subjectName.replace(/ [^ ]*[一-鿿].*$/, '')} — {w.topic}</div>
                  <div className="mt-0.5 flex flex-wrap gap-1"><Badge tone="red">{w.reason}</Badge><Badge>{w.questionType}</Badge><Badge tone="slate">{w.occurrences}× · −{w.marksLost} marks · last {w.lastSeen}</Badge></div>
                </div>
              </li>
            ))}
          </ol>
          {profile.hkeaaGaps.length > 0 && (
            <div className="mt-3 rounded-lg bg-amber-50 p-2.5 text-xs text-amber-900">
              <b>HKEAA mark-scheme gaps:</b> {profile.hkeaaGaps.map((g) => `${g.subject} ${g.schoolPredicted}→${g.calibrated}`).join(' · ')}
            </div>
          )}
        </Card>

        <Card title="Export & sync to external revision AI" subtitle="RevisionDojo-style platforms or your own AI tutor" icon={Link2}>
          <div className="mb-2 flex gap-1 rounded-lg bg-slate-100 p-0.5 text-sm">
            {[['prompt', 'Context prompt'], ['json', 'JSON payload']].map(([k, l]) => <button key={k} onClick={() => setView(k)} className={`flex-1 rounded-md px-2 py-1 ${view === k ? 'bg-white font-medium shadow-sm' : 'text-slate-600'}`}>{l}</button>)}
          </div>
          <pre className="max-h-64 overflow-auto whitespace-pre-wrap rounded-lg bg-slate-900 p-3 text-xs leading-relaxed text-slate-100">{view === 'json' ? json : contextPrompt}</pre>
          <div className="mt-2 flex flex-wrap gap-2">
            <button className="btn-outline" onClick={() => copy(view === 'json' ? json : contextPrompt, view === 'json' ? 'JSON' : 'Prompt')}><Copy className="h-4 w-4" />Copy</button>
            <button className="btn-outline" onClick={download}><Download className="h-4 w-4" />Download .json</button>
          </div>
          <div className="mt-4 grid gap-2 border-t border-slate-100 pt-3 sm:grid-cols-[150px_1fr_auto]">
            <select className="input" value={platform} onChange={(e) => setPlatform(e.target.value)}><option>RevisionDojo</option><option>Custom AI tutor</option><option>School LMS</option></select>
            <input className="input" placeholder="Webhook URL (optional — mock delivery)" value={webhook} onChange={(e) => setWebhook(e.target.value)} />
            <button className="btn-primary" disabled={busy === 'sync'} onClick={sync}><RefreshCw className={`h-4 w-4 ${busy === 'sync' ? 'animate-spin' : ''}`} />Sync</button>
          </div>
          <ErrorBox error={err} />
          {log.data?.length > 0 && (
            <ul className="mt-3 space-y-1 text-xs">
              {log.data.slice(0, 4).map((e) => (
                <li key={e.id} className="flex flex-wrap items-center gap-2 rounded bg-slate-50 px-2 py-1">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-700" /><b>{e.platform}</b><span className="text-slate-500">{new Date(e.at).toLocaleString()}</span>
                  <span>{e.bytes} bytes · decks: {e.responsePreview.mappedDecks.join(', ')}</span><Badge tone="green">{e.status}</Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Card title="Personalized Practice Generator" subtitle="How an external revision AI turns your exact mistake tags into drills" icon={Wand2}
        actions={<>
          <select className="input w-auto py-1" value={count} onChange={(e) => setCount(Number(e.target.value))}>{[4, 6, 8, 10].map((n) => <option key={n} value={n}>{n} drills</option>)}</select>
          <button className="btn-primary" disabled={busy === 'gen'} onClick={generate}><Send className="h-4 w-4" />{busy === 'gen' ? 'Generating…' : 'Generate drills'}</button>
        </>}>
        {!current ? (
          <p className="text-sm text-slate-500">No drills yet. Generate a set — each drill targets one of your top weaknesses and the HKEAA marking point you keep missing.</p>
        ) : (
          <>
            <div className="mb-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <Cpu className="h-3.5 w-3.5" />Engine: <Badge tone={current.engine.startsWith('claude') ? 'green' : 'violet'}>{current.engine}</Badge>
              <span>{new Date(current.createdAt).toLocaleString()}</span>
              <span>· {current.drills.filter((d) => d.done).length}/{current.drills.length} done</span>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {current.drills.map((d) => (
                <div key={d.id} className={`rounded-lg border p-3 text-sm ${d.done ? 'border-emerald-200 bg-emerald-50/50' : 'border-slate-200'}`}>
                  <div className="mb-1 flex flex-wrap items-center gap-1">
                    <Badge tone="blue">{d.subject}</Badge><Badge>{d.topic}</Badge><Badge tone="red">{d.targets}</Badge><Badge tone="slate">{d.difficulty} · {d.minutes} min</Badge>
                  </div>
                  <p className="text-slate-800">{d.prompt}</p>
                  <p className="mt-1 text-xs text-slate-500">{d.markScheme}</p>
                  <label className="mt-2 flex items-center gap-2 text-xs"><input type="checkbox" checked={d.done} onChange={() => toggleDone(d)} />Mark as completed</label>
                </div>
              ))}
            </div>
          </>
        )}
      </Card>
      <p className="flex items-center gap-1 text-xs text-slate-400"><FileJson className="h-3.5 w-3.5" />Payload schema: <code>pathlight.weakness-profile/v1</code> · names are abbreviated in exports for privacy.</p>
    </div>
  );
}
