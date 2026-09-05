import React, { useState } from 'react';
import { Sparkle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useT } from '../i18n';

const AuthScreen = () => {
  // Par défaut sur "Sign In" (Se connecter)
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const { login, register } = useAuth();
  const { lang, setLang } = useT();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErr('');
    setBusy(true);

    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await register(email, password, lang);
      }
    } catch (e2) {
      setErr(e2?.response?.data?.detail || 'Erreur de connexion');
    } finally {
      setBusy(false);
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

      {/* Contenu Central / Logo */}
      <div className="my-auto space-y-3">
        <p className="font-body text-[10px] uppercase tracking-caps font-medium" style={{ color: 'var(--gold, #B68235)' }}>
          {lang === 'fr' ? 'LA ROUTINE QUI SE CONSTRUIT TOUTE SEULE' : 'THE ROUTINE THAT BUILDS ITSELF'}
        </p>

        {/* Logo MySolaia avec l'étincelle sur le i */}
        <h1 className="font-display text-[48px] leading-none flex items-center justify-center select-none" style={{ color: 'var(--ink)' }}>
          MySola
          <span className="relative inline-block">
            <span className="inline-block">ı</span>
            <Sparkle 
              size={12} 
              className="absolute -top-[0.2em] left-1/2 -translate-x-1/2 fill-current" 
              style={{ color: 'var(--ink)' }} 
            />
          </span>
          a
        </h1>

        {/* Formulaire */}
        <form onSubmit={handleSubmit} className="mt-8 space-y-3 max-w-sm mx-auto">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3.5 rounded-[12px] font-body text-[14px] outline-none"
            style={{ background: 'var(--cream-card, #FFF)', border: '1px solid var(--line-strong, #E5DCD3)', color: 'var(--ink)' }}
            required
          />
          <input
            type="password"
            placeholder={lang === 'fr' ? 'Mot de passe' : 'Password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3.5 rounded-[12px] font-body text-[14px] outline-none"
            style={{ background: 'var(--cream-card, #FFF)', border: '1px solid var(--line-strong, #E5DCD3)', color: 'var(--ink)' }}
            required
            minLength={6}
          />

          {err && <p className="font-body italic text-[13px] text-left" style={{ color: '#a4552f' }}>{err}</p>}

          <button
            type="submit"
            disabled={busy}
            className="w-full py-4 rounded-[12px] font-body text-[11px] uppercase tracking-caps font-semibold text-white transition-all active:scale-[0.98] mt-2 shadow-sm"
            style={{ background: '#A37B68' }}
          >
            {isLogin 
              ? (lang === 'fr' ? 'SE CONNECTER' : 'SIGN IN') 
              : (lang === 'fr' ? 'CRÉER UN COMPTE' : 'CREATE ACCOUNT')}
          </button>
        </form>

        {/* Bascule Inscription / Connexion */}
        <p className="font-body text-[12.5px] mt-4" style={{ color: 'var(--ink-soft)' }}>
          {isLogin ? (
            <>
              {lang === 'fr' ? "Don't have an account? " : "Don't have an account? "}
              <button 
                type="button"
                onClick={() => { setIsLogin(false); setErr(''); }} 
                className="font-semibold underline cursor-pointer"
                style={{ color: 'var(--gold, #B68235)' }}
              >
                {lang === 'fr' ? 'S\'inscrire' : 'Sign up'}
              </button>
            </>
          ) : (
            <>
              {lang === 'fr' ? 'Already have an account? ' : 'Already have an account? '}
              <button 
                type="button"
                onClick={() => { setIsLogin(true); setErr(''); }} 
                className="font-semibold underline cursor-pointer"
                style={{ color: 'var(--gold, #B68235)' }}
              >
                {lang === 'fr' ? 'Se connecter' : 'Sign in'}
              </button>
            </>
          )}
        </p>
      </div>

      {/* Mention légale en bas */}
      <p className="font-body italic text-[11px] text-center max-w-xs mx-auto" style={{ color: 'var(--ink-faint)' }}>
        {lang === 'fr' 
          ? 'Pas de conseil médical : l\'application ordonne et alerte, elle ne diagnostique pas.' 
          : 'No medical advice: the app orders and warns, it does not diagnose.'}
      </p>
    </div>
  );
};

export default AuthScreen;
