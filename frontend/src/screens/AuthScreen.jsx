import React, { useState, useEffect } from 'react';
import { Download, Share, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useT } from '../i18n';

const AuthScreen = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, register } = useAuth();
  const { lang, setLang } = useT();
    const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showGuide, setShowGuide] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(true);

  useEffect(() => {
    const standalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
    setIsStandalone(!!standalone);
    if (standalone) return;

    const ua = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(ua) || (ua.includes('macintosh') && navigator.maxTouchPoints > 1);
    setIsIOS(isIosDevice);

    const handlePrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handlePrompt);
    return () => window.removeEventListener('beforeinstallprompt', handlePrompt);
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') setDeferredPrompt(null);
    } else {
      setShowGuide(true);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isLogin) {
      login(email, password);
    } else {
      register(email, password);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between p-8 text-center" style={{ background: 'var(--cream-bg, #FAF6F0)' }}>
      {/* Sélecteur de langue */}
      <div className="flex justify-end">
        <button 
          onClick={() => setLang(lang === 'fr' ? 'en' : 'fr')}
          className="font-body text-[11px] uppercase tracking-caps font-semibold" 
          style={{ color: 'var(--ink-soft)' }}
        >
          {lang === 'fr' ? 'EN' : 'FR'}
        </button>
      </div>

      {/* En-tête / Logo */}
      <div className="my-auto space-y-4">
      <p className="font-body text-[10px] uppercase tracking-caps" style={{ color: 'var(--ink-faint)' }}>
        {lang === 'fr' ? "LA ROUTINE QUI SE CONSTRUIT D'ELLE-MÊME" : 'THE ROUTINE THAT BUILDS ITSELF'}
      </p>

        {/* Logo Officiel de l'application */}
        <div className="flex justify-center items-center">
          <img 
            src="/icon-192.png" 
            alt="MySolaia" 
            className="h-16 object-contain mx-auto" 
          />
        </div>

        {/* Formulaire */}
        <form onSubmit={handleSubmit} className="mt-8 space-y-3 max-w-sm mx-auto">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3.5 rounded-[12px] font-body text-[14px] outline-none"
            style={{ background: '#FFF', border: '1px solid var(--line)', color: 'var(--ink)' }}
            required
          />
          <input
            type="password"
            placeholder={lang === 'fr' ? 'Mot de passe' : 'Password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3.5 rounded-[12px] font-body text-[14px] outline-none"
            style={{ background: '#FFF', border: '1px solid var(--line)', color: 'var(--ink)' }}
            required
          />

          <button
            type="submit"
            className="w-full py-4 rounded-[12px] font-body text-[11px] uppercase tracking-caps font-semibold text-white transition-all active:scale-[0.98] mt-2 shadow-sm"
            style={{ background: '#A37B68' }}
          >
            {isLogin 
              ? (lang === 'fr' ? 'SE CONNECTER' : 'SIGN IN') 
              : (lang === 'fr' ? 'CRÉER UN COMPTE' : 'CREATE ACCOUNT')}
          </button>
        </form>

        {/* Bascule entre Se Connecter / Créer un compte */}
        <p className="font-body text-[12.5px] mt-4" style={{ color: 'var(--ink-soft)' }}>
          {isLogin ? (
            <>
              {lang === 'fr' ? 'Pas encore de compte ? ' : "Don't have an account? "}
              <button 
                type="button"
                onClick={() => setIsLogin(false)} 
                className="font-semibold underline cursor-pointer"
                style={{ color: 'var(--ink)' }}
              >
                {lang === 'fr' ? 'S\'inscrire' : 'Sign up'}
              </button>
            </>
          ) : (
            <>
              {lang === 'fr' ? 'Déjà un compte ? ' : 'Already have an account? '}
              <button 
                type="button"
                onClick={() => setIsLogin(true)} 
                className="font-semibold underline cursor-pointer"
                style={{ color: 'var(--ink)' }}
              >
                {lang === 'fr' ? 'Se connecter' : 'Sign in'}
              </button>
            </>
          )}
        </p>
      </div>

      {/* Bouton d'installation sur l'écran d'accueil */}
        {!isStandalone && (
          <div className="pt-4">
            <button
              type="button"
              onClick={handleInstall}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full font-body text-[11px] uppercase tracking-caps font-semibold shadow-sm transition-all active:scale-[0.98]"
              style={{ background: 'rgba(182,130,53,0.12)', color: 'var(--gold)', border: '1px solid var(--gold-soft)' }}
            >
              <Download size={13} />
              <span>{lang === 'fr' ? "Installer l'application sur mon écran" : "Add app to home screen"}</span>
            </button>
          </div>
        )}

        {/* Petit guide iPhone si cliqué */}
        {showGuide && (
          <div className="mt-3 p-3 rounded-[12px] text-left text-[11px] font-body animate-fade-up flex items-start justify-between gap-2" style={{ background: '#FFF', border: '1px solid var(--line)' }}>
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 font-semibold" style={{ color: 'var(--ink)' }}>
                <Share size={12} style={{ color: 'var(--gold)' }} />
                <span>{lang === 'fr' ? "Comment installer sur iPhone :" : "How to install on iPhone:"}</span>
              </div>
              <p style={{ color: 'var(--ink-soft)' }}>
                {lang === 'fr' 
                  ? "Touche l'icône Partager en bas de Safari, puis sélectionne « Sur l'écran d'accueil »." 
                  : "Tap Share at the bottom of Safari, then select 'Add to Home Screen'."}
              </p>
            </div>
            <button onClick={() => setShowGuide(false)} className="text-stone-400 p-1">
              <X size={14} />
            </button>
          </div>
        )}

      {/* Avertissement bas de page */}
      <p className="font-body italic text-[11px] text-center" style={{ color: 'var(--ink-faint)' }}>
        {lang === 'fr' 
          ? "Aucun avis médical : l'application ordonne et prévient, elle ne pose pas de diagnostic."
          : "No medical advice: the app orders and warns, it does not diagnose."}
      </p>
    </div>
  );
};

export default AuthScreen;