import React, { useState, useEffect } from 'react';
import { Home, Camera, ListChecks, LineChart, Sparkles, Globe, LogOut, Shield, CreditCard, X, User, Package, HelpCircle } from 'lucide-react';
import { useT } from '../i18n';
import { useAuth } from '../context/AuthContext';
import HomeScreen from '../screens/HomeScreen';
import ScanScreen from '../screens/ScanScreen';
import RoutineScreen from '../screens/RoutineScreen';
import JournalScreen from '../screens/JournalScreen';
import TrialScreen from '../screens/TrialScreen';
import ProfileScreen from '../screens/ProfileScreen';
import HelpScreen from '../screens/HelpScreen';
import PrivacyScreen from '../screens/PrivacyScreen';
import api from '../lib/api';

const TABS = [
  { id: 'accueil', icon: Home, screen: HomeScreen },
  { id: 'routine', icon: ListChecks, screen: RoutineScreen },
  { id: 'scan', icon: Camera, screen: ScanScreen },
  { id: 'journal', icon: LineChart, screen: JournalScreen },
  { id: 'menu', icon: Sparkles, screen: TrialScreen },
];

// Écrans accessibles via le menu, mais pas affichés dans la barre du bas
const EXTRA_SCREENS = [
  { id: 'trial', screen: TrialScreen },
  { id: 'profil', screen: ProfileScreen },
  { id: 'aide', screen: HelpScreen },
  { id: 'confidentialite', screen: PrivacyScreen },
];

