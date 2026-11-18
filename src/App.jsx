import React, { useEffect, useMemo, useState } from 'react';
import { GraduationCap, School, Users, LineChart as LineIcon, FlaskConical, Compass, Target, Map, BookOpenCheck, ScanSearch, Lightbulb, RotateCcw, Cpu } from 'lucide-react';
import { api } from './api.js';
import { Tabs, Badge, Toast, useFetch, Loading } from './ui.jsx';
import ProfileView from './views/ProfileView.jsx';
import TasterHub from './views/TasterHub.jsx';
import ElectiveAdvisor from './views/ElectiveAdvisor.jsx';
import HonestPredictor from './views/HonestPredictor.jsx';
import PathwayPlanner from './views/PathwayPlanner.jsx';
import RevisionHub from './views/RevisionHub.jsx';
import TriageDashboard from './views/TriageDashboard.jsx';
import HkeaaAnalyzer from './views/HkeaaAnalyzer.jsx';
import TeachingInsights from './views/TeachingInsights.jsx';

const ROLES = [
  { key: 'f3', label: 'F.3 Student', zh: '中三學生', icon: GraduationCap },
  { key: 'f6', label: 'F.6 Student', zh: '中六學生', icon: School },
  { key: 'teacher', label: 'Teacher', zh: '老師', icon: Users },
];
const TABS = {
  f3: [
    { key: 'profile', label: 'F.1–F.3 Profile', icon: LineIcon },
    { key: 'tasters', label: 'Real DSE Tasters', icon: FlaskConical },
    { key: 'advisor', label: 'Elective Advisor 選科', icon: Compass },
    { key: 'revision', label: 'Revision Hub', icon: BookOpenCheck },
  ],
  f6: [
    { key: 'profile', label: 'F.1–F.6 Profile', icon: LineIcon },
    { key: 'predictor', label: 'Honest DSE Predictor', icon: Target },
    { key: 'pathways', label: '升學規劃 Pathways', icon: Map },
    { key: 'revision', label: 'Revision Hub', icon: BookOpenCheck },
  ],
  teacher: [
    { key: 'triage', label: 'Class Triage (32)', icon: Users },
    { key: 'hkeaa', label: 'HKEAA 考評局 Analyzer', icon: ScanSearch },
    { key: 'insights', label: 'Teaching Insights', icon: Lightbulb },
  ],
};
const DEFAULT_STUDENT = { f3: 'S3C01', f6: 'S6C01' };

function readHash() {
  const [role, tab, sid] = window.location.hash.replace('#', '').split('/');
  return { role: ROLES.some((r) => r.key === role) ? role : 'f3', tab, sid };
}

