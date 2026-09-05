import React, { useState } from 'react';
import { Home, Camera, ListChecks, LineChart, Sparkles, Globe, LogOut, Shield, CreditCard, X, User, Package, HelpCircle } from 'lucide-react';
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
    <div className="app-shell relative min-h-screen pb-20">
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
              <span>{tb.id === 'menu' ? 'Menu' : t(`nav.${tb.id}`)}</span>
            </button>
          );
        })}
      </nav>

      {/* Modale du Menu */}
      {showMenuModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex flex-col justify-end animate-fade-in">
          <div className="bg-white rounded-t-[24px] p-6 max-h-[85vh] overflow-y-auto animate-fade-up shadow-xl" style={{ background: '#FAF6F0' }}>
            {/* Header Modale */}
            <div className="flex items-center justify-between pb-4 border-b" style={{ borderColor: 'rgba(163, 123, 104, 0.2)' }}>
              <div className="flex items-center gap-3">
                <img src="/icon-192.png" alt="MySolaia" className="h-9 w-9 object-contain" />
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
              {/* 1. Profil & Type de peau */}
              <button onClick={() => { setShowMenuModal(false); setActive('accueil'); }} className="w-full flex items-center justify-between p-3.5 rounded-[16px]" style={{ background: 'var(--cream-card)', border: '1px solid var(--line)' }}>
                <div className="flex items-center gap-3">
                  <User size={18} style={{ color: '#A37B68' }} />
                  <div className="text-left">
                    <p className="font-display text-[14px] font-medium" style={{ color: '#A37B68' }}>{lang === 'fr' ? "Profil & Diagnostic" : "Profile & Skin Type"}</p>
                    <p className="font-body text-[11px]" style={{ color: '#B59B8D' }}>{lang === 'fr' ? "Type de peau, préoccupations et objectifs" : "Skin type, concerns and goals"}</p>
                  </div>
                </div>
              </button>

              {/* 2. Mes Produits / Vanité */}
              <button onClick={() => { setShowMenuModal(false); setActive('routine'); }} className="w-full flex items-center justify-between p-3.5 rounded-[16px]" style={{ background: 'var(--cream-card)', border: '1px solid var(--line)' }}>
                <div className="flex items-center gap-3">
                  <Package size={18} style={{ color: '#A37B68' }} />
                  <div className="text-left">
                    <p className="font-display text-[14px] font-medium" style={{ color: '#A37B68' }}>{lang === 'fr' ? "Mon Vanité de Soins" : "My Skincare Shelf"}</p>
                    <p className="font-body text-[11px]" style={{ color: '#B59B8D' }}>{lang === 'fr' ? "Produits scannés et enregistrés" : "Scanned and saved products"}</p>
                  </div>
                </div>
              </button>

              {/* 3. Mon Abonnement */}
              <button onClick={() => { setShowMenuModal(false); handleManageSubscription(); }} className="w-full flex items-center justify-between p-3.5 rounded-[16px]" style={{ background: 'var(--cream-card)', border: '1px solid var(--line)' }}>
                <div className="flex items-center gap-3">
                  <CreditCard size={18} style={{ color: '#A37B68' }} />
                  <div className="text-left">
                    <p className="font-display text-[14px] font-medium" style={{ color: '#A37B68' }}>{lang === 'fr' ? "Mon Abonnement" : "My Subscription"}</p>
                    <p className="font-body text-[11px]" style={{ color: '#B59B8D' }}>{lang === 'fr' ? "Gérer mon offre et mes moyens de paiement" : "Manage plan and payment methods"}</p>
                  </div>
                </div>
              </button>

              {/* 4. Aide & Support */}
              <button onClick={() => { setShowMenuModal(false); }} className="w-full flex items-center justify-between p-3.5 rounded-[16px]" style={{ background: 'var(--cream-card)', border: '1px solid var(--line)' }}>
                <div className="flex items-center gap-3">
                  <HelpCircle size={18} style={{ color: '#A37B68' }} />
                  <div className="text-left">
                    <p className="font-display text-[14px] font-medium" style={{ color: '#A37B68' }}>{lang === 'fr' ? "Aide & Support" : "Help & Support"}</p>
                    <p className="font-body text-[11px]" style={{ color: '#B59B8D' }}>{lang === 'fr' ? "Questions fréquentes et contact" : "FAQ and customer support"}</p>
                  </div>
                </div>
              </button>

              {/* 5. Confidentialité & CGU */}
              <button onClick={() => { setShowMenuModal(false); }} className="w-full flex items-center justify-between p-3.5 rounded-[16px]" style={{ background: 'var(--cream-card)', border: '1px solid var(--line)' }}>
                <div className="flex items-center gap-3">
                  <Shield size={18} style={{ color: '#A37B68' }} />
                  <div className="text-left">
                    <p className="font-display text-[14px] font-medium" style={{ color: '#A37B68' }}>{lang === 'fr' ? "Confidentialité & CGU" : "Privacy & Terms"}</p>
                    <p className="font-body text-[11px]" style={{ color: '#B59B8D' }}>{lang === 'fr' ? "Protection des données de santé" : "Data protection and legal terms"}</p>
                  </div>
                </div>
              </button>

              {/* 6. Déconnexion */}
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
