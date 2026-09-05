import React, { useState } from 'react';
import { Sparkle } from 'lucide-react';
import { useT } from '../i18n';
import { useAuth } from '../context/AuthContext';

const AuthScreen = () => {
  const { t, lang, setLang } = useT();
  const { login, register } = useAuth();
  const [mode, setMode] = useState('signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setErr(''); 
    setBusy(true);
    try {
      if (mode === 'signup') await register(email, password, lang);
      else await login(email, password);
    } catch (e2) {
      setErr(e2?.response?.data?.detail || 'Erreur');
    } finally { 
      setBusy(false); 
    }
  };

  return (
    <div className="app-shell flex flex-col justify-between min-h-screen">
      {/* Sélecteur de Langue */}
      <div className="flex justify-end px-5 py-3">
        <button 
          onClick={() => setLang(lang === 'fr' ? 'en' : 'fr')} 
          className="font-body text-[11px] uppercase tracking-caps" 
          style={{ color: 'var(--ink-soft)' }}
        >
          {lang === 'fr' ? 'EN' : 'FR'}
        </button>
      </div>

      {/* Contenu principal */}
      <div className="flex-1 flex flex-col justify-center px-8 pb-20">
        <span className="font-body tracking-caps text-[11px] uppercase font-medium" style={{ color: 'var(--gold)' }}>
          {lang === 'fr' ? 'La routine qui se construit toute seule' : 'The routine that builds itself'}
        </span>

        {/* LOGO MYSOLAIA AVEC L'ÉTINCELLE SUR LE I */}
        <h1 className="font-display text-[52px] leading-none mt-2 flex items-center select-none" style={{ color: 'var(--ink)' }}>
          MySola
          <span className="relative inline-block">
            <span className="inline-block">ı</span>
            <Sparkle 
              size={13} 
              className="absolute -top-[0.22em] left-1/2 -translate-x-1/2 fill-current" 
              style={{ color: 'var(--ink)' }} 
            />
          </span>
          a
        </h1>

        {/* Formulaire */}
        <form onSubmit={submit} className="mt-10 space-y-3">
          <input 
            className="field w-full p-3.5 rounded-[12px] font-body text-[14px] outline-none" 
            type="email" 
            required 
            placeholder={t('email')} 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            style={{ background: 'var(--cream-card)', border: '1px solid var(--line-strong)' }}
          />
          <input 
            className="field w-full p-3.5 rounded-[12px] font-body text-[14px] outline-none" 
            type="password" 
            required 
            minLength={6} 
            placeholder={t('password')} 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            style={{ background: 'var(--cream-card)', border: '1px solid var(--line-strong)' }}
          />

          {err && <p className="font-body italic text-[13px]" style={{ color: '#a4552f' }}>{err}</p>}

          <button 
            disabled={busy} 
            className="w-full rounded-[12px] py-3.5 mt-2 font-body tracking-caps text-[11px] uppercase font-semibold text-white transition-all active:scale-[0.98]"
            style={{ background: '#A37B68', boxShadow: '0 4px 12px rgba(163, 123, 104, 0.2)' }}
          >
            {mode === 'signup' ? t('signUp') : t('signIn')}
          </button>
        </form>

        {/* Inverser Inscription / Connexion */}
        <button 
          onClick={() => setMode(mode === 'signup' ? 'signin' : 'signup')} 
          className="mt-5 font-body italic text-[13.5px] text-left" 
          style={{ color: 'var(--ink-soft)' }}
        >
          {mode === 'signup' ? t('haveAccount') : t('noAccount')}{' '}
          <span className="font-semibold underline" style={{ color: 'var(--gold)' }}>
            {mode === 'signup' ? t('signIn') : t('signUp')}
          </span>
        </button>

        <p className="font-body italic text-[11.5px] leading-relaxed mt-12" style={{ color: 'var(--ink-faint)' }}>
          {t('legal')}
        </p>
      </div>
    </div>
  );
};

export default AuthScreen;
