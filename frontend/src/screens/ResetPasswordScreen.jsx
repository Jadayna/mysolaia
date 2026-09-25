import React, { useState } from 'react';
import api from '../lib/api';
import { Eye, EyeOff } from 'lucide-react';
import { useT } from '../i18n';

const inputStyle = {
  background: '#FFF',
  border: '1px solid var(--line)',
  color: 'var(--ink)',
};

const ResetPasswordScreen = ({ token }) => {
  const { lang } = useT();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (password.length < 6) {
      setError(lang === 'fr' ? 'Minimum 6 caractères.' : 'Minimum 6 characters.');
      return;
    }
    if (password !== confirm) {
      setError(lang === 'fr' ? 'Les mots de passe ne correspondent pas.' : 'Passwords do not match.');
      return;
    }
    setBusy(true);
    try {
      await api.post('/auth/reset', { token, new_password: password });
      setDone(true);
    } catch (err) {
      const detail = err?.response?.data?.detail;
      setError(
        typeof detail === 'string' && detail
          ? detail
          : lang === 'fr'
            ? 'Lien invalide ou expiré — demande un nouveau lien depuis la connexion.'
            : 'Invalid or expired link — request a new one from the sign-in screen.'
      );
    }
    setBusy(false);
  };

  const goLogin = () => {
    window.history.replaceState({}, document.title, window.location.pathname);
    window.location.reload();
  };

  return (
    <div className="min-h-screen flex flex-col justify-between p-8 text-center" style={{ background: 'var(--cream-bg, #FAF6F0)' }}>
      <div />
      <div className="my-auto space-y-4 max-w-sm mx-auto w-full">
        <p className="font-body text-[10px] uppercase tracking-caps" style={{ color: 'var(--ink-faint)' }}>
          {lang === 'fr' ? 'NOUVEAU MOT DE PASSE' : 'NEW PASSWORD'}
        </p>
        <div className="flex justify-center items-center">
          <img
            src="/mysolaia-nom-4096.png"
            alt="MySolaia"
            className="h-16 object-contain mx-auto"
          />
        </div>

        {done ? (
          <div className="mt-8 space-y-4">
            <p className="font-body text-[14px]" style={{ color: 'var(--ink)' }}>
              {lang === 'fr'
                ? 'Ton mot de passe a été mis à jour. Tu peux te connecter !'
                : 'Your password has been updated. You can sign in!'}
            </p>
            <button
              type="button"
              onClick={goLogin}
              className="w-full py-4 rounded-[12px] font-body text-[11px] uppercase tracking-caps font-semibold text-white transition-all active:scale-[0.98] shadow-sm"
              style={{ background: '#A37B68' }}
            >
              {lang === 'fr' ? 'SE CONNECTER' : 'SIGN IN'}
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-8 space-y-3">
            <p className="font-body text-[13px]" style={{ color: 'var(--ink-soft)' }}>
              {lang === 'fr'
                ? 'Choisis ton nouveau mot de passe (minimum 6 caractères).'
                : 'Choose your new password (minimum 6 characters).'}
            </p>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder={lang === 'fr' ? 'Nouveau mot de passe' : 'New password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3.5 pr-11 rounded-[12px] font-body text-[14px] outline-none"
                style={inputStyle}
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
            <div className="relative">
              <input
                type={showConfirm ? 'text' : 'password'}
                placeholder={lang === 'fr' ? 'Confirme le mot de passe' : 'Confirm password'}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="w-full px-4 py-3.5 pr-11 rounded-[12px] font-body text-[14px] outline-none"
                style={inputStyle}
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirm((v) => !v)}
                aria-label={showConfirm ? (lang === 'fr' ? 'Masquer le mot de passe' : 'Hide password') : (lang === 'fr' ? 'Afficher le mot de passe' : 'Show password')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1"
                style={{ color: 'var(--ink-faint)' }}
              >
                {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {error && (
              <p className="font-body text-[12.5px]" style={{ color: '#B3261E' }}>
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={busy}
              className="w-full py-4 rounded-[12px] font-body text-[11px] uppercase tracking-caps font-semibold text-white transition-all active:scale-[0.98] mt-2 shadow-sm disabled:opacity-60"
              style={{ background: '#A37B68' }}
            >
              {busy
                ? '…'
                : lang === 'fr' ? 'METTRE À JOUR' : 'UPDATE PASSWORD'}
            </button>
          </form>
        )}
      </div>
      <p className="font-body italic text-[11px] text-center" style={{ color: 'var(--ink-faint)' }}>
        {lang === 'fr'
          ? "Aucun avis médical : l'application ordonne et prévient, elle ne pose pas de diagnostic."
          : 'No medical advice: the app orders and warns, it does not diagnose.'}
      </p>
    </div>
  );
};

export default ResetPasswordScreen;
