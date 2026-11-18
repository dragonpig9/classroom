import React, { useEffect, useState } from 'react';
import { AlertTriangle, AlertCircle, CheckCircle2, Info, Loader2, X } from 'lucide-react';

// Categorical series palette (fixed order, never cycled).
export const SERIES = ['#2a78d6', '#eb6834', '#1baf7a', '#eda100', '#e87ba4', '#008300', '#6250d6', '#e34948'];

export function useFetch(url, deps = []) {
  const [state, setState] = useState({ data: null, loading: true, error: null });
  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (!url) return;
    let alive = true;
    setState((s) => ({ ...s, loading: true, error: null }));
    fetch(url)
      .then(async (r) => { const d = await r.json(); if (!r.ok) throw new Error(d.error || r.statusText); return d; })
      .then((data) => alive && setState({ data, loading: false, error: null }))
      .catch((error) => alive && setState({ data: null, loading: false, error }));
    return () => { alive = false; };
  }, [url, tick, ...deps]);
  return { ...state, reload: () => setTick((t) => t + 1), setData: (data) => setState((s) => ({ ...s, data })) };
}

export function Card({ title, subtitle, icon: Icon, actions, children, className = '', bodyClass = 'p-4' }) {
  return (
    <section className={`card ${className}`}>
      {(title || actions) && (
        <header className="flex flex-wrap items-start justify-between gap-2 border-b border-slate-100 px-4 py-3">
          <div className="flex items-start gap-2">
            {Icon && <Icon className="mt-0.5 h-4 w-4 text-brand-600" />}
            <div>
              <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
              {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
            </div>
          </div>
          {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
        </header>
      )}
      <div className={bodyClass}>{children}</div>
    </section>
  );
}

const TONES = {
  slate: 'bg-slate-100 text-slate-700 ring-slate-200',
  blue: 'bg-brand-50 text-brand-700 ring-brand-100',
  green: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  amber: 'bg-amber-50 text-amber-800 ring-amber-200',
  red: 'bg-red-50 text-red-700 ring-red-200',
  violet: 'bg-violet-50 text-violet-700 ring-violet-200',
};
export function Badge({ tone = 'slate', children, className = '' }) {
  return <span className={`inline-flex items-center gap-1 whitespace-nowrap rounded-md px-1.5 py-0.5 text-xs font-medium ring-1 ring-inset ${TONES[tone]} ${className}`}>{children}</span>;
}

// Status always ships with icon + label (never colour alone).
const RISK = {
  High: { tone: 'red', Icon: AlertTriangle },
  Medium: { tone: 'amber', Icon: AlertCircle },
  Low: { tone: 'green', Icon: CheckCircle2 },
};
export function RiskBadge({ level, label }) {
  const r = RISK[level] || { tone: 'slate', Icon: Info };
  return <Badge tone={r.tone}><r.Icon className="h-3 w-3" />{label || level}</Badge>;
}

const STATUS_TONE = { Safe: 'green', Match: 'blue', Reach: 'amber', Unrealistic: 'red', Ineligible: 'red', Eligible: 'green', Fallback: 'slate' };
export function StatusBadge({ status }) {
  const tone = STATUS_TONE[status] || 'slate';
  const Icon = tone === 'green' ? CheckCircle2 : tone === 'red' ? AlertTriangle : tone === 'amber' ? AlertCircle : Info;
  return <Badge tone={tone}><Icon className="h-3 w-3" />{status}</Badge>;
}

export function Stat({ label, value, sub, tone }) {
  const color = tone === 'red' ? 'text-red-600' : tone === 'green' ? 'text-emerald-700' : tone === 'amber' ? 'text-amber-700' : 'text-slate-900';
  return (
    <div className="card px-4 py-3">
      <div className="label">{label}</div>
      <div className={`mt-1 text-2xl font-semibold ${color}`}>{value}</div>
      {sub && <div className="mt-0.5 text-xs text-slate-500">{sub}</div>}
    </div>
  );
}

export function Tabs({ tabs, value, onChange }) {
  return (
    <nav className="flex gap-1 overflow-x-auto border-b border-slate-200">
      {tabs.map((t) => (
        <button key={t.key} onClick={() => onChange(t.key)}
          className={`flex shrink-0 items-center gap-1.5 border-b-2 px-3 py-2 text-sm font-medium transition ${value === t.key ? 'border-brand-600 text-brand-700' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>
          {t.icon && <t.icon className="h-4 w-4" />}{t.label}
        </button>
      ))}
    </nav>
  );
}

export function Loading({ label = 'Loading…' }) {
  return <div className="flex items-center gap-2 p-6 text-sm text-slate-500"><Loader2 className="h-4 w-4 animate-spin" />{label}</div>;
}
export function ErrorBox({ error }) {
  if (!error) return null;
  return <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{String(error.message || error)}</div>;
}

export function Modal({ open, onClose, title, children, wide }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/40 p-4" onClick={onClose}>
      <div className={`card mt-10 w-full ${wide ? 'max-w-5xl' : 'max-w-2xl'}`} onClick={(e) => e.stopPropagation()}>
        <header className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
          <h3 className="font-semibold">{title}</h3>
          <button className="btn-ghost p-1" onClick={onClose} aria-label="Close"><X className="h-4 w-4" /></button>
        </header>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}

export function Toast({ msg, onDone }) {
  useEffect(() => { if (msg) { const t = setTimeout(onDone, 3200); return () => clearTimeout(t); } }, [msg]);
  if (!msg) return null;
  return <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm text-white shadow-lg"><CheckCircle2 className="h-4 w-4 text-emerald-400" />{msg}</div>;
}

export function ChartTip({ active, payload, label, fmt = (v) => v }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-md">
      <div className="mb-1 font-semibold text-slate-800">{label}</div>
      {payload.map((p) => (
        <div key={p.dataKey} className="flex items-center gap-2 text-slate-600">
          <span className="inline-block h-2 w-2 rounded-full" style={{ background: p.color || p.stroke || p.fill }} />
          <span>{p.name}</span><span className="ml-auto pl-3 font-medium text-slate-900">{fmt(p.value, p)}</span>
        </div>
      ))}
    </div>
  );
}

export function Progress({ value, max = 100, tone = 'blue' }) {
  const color = tone === 'red' ? 'bg-red-500' : tone === 'amber' ? 'bg-amber-500' : tone === 'green' ? 'bg-emerald-600' : 'bg-brand-500';
  return <div className="h-1.5 w-full rounded-full bg-slate-100"><div className={`h-1.5 rounded-full ${color}`} style={{ width: `${Math.max(2, Math.min(100, (value / max) * 100))}%` }} /></div>;
}