export default function App() {
  const init = readHash();
  const [role, setRole] = useState(init.role);
  const [tab, setTab] = useState(init.tab || TABS[init.role][0].key);
  const [studentIds, setStudentIds] = useState({ ...DEFAULT_STUDENT, ...(init.sid && init.role !== 'teacher' ? { [init.role]: init.sid } : {}) });
  const [toast, setToast] = useState(null);
  const [dataVersion, setDataVersion] = useState(0);
  const meta = useFetch('/api/meta', [dataVersion]);
  const students = useFetch('/api/students', [dataVersion]);

  const sid = role === 'teacher' ? null : studentIds[role];
  useEffect(() => { window.location.hash = `${role}/${tab}${sid ? '/' + sid : ''}`; }, [role, tab, sid]);

  const switchRole = (r) => { setRole(r); setTab(TABS[r][0].key); };
  const options = useMemo(() => (students.data || []).filter((s) => (role === 'f3' ? s.form === 3 : s.form === 6)), [students.data, role]);
  const current = options.find((s) => s.id === sid);

  const reset = async () => {
    if (!confirm('Reset all demo data to the original seed?')) return;
    await api.post('/api/admin/reset');
    setDataVersion((v) => v + 1);
    setToast('Demo data reseeded');
  };

  const notify = (m) => setToast(m);
  const ctx = { meta: meta.data, notify, dataVersion };

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-4 py-2.5">
          <div className="flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-brand-600 text-white"><Compass className="h-5 w-5" /></div>
            <div className="leading-tight">
              <div className="font-semibold text-slate-900">PathLight 學途</div>
              <div className="text-[11px] text-slate-500">F.1–F.6 Academic Guidance · HKDSE</div>
            </div>
          </div>
          <div className="ml-auto flex flex-wrap items-center gap-2">
            <span className="hidden text-xs font-medium text-slate-500 md:inline">Demo role</span>
            <div className="flex rounded-lg bg-slate-100 p-0.5" role="tablist" aria-label="Demo role switcher">
              {ROLES.map((r) => (
                <button key={r.key} onClick={() => switchRole(r.key)} role="tab" aria-selected={role === r.key}
                  className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-medium transition ${role === r.key ? 'bg-white text-brand-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}>
                  <r.icon className="h-4 w-4" /><span>{r.label}</span><span className="hidden text-xs text-slate-400 lg:inline">{r.zh}</span>
                </button>
              ))}
            </div>
            {role !== 'teacher' && (
              <select className="input w-auto py-1.5" value={sid || ''} onChange={(e) => setStudentIds((m) => ({ ...m, [role]: e.target.value }))} aria-label="Viewing as student">
                {options.map((s) => <option key={s.id} value={s.id}>{s.cls}-{String(s.classNo).padStart(2, '0')} {s.name} {s.nameZh}{s.story ? ' ★' : ''}</option>)}
              </select>
            )}
            <Badge tone={meta.data?.ai?.mode === 'live' ? 'green' : 'violet'}><Cpu className="h-3 w-3" />AI: {meta.data?.ai?.mode === 'live' ? 'Claude live' : 'Simulation'}</Badge>
            <button className="btn-ghost" onClick={reset} title="Reset demo data"><RotateCcw className="h-4 w-4" /><span className="hidden sm:inline">Reset</span></button>
          </div>
        </div>
        <div className="mx-auto max-w-7xl px-4"><Tabs tabs={TABS[role]} value={tab} onChange={setTab} /></div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-5">
        {role !== 'teacher' && current?.story && (
          <div className="mb-4 rounded-lg border border-brand-100 bg-brand-50 px-3 py-2 text-sm text-brand-900">
            <span className="font-semibold">Demo persona ★ </span>{current.story}
          </div>
        )}
        {!meta.data ? <Loading /> : (
          <>
            {tab === 'profile' && sid && <ProfileView key={sid + dataVersion} studentId={sid} {...ctx} />}
            {tab === 'tasters' && sid && <TasterHub key={sid + dataVersion} studentId={sid} {...ctx} onGoAdvisor={() => setTab('advisor')} />}
            {tab === 'advisor' && sid && <ElectiveAdvisor key={sid + dataVersion} studentId={sid} {...ctx} onGoTasters={() => setTab('tasters')} />}
            {tab === 'predictor' && sid && <HonestPredictor key={sid + dataVersion} studentId={sid} {...ctx} onGoPathways={() => setTab('pathways')} />}
            {tab === 'pathways' && sid && <PathwayPlanner key={sid + dataVersion} studentId={sid} {...ctx} />}
            {tab === 'revision' && sid && <RevisionHub key={sid + dataVersion} studentId={sid} {...ctx} />}
            {tab === 'triage' && <TriageDashboard key={dataVersion} {...ctx} />}
            {tab === 'hkeaa' && <HkeaaAnalyzer key={dataVersion} {...ctx} />}
            {tab === 'insights' && <TeachingInsights key={dataVersion} {...ctx} />}
          </>
        )}
      </main>
      <footer className="mx-auto max-w-7xl px-4 pb-8 text-xs text-slate-400">
        {meta.data?.school} · Demo data is synthetic; programme scores are indicative, not official JUPAS / HKEAA statistics.
      </footer>
      <Toast msg={toast} onDone={() => setToast(null)} />
    </div>
  );
}