const AppShell = () => {
  const { t, lang, setLang } = useT();
  const { user, logout } = useAuth();
  const [active, setActive] = useState('accueil');
  const [routinePhase, setRoutinePhase] = useState('soir');
  const [showMenuModal, setShowMenuModal] = useState(false);

  // Synchronisation automatique du fuseau horaire navigateur
  useEffect(() => {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    api.post('/user/timezone', { timezone: tz }).catch(() => {});
  }, []);

  const go = (id, opts) => {
    if (opts?.phase) setRoutinePhase(opts.phase);

    if (id === 'menu') {
      setShowMenuModal(true);
      return;
    }

    setShowMenuModal(false);
    setActive(id);
  };

  const Current =
    TABS.find((tb) => tb.id === active)?.screen ||
    EXTRA_SCREENS.find((s) => s.id === active)?.screen ||
    HomeScreen;

  return (
    <div className="app-shell relative min-h-screen pb-20">
      {/* Header agrandi avec Soleil et Nom bien lisibles */}
      <div className="flex items-center justify-between px-6 py-5" style={{ borderBottom: '1px solid var(--line)' }}>
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => go('accueil')}>
          <img 
            src="/icon-512.png" 
            alt="Solaia Sun" 
            className="h-9 w-9 object-contain"
          />
          <img 
            src="/mysolaia-nom-4096.png" 
            alt="MySolaia" 
            className="h-6 w-auto object-contain"
          />
        </div>
        
        <div className="flex items-center gap-5">
          <button onClick={() => setLang(lang === 'fr' ? 'en' : 'fr')} className="flex items-center gap-1.5" style={{ color: 'var(--ink-soft)' }}>
            <Globe size={18} strokeWidth={1.6} />
            <span className="font-body text-[12px] uppercase tracking-caps font-medium">{lang}</span>
          </button>
          <button onClick={logout} style={{ color: 'var(--ink-soft)' }}>
            <LogOut size={19} strokeWidth={1.6} />
          </button>
        </div>
      </div>

      {/* Écran actif */}
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
              <span>{tb.id === 'menu' ? 'Menu' : (t(`nav.${tb.id}`) || tb.id)}</span>
            </button>
          );
        })}
      </nav>

      {/* Modale du Menu */}
      {showMenuModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex flex-col justify-end animate-fade-in">
          <div className="bg-white rounded-t-[24px] p-6 max-h-[85vh] overflow-y-auto animate-fade-up shadow-xl" style={{ background: '#FAF6F0' }}>
            {/* Header Modale avec Soleil Image */}
            <div className="flex items-center justify-between pb-4 border-b" style={{ borderColor: 'rgba(163, 123, 104, 0.2)' }}>
              <div className="flex items-center gap-3">
                <img src="/favicon-512.png" alt="Solaia Sun" className="w-7 h-7 object-contain" />
                <div>
                  <h3 className="font-display text-[20px]" style={{ color: '#A37B68' }}>
                    {user?.prenom ? `Bonjour, ${user.prenom}` : 'Mon Compte'}
                  </h3>
                  <p className="font-body text-[12px]" style={{ color: '#A37B68', opacity: 0.7 }}>{user?.email}</p>
                </div>
              </div>
              <button onClick={() => setShowMenuModal(false)} className="p-2 rounded-full" style={{ background: 'var(--cream-card)' }}>
                <X size={20} style={{ color: 'var(--ink)' }} />
              </button>
            </div>

            {/* Options du Menu */}
            <div className="mt-6 space-y-2.5">
              <button onClick={() => go('profil')} className="w-full flex items-center justify-between p-3.5 rounded-[16px]" style={{ background: 'var(--cream-card)', border: '1px solid var(--line)' }}>
                <div className="flex items-center gap-3">
                  <User size={18} style={{ color: '#A37B68' }} />
                  <div className="text-left">
                    <p className="font-display text-[14px] font-medium" style={{ color: '#A37B68' }}>{lang === 'fr' ? "Profil & Diagnostic" : "Profile & Skin Type"}</p>
                    <p className="font-body text-[11px]" style={{ color: '#B59B8D' }}>{lang === 'fr' ? "Type de peau, préoccupations et objectifs" : "Skin type, concerns and goals"}</p>
                  </div>
                </div>
              </button>

              <button onClick={() => go('trial')} className="w-full flex items-center justify-between p-3.5 rounded-[16px]" style={{ background: 'var(--cream-card)', border: '1px solid var(--line)' }}>
                <div className="flex items-center gap-3">
                  <CreditCard size={18} style={{ color: '#A37B68' }} />
                  <div className="text-left">
                    <p className="font-display text-[14px] font-medium" style={{ color: '#A37B68' }}>{lang === 'fr' ? "Mon Abonnement" : "My Subscription"}</p>
                    <p className="font-body text-[11px]" style={{ color: '#B59B8D' }}>{lang === 'fr' ? "Gérer mon offre et mes moyens de paiement" : "Manage plan and payment methods"}</p>
                  </div>
                </div>
              </button>

              <button onClick={() => go('aide')} className="w-full flex items-center justify-between p-3.5 rounded-[16px]" style={{ background: 'var(--cream-card)', border: '1px solid var(--line)' }}>
                <div className="flex items-center gap-3">
                  <HelpCircle size={18} style={{ color: '#A37B68' }} />
                  <div className="text-left">
                    <p className="font-display text-[14px] font-medium" style={{ color: '#A37B68' }}>{lang === 'fr' ? "Aide & Support" : "Help & Support"}</p>
                    <p className="font-body text-[11px]" style={{ color: '#B59B8D' }}>{lang === 'fr' ? "Questions fréquentes et contact" : "FAQ and customer support"}</p>
                  </div>
                </div>
              </button>

              <button onClick={() => go('confidentialite')} className="w-full flex items-center justify-between p-3.5 rounded-[16px]" style={{ background: 'var(--cream-card)', border: '1px solid var(--line)' }}>
                <div className="flex items-center gap-3">
                  <Shield size={18} style={{ color: '#A37B68' }} />
                  <div className="text-left">
                    <p className="font-display text-[14px] font-medium" style={{ color: '#A37B68' }}>{lang === 'fr' ? "Confidentialité & CGU" : "Privacy & Terms"}</p>
                    <p className="font-body text-[11px]" style={{ color: '#B59B8D' }}>{lang === 'fr' ? "Protection des données de santé" : "Data protection and legal terms"}</p>
                  </div>
                </div>
              </button>

              <button onClick={() => { setShowMenuModal(false); logout(); }} className="w-full flex items-center justify-between p-3.5 rounded-[16px] text-red-600" style={{ background: 'var(--cream-card)', border: '1px solid var(--line)' }}>
                <div className="flex items-center gap-3">
                  <LogOut size={18} />
                  <span className="font-display text-[14px] font-medium">{lang === 'fr' ? "Se déconnecter" : "Log out"}</span>
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
