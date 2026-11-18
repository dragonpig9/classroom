import React, { useState } from 'react';
import { FlaskConical, CheckCircle2, XCircle, AlertTriangle, ArrowRight, RotateCcw, Send } from 'lucide-react';
import { api } from '../api.js';
import { Card, Badge, Loading, ErrorBox, RiskBadge, Progress, useFetch } from '../ui.jsx';

export default function TasterHub({ studentId, notify, onGoAdvisor }) {
  const tasters = useFetch('/api/tasters');
  const student = useFetch(`/api/students/${studentId}`);
  const [active, setActive] = useState(null);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);

  if (tasters.loading || student.loading) return <Loading />;
  if (tasters.error) return <ErrorBox error={tasters.error} />;
  const results = student.data.tasterResults || {};
  const choices = student.data.electiveChoices || [];
  const subj = tasters.data.find((t) => t.key === active);

  const open = (k) => { setActive(k); setAnswers({}); setResult(null); setErr(null); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const submit = async () => {
    setBusy(true); setErr(null);
    try {
      const r = await api.post(`/api/students/${studentId}/tasters/${active}`, { answers });
      setResult(r);
      student.setData({ ...student.data, tasterResults: { ...results, [active]: { pct: r.pct, score: r.score, max: r.max, attempts: (results[active]?.attempts || 0) + 1 } } });
      notify(`${subj.short} taster graded: ${r.score}/${r.max}`);
    } catch (e) { setErr(e); } finally { setBusy(false); }
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
      <div className="space-y-3">
        <Card title="12 Elective Taster Hub" subtitle="Authentic DSE-style questions with instant mark-scheme grading" icon={FlaskConical} bodyClass="p-2">
          <ul className="space-y-1">
            {tasters.data.map((t) => {
              const res = results[t.key];
              return (
                <li key={t.key}>
                  <button onClick={() => open(t.key)} className={`w-full rounded-lg px-3 py-2 text-left transition ${active === t.key ? 'bg-brand-50 ring-1 ring-brand-200' : 'hover:bg-slate-50'}`}>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium text-slate-800">{t.name.length > 28 ? t.short : t.name} <span className="text-slate-400">{t.zh}</span></span>
                      {choices.includes(t.key) && <Badge tone="blue">My pick</Badge>}
                    </div>
                    <div className="mt-1 flex items-center gap-2">
                      {res ? <><Progress value={res.pct} tone={res.pct >= 70 ? 'green' : res.pct >= 50 ? 'amber' : 'red'} /><span className="w-10 text-right text-xs font-medium text-slate-600">{res.pct}%</span></>
                        : <span className="text-xs text-slate-400">Not attempted · {t.questions.length} Qs · {t.totalMarks} marks</span>}
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        </Card>
      </div>

      <div className="space-y-4">
        {!subj && (
          <Card>
            <div className="space-y-3 text-sm text-slate-600">
              <h2 className="text-lg font-semibold text-slate-900">Why "Real DSE" tasters?</h2>
              <p>School taster lessons usually show the friendliest F.4 introductory content. These tasters instead use <b>senior-form / HKDSE-style</b> questions — data-based questions, structured calculations and the <b>mark-scheme traps</b> HKEAA examiners repeatedly report.</p>
              <ul className="list-disc space-y-1 pl-5">
                <li>Answers are graded instantly against a marking scheme (method marks, unit marks, keyword points).</li>
                <li>Every lost mark is added to your longitudinal mistake log and feeds the Elective Advisor.</li>
                <li>Try your 3 chosen electives first, then one you are unsure about.</li>
              </ul>
              <button className="btn-primary" onClick={() => open(choices.find((c) => !results[c]) || choices[0])}>Start with my picks <ArrowRight className="h-4 w-4" /></button>
            </div>
          </Card>
        )}
        {subj && (
          <Card title={`${subj.name} ${subj.zh}`} subtitle={`What changes in F.5: ${subj.f5Demands}`} icon={FlaskConical}
            actions={results[subj.key] && <Badge tone="slate">Best so far {results[subj.key].pct}% · {results[subj.key].attempts || 1} attempt(s)</Badge>}>
            <div className="space-y-5">
              {subj.questions.map((q, i) => {
                const r = result?.results.find((x) => x.id === q.id);
                return (
                  <div key={q.id} className="rounded-lg border border-slate-200 p-3">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold">Q{i + 1}.</span>
                      <Badge tone="violet">{q.paper}</Badge><Badge>{q.topic}</Badge><Badge tone="slate">{q.marks} mark{q.marks > 1 ? 's' : ''}</Badge>
                    </div>
                    <p className="mb-3 whitespace-pre-line text-sm text-slate-800">{q.stem}</p>
                    {q.type === 'mc' && (
                      <div className="grid gap-1.5 sm:grid-cols-2">
                        {q.options.map((o, oi) => (
                          <label key={oi} className={`flex cursor-pointer items-start gap-2 rounded-md border px-2.5 py-1.5 text-sm ${String(answers[q.id]) === String(oi) ? 'border-brand-400 bg-brand-50' : 'border-slate-200 hover:bg-slate-50'}`}>
                            <input type="radio" name={q.id} className="mt-1" disabled={!!result} checked={String(answers[q.id]) === String(oi)} onChange={() => setAnswers({ ...answers, [q.id]: oi })} />
                            <span><b>{String.fromCharCode(65 + oi)}.</b> {o}</span>
                          </label>
                        ))}
                      </div>
                    )}
                    {q.type === 'numeric' && (
                      <input className="input max-w-xs" placeholder={`Final answer${q.unit && q.unit !== ':1' ? ' with unit' : ''}`} disabled={!!result} value={answers[q.id] || ''} onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })} />
                    )}
                    {q.type === 'structured' && (
                      <textarea className="input min-h-[90px]" placeholder={`Write your answer (${q.pointCount} marking points available)`} disabled={!!result} value={answers[q.id] || ''} onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })} />
                    )}
                    {r && (
                      <div className={`mt-3 rounded-md border p-3 text-sm ${r.correct ? 'border-emerald-200 bg-emerald-50' : 'border-amber-200 bg-amber-50'}`}>
                        <div className="flex items-center gap-2 font-semibold">
                          {r.correct ? <CheckCircle2 className="h-4 w-4 text-emerald-700" /> : <XCircle className="h-4 w-4 text-amber-700" />}
                          {r.awarded}/{r.max} — {r.feedback}
                        </div>
                        {r.points && (
                          <ul className="mt-2 space-y-0.5">
                            {r.points.map((p, pi) => <li key={pi} className="flex items-center gap-1.5">{p.hit ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-700" /> : <XCircle className="h-3.5 w-3.5 text-slate-400" />}<span className={p.hit ? '' : 'text-slate-500'}>{p.desc} ({p.mark}M)</span></li>)}
                          </ul>
                        )}
                        {!r.points && <div className="mt-2 text-slate-700"><span className="label">Marking scheme</span><ul className="list-disc pl-5">{r.scheme.map((x, xi) => <li key={xi}>{x}</li>)}</ul></div>}
                        <div className="mt-2 flex items-start gap-1.5 text-slate-700"><AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-700" /><span><b>Examiner trap:</b> {r.trap}</span></div>
                      </div>
                    )}
                  </div>
                );
              })}
              <ErrorBox error={err} />
              <div className="flex flex-wrap items-center gap-2">
                {!result ? (
                  <button className="btn-primary" disabled={busy} onClick={submit}><Send className="h-4 w-4" />{busy ? 'Marking…' : 'Submit for marking'}</button>
                ) : (
                  <>
                    <div className="text-sm font-semibold">Score: {result.score}/{result.max} ({result.pct}%)</div>
                    <button className="btn-outline" onClick={() => { setResult(null); setAnswers({}); }}><RotateCcw className="h-4 w-4" />Retry</button>
                    <button className="btn-primary" onClick={onGoAdvisor}>See updated Elective Advisor <ArrowRight className="h-4 w-4" /></button>
                  </>
                )}
              </div>
              {result && (() => {
                const f = result.fit.ranking.find((x) => x.key === subj.key);
                return f && (
                  <div className="rounded-lg bg-slate-50 p-3 text-sm">
                    <div className="mb-1 flex items-center gap-2 font-semibold">Fit for {subj.short}: {f.fit}/100 <RiskBadge level={f.dropRisk} label={`Drop-risk: ${f.dropRisk}`} /></div>
                    {f.riskReasons.length ? <ul className="list-disc pl-5 text-slate-600">{f.riskReasons.map((x, i) => <li key={i}>{x}</li>)}</ul> : <p className="text-slate-600">No drop-risk signals — junior record and projected skills support this elective.</p>}
                  </div>
                );
              })()}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
