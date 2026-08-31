import React, { useState } from 'react';
import { Home, Camera, ListChecks, LineChart, Sparkles, Globe, LogOut } from 'lucide-react';
import { useT } from '../i18n';
import { useAuth } from '../context/AuthContext';
import HomeScreen from '../screens/HomeScreen';
import ScanScreen from '../screens/ScanScreen';
import RoutineScreen from '../screens/RoutineScreen';
import JournalScreen from '../screens/JournalScreen';
import TrialScreen from '../screens/TrialScreen';

const TABS = [
  { id: 'accueil', icon: Home, screen: HomeScreen },
  { id: 'scan', icon: Camera, screen: ScanScreen },
  { id: 'routine', icon: ListChecks, screen: RoutineScreen },
  { id: 'journal', icon: LineChart, screen: JournalScreen },
  { id: 'essai', icon: Sparkles, screen: TrialScreen },
];

const AppShell = () => {
  const { t, lang, setLang } = useT();
  const { logout } = useAuth();
  const [active, setActive] = useState('accueil');
  const [routinePhase, setRoutinePhase] = useState('soir');

  const go = (id, opts) => {
    if (id === 'routine' && opts?.phase) setRoutinePhase(opts.phase);
    setActive(id);
  };

  const Current = TABS.find((tb) => tb.id === active).screen;

  return (
    <div className="app-shell">
      <div className="flex items-center justify-between px-5 py-3" style={{ borderBottom: '1px solid var(--line)' }}>
        <span className="font-display text-[20px]" style={{ color: 'var(--gold)' }}>Ordre</span>
        <div className="flex items-center gap-4">
          <button onClick={() => setLang(lang === 'fr' ? 'en' : 'fr')} className="flex items-center gap-1.5" style={{ color: 'var(--ink-soft)' }}>
            <Globe size={15} strokeWidth={1.6} />
            <span className="font-body text-[11px] uppercase tracking-caps">{lang}</span>
          </button>
          <button onClick={logout} style={{ color: 'var(--ink-soft)' }}>
            <LogOut size={16} strokeWidth={1.6} />
          </button>
        </div>
      </div>

      <div className="screen">
        <Current go={go} routinePhase={routinePhase} />
      </div>

      <nav className="bottom-nav">
        {TABS.map((tb) => {
          const Icon = tb.icon;
          return (
            <button key={tb.id} onClick={() => go(tb.id)} className={`nav-item ${active === tb.id ? 'active' : ''}`}>
              <Icon size={20} strokeWidth={1.6} />
              <span>{t(`nav.${tb.id}`)}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};

export default AppShell;
