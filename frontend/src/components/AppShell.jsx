import React, { useState, useEffect } from 'react';
import { Home, Camera, ListChecks, LineChart, Sparkles, Globe, LogOut, Shield, CreditCard, X, User, Package, HelpCircle, Share, Download, RotateCcw, ChevronRight, Users } from 'lucide-react';
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
import CircleScreen from '../screens/CircleScreen';
import api from '../lib/api';
import { scheduleReminders } from '../lib/reminders';
import { initAnalytics, trackScreen } from '../lib/analytics';

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
  { id: 'cercle', screen: CircleScreen },
];

const AppShell = () => {
  const { t, lang, setLang } = useT();
  const { user, logout, refreshUser } = useAuth();
  const [active, setActive] = useState(() => {
    return sessionStorage.getItem('solaia_active_tab') || 'accueil';
  });  
  const [routinePhase, setRoutinePhase] = useState('soir');
  const [showMenuModal, setShowMenuModal] = useState(false);
  const [stripeSuccessToast, setStripeSuccessToast] = useState(false);

  // --- Gestion Installation PWA (iOS & Android) ---
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Analytics (Umami) : chargée une seule fois si VITE_UMAMI_WEBSITE_ID est défini
    initAnalytics();
    // Rappels de routine : planifiés au démarrage, replanifiés à chaque retour dans l'app
    scheduleReminders(lang);
    const onVisible = () => { if (document.visibilityState === 'visible') scheduleReminders(lang); };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [lang]);

  useEffect(() => {
    // 1. Si déjà installée en plein écran, ne rien afficher
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
    if (isStandalone) return;

    // 2. Détection infaillible iOS (iPhone, iPad, iPod et iPadOS en mode Mac)
    const ua = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(ua) || (ua.includes('macintosh') && navigator.maxTouchPoints > 1);
    setIsIOS(isIosDevice);

    if (isIosDevice) {
      // Afficher sur iOS Safari
      setShowInstallBanner(true);
    }

    // 3. Android / Chrome / Edge : écouter l'événement système
    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallBanner(true);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  // Interception universelle du retour Stripe
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sid = params.get('session_id');
    if (sid) {
      api.get(`/payments/status/${sid}`)
        .then(async (res) => {
          if (res.data?.unlocked || res.data?.status === 'complete') {
            if (refreshUser) {
              await refreshUser();
            }
               setStripeSuccessToast(true);
            setTimeout(() => setStripeSuccessToast(false), 5000);
            window.history.replaceState({}, document.title, window.location.pathname);
          }
        })
        .catch((err) => console.error("Erreur validation Stripe:", err));
    }
  }, [refreshUser, lang]);
  const [showAndroidHelp, setShowAndroidHelp] = useState(false);

  const handleInstallClick = async () => {
    const promptEvent = window.deferredPrompt || deferredPrompt;
    if (promptEvent) {
      try {
        promptEvent.prompt();
        const { outcome } = await promptEvent.userChoice;
        if (outcome === 'accepted') {
          setShowInstallBanner(false);
          window.deferredPrompt = null;
          setDeferredPrompt(null);
        }
      } catch (err) {
        console.error("Install prompt error:", err);
      }
    }
  };

  const dismissInstall = () => {
    setShowInstallBanner(false);
    localStorage.setItem('solaia_pwa_dismissed', 'true');
  };

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
    trackScreen(id);
    // Mémoriser l'écran actuel pour le rafraîchissement
    sessionStorage.setItem('solaia_active_tab', id);
  };

   const Current =
    TABS.find((tb) => tb.id === active)?.screen ||
    EXTRA_SCREENS.find((s) => s.id === active)?.screen ||
    HomeScreen;

  return (
    <div className="app-shell relative">

      {/* Toast doré de Bienvenue Illimité */}
      {stripeSuccessToast && (
        <div className="fixed top-5 left-4 right-4 z-50 p-4 rounded-[18px] shadow-2xl animate-fade-up flex items-center gap-3.5 backdrop-blur-md" 
             style={{ background: '#FAF6F0', border: '1.5px solid var(--gold)', boxShadow: '0 12px 35px -10px rgba(182, 130, 53, 0.4)' }}>
          <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ background: 'rgba(182, 130, 53, 0.15)' }}>
            <Sparkles size={20} style={{ color: 'var(--gold)' }} />
          </div>
          <div className="flex-1">
            <h4 className="font-display text-[14px] font-semibold" style={{ color: 'var(--ink)' }}>
              {lang === 'fr' ? "Accès Illimité Activé ✨" : "Unlimited Access Active ✨"}
            </h4>
            <p className="font-body text-[11.5px] mt-0.5 leading-snug" style={{ color: 'var(--ink-soft)' }}>
              {lang === 'fr' 
                ? "Ton étagère est débloquée sans restriction. Ajoute autant de soins que tu le souhaites !" 
                : "Your shelf is now unlimited. Organize as many products as you want!"}
            </p>
          </div>
          <button onClick={() => setStripeSuccessToast(false)} className="text-stone-400 hover:text-stone-600 p-1">
            <X size={16} />
          </button>
        </div>
      )}

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
            className="h-9 w-auto object-contain"
          />
        </div>
        
      <div className="flex items-center gap-4">
          <button onClick={logout} title={lang === 'fr' ? "Déconnexion" : "Log out"} style={{ color: 'var(--ink-soft)' }}>
            <LogOut size={19} strokeWidth={1.6} />
          </button>
        </div>

      </div>

      {/* Écran actif */}
      <div className="screen">
        <Current go={go} routinePhase={routinePhase} />
      </div>

      {/* Bandeau d'installation PWA parfaitement aligné & toujours actif */}
      {showInstallBanner && (
        <div 
          className="fixed bottom-[96px] left-3.5 right-3.5 z-40 p-4 rounded-[20px] shadow-2xl animate-fade-up" 
          style={{ background: '#FAF6F0', border: '1.5px solid var(--gold)', boxShadow: '0 12px 35px -10px rgba(163, 123, 104, 0.45)' }}
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-[14px] bg-white border border-stone-200 shadow-xs flex items-center justify-center p-1 shrink-0 overflow-hidden">
          <img src="/icon-512.png" alt="MySolaia" className="w-full h-full object-contain" />
        </div>
              <div className="pr-1">
                <h4 className="font-display text-[14px] font-semibold leading-tight" style={{ color: 'var(--ink)' }}>
                  {lang === 'fr' ? "Installer MySolaia" : "Install MySolaia"}
                </h4>
                <p className="font-body text-[11px] mt-0.5 leading-snug" style={{ color: 'var(--ink-soft)' }}>
                  {lang === 'fr' 
                    ? "Accède à ta routine en 1 clic sans passer par le navigateur." 
                    : "Access your ritual in 1 tap without using the browser."}
                </p>
              </div>
            </div>
            
            <button 
              onClick={() => setShowInstallBanner(false)} 
              className="p-1.5 rounded-full text-stone-400 hover:text-stone-600 shrink-0"
            >
              <X size={16} />
            </button>
          </div>

          {/* Bouton d'action TOUJOURS visible sur Android / Web */}
          {!isIOS && (
            <button
              onClick={handleInstallClick}
              className="mt-3 w-full py-2.5 px-3 rounded-[12px] text-white font-body text-[11px] font-semibold uppercase tracking-caps flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.98]"
              style={{ background: '#A37B68' }}
            >
              <Download size={14} />
              <span>{lang === 'fr' ? "Ajouter à l'écran d'accueil" : "Add to Home Screen"}</span>
            </button>
          )}

          {/* Guide iPhone */}
          {isIOS && (
            <div className="mt-2.5 pt-2 border-t flex items-center gap-2 font-body text-[11px]" style={{ borderColor: 'var(--line)', color: 'var(--ink)' }}>
              <Share size={13} style={{ color: 'var(--gold)' }} />
              <span>
                {lang === 'fr' 
                  ? "Touche Partager (icône carré + flèche), puis « Sur l'écran d'accueil »." 
                  : "Tap Share (square with arrow), then 'Add to Home Screen'."}
              </span>
            </div>
          )}
        </div>
      )}

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

            {/* Modale Tiroir du Menu Chic & Épuré */}
      {showMenuModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex flex-col justify-end animate-fade-in">
          <div className="w-full bg-[#FAF6F0] rounded-t-[32px] p-6 pb-8 border-t border-[#e2ded7] shadow-2xl max-h-[90vh] overflow-y-auto animate-slide-up space-y-5">
            
            {/* Header du Menu : Soleil + Mon Compte */}
            <div className="flex items-center justify-between pb-3 border-b border-stone-200/60">
              <div className="flex items-center gap-3">
                <img 
                  src="/icon-512.png" 
                  alt="Solaia Sun" 
                  className="w-9 h-9 object-contain rounded-full shadow-xs"
                />
                <div>
                  <h3 className="font-display text-[18px] font-semibold" style={{ color: 'var(--ink)' }}>
                    {user?.prenom ? (lang === 'fr' ? `Bonjour, ${user.prenom}` : `Hello, ${user.prenom}`) : (lang === 'fr' ? 'Mon Compte' : 'My Account')}
                  </h3>
                  <p className="font-body text-[11px] text-stone-500">{user?.email}</p>
                </div>
              </div>
              <button 
                onClick={() => setShowMenuModal(false)}
                className="w-9 h-9 rounded-full bg-stone-200/60 flex items-center justify-center text-stone-500 hover:text-stone-800 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* SECTION 1 : Mon Rituel & Mes Soins */}
            <div className="space-y-2">
              <span className="font-body text-[9.5px] uppercase tracking-caps font-semibold px-1" style={{ color: 'var(--gold)' }}>
                {lang === 'fr' ? 'Mon Rituel & Mes Soins' : 'My Ritual & Skincare'}
              </span>

              {/* Profil & Diagnostic */}
              <button onClick={() => { setShowMenuModal(false); go('profil'); }} className="w-full flex items-center justify-between p-3.5 rounded-[16px] bg-white border border-stone-200/80 shadow-xs hover:border-amber-300 transition-all">
                <div className="flex items-center gap-3">
                  <User size={18} style={{ color: '#A37B68' }} />
                  <div className="text-left">
                    <p className="font-display text-[14px] font-medium" style={{ color: 'var(--ink)' }}>
                      {lang === 'fr' ? "Profil & Diagnostic" : "Profile & Skin Type"}
                    </p>
                    <p className="font-body text-[11px] text-stone-400">
                      {lang === 'fr' ? "Type de peau, préoccupations et objectifs" : "Skin type, concerns and goals"}
                    </p>
                  </div>
                </div>
                <ChevronRight size={16} className="text-stone-400" />
              </button>

              {/* Mon Abonnement */}
              <button onClick={() => { setShowMenuModal(false); go('trial'); }} className="w-full flex items-center justify-between p-3.5 rounded-[16px] bg-white border border-stone-200/80 shadow-xs hover:border-amber-300 transition-all">
                <div className="flex items-center gap-3">
                  <CreditCard size={18} style={{ color: '#A37B68' }} />
                  <div className="text-left">
                    <p className="font-display text-[14px] font-medium" style={{ color: 'var(--ink)' }}>
                      {user?.statut_abonnement === 'actif' || user?.is_premium 
                        ? (lang === 'fr' ? "Mon Abonnement Illimité ✨" : "My Unlimited Plan ✨")
                        : (lang === 'fr' ? "Mon Abonnement" : "My Subscription")}
                    </p>
                    <p className="font-body text-[11px] text-stone-400">
                      {lang === 'fr' ? "Gérer mon offre et mes moyens de paiement" : "Manage plan and payment methods"}
                    </p>
                  </div>
                </div>
                <span className="font-body text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full" style={{ background: 'rgba(182, 130, 53, 0.12)', color: 'var(--gold)' }}>
                  {user?.statut_abonnement === 'actif' || user?.is_premium ? 'VIP' : 'FREE'}
                </span>
              </button>
            </div>

              {/* Mon Cercle */}
              <button onClick={() => { setShowMenuModal(false); go('cercle'); }} className="w-full flex items-center justify-between p-3.5 rounded-[16px] bg-white border border-stone-200/80 shadow-xs hover:border-amber-300 transition-all">
                <div className="flex items-center gap-3">
                  <Users size={18} style={{ color: '#A37B68' }} />
                  <div className="text-left">
                    <p className="font-display text-[14px] font-medium" style={{ color: 'var(--ink)' }}>
                      {lang === 'fr' ? "Mon Cercle" : "My Circle"}
                    </p>
                    <p className="font-body text-[11px] text-stone-400">
                      {lang === 'fr' ? "Amies, streaks & Wizz 💫" : "Friends, streaks & Wizz 💫"}
                    </p>
                  </div>
                </div>
                <ChevronRight size={16} className="text-stone-400" />
              </button>
            </div>

            {/* SECTION 2 : Préférences & Application */}
            <div className="space-y-2">
              <span className="font-body text-[9.5px] uppercase tracking-caps font-semibold px-1 text-stone-500">
                {lang === 'fr' ? 'Préférences' : 'Preferences'}
              </span>

              {/* Choix de la langue */}
              <div className="flex items-center justify-between p-3.5 rounded-[16px] bg-white border border-stone-200/80 shadow-xs">
                <div className="flex items-center gap-3">
                  <Globe size={18} style={{ color: '#A37B68' }} />
                  <span className="font-display text-[14px] font-medium" style={{ color: 'var(--ink)' }}>
                    {lang === 'fr' ? "Langue d'affichage" : "Display Language"}
                  </span>
                </div>
                <div className="flex items-center bg-stone-100 p-1 rounded-[10px] border border-stone-200/60">
                  <button
                    onClick={() => setLang('fr')}
                    className={`px-3 py-1 rounded-[8px] font-body text-[11px] font-semibold uppercase tracking-caps transition-all ${
                      lang === 'fr' ? 'bg-[#A37B68] text-white shadow-xs' : 'text-stone-500'
                    }`}
                  >
                    FR
                  </button>
                  <button
                    onClick={() => setLang('en')}
                    className={`px-3 py-1 rounded-[8px] font-body text-[11px] font-semibold uppercase tracking-caps transition-all ${
                      lang === 'en' ? 'bg-[#A37B68] text-white shadow-xs' : 'text-stone-500'
                    }`}
                  >
                    EN
                  </button>
                </div>
              </div>

              {/* Bouton Installer l'application */}
              {(!window.matchMedia('(display-mode: standalone)').matches && !window.navigator.standalone) && (
                <button 
                  onClick={() => {
                    setShowMenuModal(false);
                    if (!isIOS) {
                      handleInstallClick();
                      setShowInstallBanner(true);
                    } else {
                      setShowInstallBanner(true);
                    }
                  }}
                  className="w-full flex items-center justify-between p-3.5 rounded-[16px] shadow-xs transition-all active:scale-[0.98]" 
                  style={{ background: 'rgba(182, 130, 53, 0.08)', border: '1px solid var(--gold-soft)' }}
                >
                  <div className="flex items-center gap-3">
                    <Download size={18} style={{ color: 'var(--gold)' }} />
                    <div className="text-left">
                      <p className="font-display text-[14px] font-semibold" style={{ color: 'var(--gold)' }}>
                        {lang === 'fr' ? "Installer l'application" : "Install the App"}
                      </p>
                      <p className="font-body text-[11px]" style={{ color: 'var(--ink-soft)' }}>
                        {lang === 'fr' ? "Ajouter MySolaia sur ton écran d'accueil" : "Add MySolaia to your home screen"}
                      </p>
                    </div>
                  </div>
                  <span className="font-body text-[10px] uppercase tracking-caps font-semibold px-2 py-0.5 rounded-full text-white" style={{ background: 'var(--gold)' }}>
                    {lang === 'fr' ? "1 clic" : "1 tap"}
                  </span>
                </button>
              )}
            </div>

            {/* SECTION 3 : Assistance & Confidentialité */}
            <div className="space-y-2">
              <span className="font-body text-[9.5px] uppercase tracking-caps font-semibold px-1 text-stone-500">
                {lang === 'fr' ? 'Aide & Sécurité' : 'Help & Security'}
              </span>

              {/* Aide & FAQ */}
              <button onClick={() => { setShowMenuModal(false); go('aide'); }} className="w-full flex items-center justify-between p-3.5 rounded-[16px] bg-white border border-stone-200/80 shadow-xs hover:border-amber-300 transition-all">
                <div className="flex items-center gap-3">
                  <HelpCircle size={18} style={{ color: '#A37B68' }} />
                  <div className="text-left">
                    <p className="font-display text-[14px] font-medium" style={{ color: 'var(--ink)' }}>
                      {lang === 'fr' ? "Aide & Support" : "Help & Support"}
                    </p>
                    <p className="font-body text-[11px] text-stone-400">
                      {lang === 'fr' ? "Questions fréquentes et contact" : "FAQ and customer support"}
                    </p>
                  </div>
                </div>
                <ChevronRight size={16} className="text-stone-400" />
              </button>

              {/* Confidentialité & CGU */}
              <button onClick={() => { setShowMenuModal(false); go('confidentialite'); }} className="w-full flex items-center justify-between p-3.5 rounded-[16px] bg-white border border-stone-200/80 shadow-xs hover:border-amber-300 transition-all">
                <div className="flex items-center gap-3">
                  <Shield size={18} style={{ color: '#A37B68' }} />
                  <div className="text-left">
                    <p className="font-display text-[14px] font-medium" style={{ color: 'var(--ink)' }}>
                      {lang === 'fr' ? "Confidentialité & CGU" : "Privacy & Terms"}
                    </p>
                    <p className="font-body text-[11px] text-stone-400">
                      {lang === 'fr' ? "Protection des données de santé" : "Data protection and legal terms"}
                    </p>
                  </div>
                </div>
                <ChevronRight size={16} className="text-stone-400" />
              </button>

              {/* Déconnexion */}
              <button 
                onClick={() => { setShowMenuModal(false); logout(); }} 
                className="w-full flex items-center justify-between p-3.5 rounded-[16px] bg-rose-50/50 border border-rose-200/60 shadow-xs text-rose-600 hover:bg-rose-100/60 transition-all"
              >
                <div className="flex items-center gap-3">
                  <LogOut size={18} />
                  <span className="font-display text-[14px] font-medium">
                    {lang === 'fr' ? "Se déconnecter" : "Log out"}
                  </span>
                </div>
              </button>
            </div>

            {/* Footer : Version & Mise à jour instantanée */}
            <div className="pt-2 border-t border-stone-200/60 flex items-center justify-between px-1">
              <span className="font-body text-[11px] text-stone-400">
                MySolaia · v1.0.2
              </span>
              <button
                onClick={async () => {
                  if ('caches' in window) {
                    const names = await caches.keys();
                    await Promise.all(names.map(name => caches.delete(name)));
                  }
                  window.location.reload(true);
                }}
                className="flex items-center gap-1.5 font-body text-[11px] font-medium transition-all active:scale-95 px-3 py-1 rounded-full bg-stone-200/80 text-stone-700 hover:bg-stone-300"
              >
                <RotateCcw size={12} />
                <span>{lang === 'fr' ? 'Mettre à jour' : 'Update'}</span>
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default AppShell;