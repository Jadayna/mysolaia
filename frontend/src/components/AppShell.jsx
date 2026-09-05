import React, { useState } from 'react';
import { Home, Camera, ListChecks, LineChart, Sparkles, Globe, LogOut, Shield, CreditCard, X } from 'lucide-react';
import { useT } from '../i18n';
import { useAuth } from '../context/AuthContext';
import HomeScreen from '../screens/HomeScreen';
import ScanScreen from '../screens/ScanScreen';
import RoutineScreen from '../screens/RoutineScreen';
import JournalScreen from '../screens/JournalScreen';
import TrialScreen from '../screens/TrialScreen';
import api from '../lib/api';

const TABS = [
  { id: 'accueil', icon: Home, screen: HomeScreen },
  { id: 'scan', icon: Camera, screen: ScanScreen },
  { id: 'routine', icon: ListChecks, screen: RoutineScreen },
  { id: 'journal', icon: LineChart, screen: JournalScreen },
  { id: 'menu', icon: Sparkles, screen: TrialScreen },
];

const AppShell = () => {
  const { t, lang, setLang } = useT();
  const { user, logout } = useAuth();
  const [active, setActive] = useState('accueil');
  const [routinePhase, setRoutinePhase] = useState('soir');
  const [showMenuModal, setShowMenuModal] = useState(false);

  const go = (id, opts) => {
    if (id === 'routine' && opts?.phase) setRoutinePhase(opts.phase);
    if (id === 'menu') {
      setShowMenuModal(true);
      return;
    }
    setActive(id);
  };

  const handleManageSubscription = async () => {
    try {
      const { data } = await api.post('/payments/portal', { origin_url: window.location.origin });
      if (data.url) window.location.href = data.url;
    } catch (e) {
      console.error("Erreur portail Stripe", e);
    }
  };

  const Current = TABS.find((tb) => tb.id === active)?.screen || HomeScreen;

  return (
    <div className="app-shell relative">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3" style={{ borderBottom: '1px solid var(--line)' }}>
        <div className="flex items-center gap-2">
          <img src="/icon-192.png" alt="MySolaia" className="h-7 w-auto object-contain" />
          <span className="font-display text-[20px] tracking-wide" style={{ color: '#A37B68' }}>MySolaia</span>
        </div>
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

      {/* Ecran actif */}
      <div className="screen">
        <Current go={go} routinePhase={routinePhase} />
      </div>

      {/* Navigation du bas */}
      <nav className="bottom-nav">
        {TABS.map((tb) => {
          const Icon = tb.icon;
          const isActive = active === tb.id && !showMenuModal;
          return (
            <button key={tb.id} onClick={() => go(tb.id)} className={`nav-item ${isActive ? 'active' : ''}`}>
              <Icon size={20} strokeWidth={1.6} />
              <span>{tb.id === 'menu' ? 'Menu' : t(`nav.${tb.id}`)}</span>
            </button>
          );
        })}
      </nav>

      {/* Modale du Menu */}
      {showMenuModal && (
        <div className="absolute inset-0 z-50 bg-black/40 backdrop-blur-sm flex flex-col justify-end animate-fade-in">
          <div className="bg-white rounded-t-[24px] p-6 max-h-[85vh] overflow-y-auto animate-fade-up shadow-xl" style={{ background: '#FAF6F0' }}>
            <div className="flex items-center justify-between pb-4 border-b" style={{ borderColor: 'rgba(163, 123, 104, 0.2)' }}>
              <div className="flex items-center gap-3">
                <img src="/icon-192.png" alt="MySolaia" className="h-9 w-9 object-contain" />
                <div>
                  <h3 className="font-display text-[20px]" style={{ color: '#A37B68' }}>{user?.prenom ? `Bonjour, ${user.prenom}` : 'Mon Compte'}</h3>
                  <p className="font-body text-[12px]" style={{ color: '#A37B68', opacity: 0.7 }}>{user?.email}</p>
                </div>
              </div>
              <button onClick={() => setShowMenuModal(false)} className="p-2 rounded-full" style={{ background: 'var(--cream-card)' }}>
                <X size={20} style={{ color: 'var(--ink)' }} />
              </button>
            </div>

            <div className="mt-6 space-y-3">
              {/* Option Abonnement / Essai */}
              <button onClick={() => { setShowMenuModal(false); setActive('menu'); }} className="w-full flex items-center justify-between p-4 rounded-[12px]" style={{ background: 'var(--cream-card)', border: '1px solid var(--line)' }}>
                <div className="flex items-center gap-3">
                  <CreditCard size={18} style={{ color: '#A37B68' }} />
                  <div className="text-left">
                    <p className="font-body text-[13px] font-medium">{lang === 'fr' ? "Abonnement & Essai" : "Subscription & Trial"}</p>
                    <p className="font-body text-[11px]" style={{ color: 'var(--ink-faint)' }}>{lang === 'fr' ? "Gérer mes plans et facturation" : "Manage plans and billing"}</p>
                  </div>
                </div>
              </button>

              {/* Gestion Stripe Directe */}
              <button onClick={handleManageSubscription} className="w-full flex items-center justify-between p-4 rounded-[12px]" style={{ background: 'var(--cream-card)', border: '1px solid var(--line)' }}>
                <div className="flex items-center gap-3">
                  <Shield size={18} style={{ color: '#A37B68' }} />
                  <div className="text-left">
                    <p className="font-body text-[13px] font-medium">{lang === 'fr' ? "Portail de facturation Stripe" : "Stripe Billing Portal"}</p>
                    <p className="font-body text-[11px]" style={{ color: 'var(--ink-faint)' }}>{lang === 'fr' ? "Modifier carte, factures ou résilier" : "Update card, invoices or cancel"}</p>
                  </div>
                </div>
              </button>

              {/* Déconnexion */}
              <button onClick={() => { setShowMenuModal(false); logout(); }} className="w-full flex items-center justify-between p-4 rounded-[12px] text-red-600" style={{ background: 'var(--cream-card)', border: '1px solid var(--line)' }}>
                <div className="flex items-center gap-3">
                  <LogOut size={18} />
                  <span className="font-body text-[13px] font-medium">{lang === 'fr' ? "Se déconnecter" : "Log out"}</span>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AppShell;
