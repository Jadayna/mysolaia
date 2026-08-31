import React, { useState } from 'react';
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
    setErr(''); setBusy(true);
    try {
      if (mode === 'signup') await register(email, password, lang);
      else await login(email, password);
    } catch (e2) {
      setErr(e2?.response?.data?.detail || 'Erreur');
    } finally { setBusy(false); }
  };

  return (
    <div className="app-shell">
      <div className="flex justify-end px-5 py-3">
        <button onClick={() => setLang(lang === 'fr' ? 'en' : 'fr')} className="font-body text-[11px] uppercase tracking-caps" style={{ color: 'var(--ink-soft)' }}>
          {lang === 'fr' ? 'EN' : 'FR'}
        </button>
      </div>
      <div className="flex-1 flex flex-col justify-center px-8 pb-20">
        <span className="font-body tracking-caps text-[11px] uppercase" style={{ color: 'var(--gold)' }}>
          {lang === 'fr' ? 'La routine qui se construit toute seule' : 'The routine that builds itself'}
        </span>
        <h1 className="font-display text-[52px] leading-none mt-2" style={{ color: 'var(--ink)' }}>Ordre</h1>

        <form onSubmit={submit} className="mt-10 space-y-3">
          <input className="field" type="email" required placeholder={t('email')} value={email} onChange={(e) => setEmail(e.target.value)} />
          <input className="field" type="password" required minLength={6} placeholder={t('password')} value={password} onChange={(e) => setPassword(e.target.value)} />
          {err && <p className="font-body italic text-[13px]" style={{ color: '#a4552f' }}>{err}</p>}
          <button disabled={busy} className="gold-btn w-full rounded-[8px] py-3.5 font-body tracking-caps text-[11px] uppercase">
            {mode === 'signup' ? t('signUp') : t('signIn')}
          </button>
        </form>

        <button onClick={() => setMode(mode === 'signup' ? 'signin' : 'signup')} className="mt-5 font-body italic text-[13.5px] text-left" style={{ color: 'var(--ink-soft)' }}>
          {mode === 'signup' ? t('haveAccount') : t('noAccount')} <span style={{ color: 'var(--gold)' }}>{mode === 'signup' ? t('signIn') : t('signUp')}</span>
        </button>

        <p className="font-body italic text-[11.5px] leading-relaxed mt-12" style={{ color: 'var(--ink-faint)' }}>
          {t('legal')}
        </p>
      </div>
    </div>
  );
};

export default AuthScreen;
