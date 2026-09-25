import React, { useState, useEffect } from 'react';
import { Download, Share, X, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useT } from '../i18n';
import api from '../lib/api';

const AuthScreen = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [view, setView] = useState('auth'); // 'auth' | 'forgot' | 'forgot-sent'
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotBusy, setForgotBusy] = useState(false);
  const [forgotError, setForgotError] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authBusy, setAuthBusy] = useState(false);
  const [authError, setAuthError] = useState('');
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
    const promptEvent = window.deferredPrompt || deferredPrompt;
    if (promptEvent) {
      try {
        promptEvent.prompt();
        const { outcome } = await promptEvent.userChoice;
        if (outcome === 'accepted') {
          window.deferredPrompt = null;
          setDeferredPrompt(null);
        }
      } catch (e) {
        console.error("Install error:", e);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (authBusy) return;
    setAuthBusy(true);
    setAuthError('');
    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await register(email, password);
      }
    } catch (err) {
      const status = err?.response?.status;
      setAuthError(
        status === 401
          ? (lang === 'fr' ? 'Courriel ou mot de passe incorrect.' : 'Incorrect email or password.')
          : (lang === 'fr'
              ? 'Impossible de joindre le serveur. Vérifie ta connexion et réessaie.'
              : "Couldn't reach the server. Check your connection and try again.")
      );
    } finally {
      setAuthBusy(false);
    }
  };

  const handleForgot = async (e) => {
    e.preventDefault();
    if (forgotBusy) return;
    setForgotBusy(true);
    setForgotError('');
    try {
      await api.post('/auth/forgot', { email: forgotEmail, origin_url: window.location.origin });
      // Le backend répond toujours OK (anti-énumération) : on affiche la confirmation.
      setForgotBusy(false);
      setView('forgot-sent');
    } catch (err) {
      // Échec réel de la requête (réseau, serveur) : on reste sur le formulaire avec un message.
      setForgotBusy(false);
      setForgotError(lang === 'fr'
        ? "Impossible de joindre le serveur. Vérifie ta connexion et réessaie."
        : "Couldn't reach the server. Check your connection and try again.");
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
      {view === 'auth' ? (
      <div className="my-auto space-y-4">
      <p className="font-body text-[10px] uppercase tracking-caps" style={{ color: 'var(--ink-faint)' }}>
        {lang === 'fr' ? "LA ROUTINE QUI SE CONSTRUIT D'ELLE-MÊME" : 'THE ROUTINE THAT BUILDS ITSELF'}
      </p>

        {/* Logo Officiel de l'application */}
        <div className="flex justify-center items-center">
          <img 
            src="/mysolaia-nom-4096.png" 
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
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder={lang === 'fr' ? 'Mot de passe' : 'Password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3.5 pr-11 rounded-[12px] font-body text-[14px] outline-none"
              style={{ background: '#FFF', border: '1px solid var(--line)', color: 'var(--ink)' }}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? (lang === 'fr' ? 'Masquer le mot de passe' : 'Hide password') : (lang === 'fr' ? 'Afficher le mot de passe' : 'Show password')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1"
              style={{ color: 'var(--ink-faint)' }}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {isLogin && (
            <div className="text-right">
              <button
                type="button"
                onClick={() => setView('forgot')}
                className="font-body text-[12px] underline cursor-pointer"
                style={{ color: 'var(--ink-soft)' }}
              >
                {lang === 'fr' ? 'Mot de passe oublié ?' : 'Forgot password?'}
              </button>
            </div>
          )}

          <button
            type="submit"
            disabled={authBusy}
            className="w-full py-4 rounded-[12px] font-body text-[11px] uppercase tracking-caps font-semibold text-white transition-all active:scale-[0.98] mt-2 shadow-sm disabled:opacity-70"
            style={{ background: '#A37B68' }}
          >
            {authBusy
              ? (lang === 'fr' ? (isLogin ? 'Connexion…' : 'Création…') : (isLogin ? 'Signing in…' : 'Creating…'))
              : (isLogin
                ? (lang === 'fr' ? 'SE CONNECTER' : 'SIGN IN')
                : (lang === 'fr' ? 'CRÉER UN COMPTE' : 'CREATE ACCOUNT'))}
          </button>
          {authError && (
            <p className="font-body text-[12px] text-center pt-1" style={{ color: '#B4564A' }}>
              {authError}
            </p>
          )}
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
      ) : (
      <div className="my-auto space-y-4 max-w-sm mx-auto w-full">
        <p className="font-body text-[10px] uppercase tracking-caps" style={{ color: 'var(--ink-faint)' }}>
          {lang === 'fr' ? 'MOT DE PASSE OUBLIÉ' : 'FORGOT PASSWORD'}
        </p>
        <div className="flex justify-center items-center">
          <img
            src="/mysolaia-nom-4096.png"
            alt="MySolaia"
            className="h-16 object-contain mx-auto"
          />
        </div>
        {view === 'forgot' ? (
          <form onSubmit={handleForgot} className="mt-8 space-y-3">
            <p className="font-body text-[13px]" style={{ color: 'var(--ink-soft)' }}>
              {lang === 'fr'
                ? "Entre ton courriel et on t'enverra un lien pour choisir un nouveau mot de passe."
                : "Enter your email and we'll send you a link to choose a new password."}
            </p>
            <input
              type="email"
              placeholder="Email"
              value={forgotEmail}
              onChange={(e) => setForgotEmail(e.target.value)}
              className="w-full px-4 py-3.5 rounded-[12px] font-body text-[14px] outline-none"
              style={{ background: '#FFF', border: '1px solid var(--line)', color: 'var(--ink)' }}
              required
            />
            {forgotError && (
              <p className="font-body text-[12.5px]" style={{ color: '#B3261E' }}>
                {forgotError}
              </p>
            )}
            <button
              type="submit"
              disabled={forgotBusy}
              className="w-full py-4 rounded-[12px] font-body text-[11px] uppercase tracking-caps font-semibold text-white transition-all active:scale-[0.98] mt-2 shadow-sm disabled:opacity-60"
              style={{ background: '#A37B68' }}
            >
              {forgotBusy ? '…' : (lang === 'fr' ? 'ENVOYER LE LIEN' : 'SEND LINK')}
            </button>
            <button
              type="button"
              onClick={() => setView('auth')}
              className="font-body text-[12px] underline cursor-pointer"
              style={{ color: 'var(--ink-soft)' }}
            >
              {lang === 'fr' ? '← Retour à la connexion' : '← Back to sign in'}
            </button>
          </form>
        ) : (
          <div className="mt-8 space-y-4">
            <p className="font-body text-[13.5px]" style={{ color: 'var(--ink-soft)' }}>
              {lang === 'fr'
                ? "Si un compte existe avec ce courriel, tu vas recevoir un lien pour réinitialiser ton mot de passe (valide 1 heure). Pense à vérifier tes indésirables !"
                : 'If an account exists with this email, you will receive a link to reset your password (valid 1 hour). Check your spam folder!'}
            </p>
            <button
              type="button"
              onClick={() => setView('auth')}
              className="w-full py-4 rounded-[12px] font-body text-[11px] uppercase tracking-caps font-semibold text-white transition-all active:scale-[0.98] shadow-sm"
              style={{ background: '#A37B68' }}
            >
              {lang === 'fr' ? 'RETOUR À LA CONNEXION' : 'BACK TO SIGN IN'}
            </button>
          </div>
        )}
      </div>
      )}

      {/* Bouton d'installation sur l'écran d'accueil */}
        {!isStandalone && (
          <div className="pt-4">
            <button
              type="button"
              onClick={handleInstall}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full font-body text-[11px] uppercase tracking-caps font-semibold shadow-sm transition-all active:scale-[0.98] whitespace-nowrap animate-install-nudge"
              style={{ background: 'rgba(182,130,53,0.12)', color: 'var(--gold)', border: '1px solid var(--gold-soft)' }}
            >
              <Download size={13} />
              <span>{lang === 'fr' ? "Installer l'application" : "Install the app"}</span>
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