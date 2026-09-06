import React, { useState } from 'react';
import { ArrowLeft, Save } from 'lucide-react';
import { useT } from '../i18n';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';

const ProfileScreen = ({ go }) => {
  const { lang } = useT();
  const { user } = useAuth();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null); // { type: 'ok' | 'err', text }

  const save = async () => {
    setMsg(null);
    if (!currentPassword) {
      setMsg({ type: 'err', text: lang === 'fr' ? 'Entre ton mot de passe actuel pour confirmer.' : 'Enter your current password to confirm.' });
      return;
    }
    if (!newEmail && !newPassword) {
      setMsg({ type: 'err', text: lang === 'fr' ? "Rien à modifier pour l'instant." : 'Nothing to change yet.' });
      return;
    }
    setBusy(true);
    try {
      const body = { current_password: currentPassword };
      if (newEmail) body.new_email = newEmail;
      if (newPassword) body.new_password = newPassword;
      await api.put('/auth/security', body);
      setMsg({ type: 'ok', text: lang === 'fr' ? 'Modifications enregistrées.' : 'Changes saved.' });
      setCurrentPassword('');
      setNewEmail('');
      setNewPassword('');
    } catch (e) {
      const detail = e?.response?.data?.detail;
      setMsg({ type: 'err', text: detail || (lang === 'fr' ? 'Une erreur est survenue.' : 'Something went wrong.') });
    } finally {
      setBusy(false);
    }
  };

  const inputStyle = { background: 'var(--cream-card)', border: '1px solid var(--line)', color: 'var(--ink)' };

  return (
    <div className="px-6 pt-6 pb-28 space-y-6 animate-fade-up">
      <div className="flex items-center gap-3">
        <button onClick={() => go('accueil')} className="p-2 rounded-full border" style={{ borderColor: 'var(--line)', background: 'var(--cream-card)' }}>
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="font-display text-[24px]" style={{ color: 'var(--ink)' }}>
            {lang === 'fr' ? 'Profil & Compte' : 'Profile & Account'}
          </h1>
          <p className="font-body text-[12px]" style={{ color: 'var(--ink-faint)' }}>
            {lang === 'fr' ? 'Gère ton courriel et ton mot de passe' : 'Manage your email and password'}
          </p>
        </div>
      </div>

      <div className="p-4 rounded-[16px]" style={{ background: 'var(--cream-card)', border: '1px solid var(--line)' }}>
        <p className="font-body text-[11px] uppercase tracking-caps" style={{ color: 'var(--ink-faint)' }}>
          {lang === 'fr' ? 'Courriel actuel' : 'Current email'}
        </p>
        <p className="font-display text-[15px] mt-1" style={{ color: 'var(--ink)' }}>{user?.email}</p>
      </div>

      <div className="space-y-3">
        <label className="block">
          <span className="font-body text-[12px]" style={{ color: 'var(--ink-soft)' }}>
            {lang === 'fr' ? 'Nouveau courriel (optionnel)' : 'New email (optional)'}
          </span>
          <input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)}
            placeholder={user?.email || ''} className="w-full mt-1 p-3 rounded-[10px] font-body text-[14px] outline-none" style={inputStyle} />
        </label>

        <label className="block">
          <span className="font-body text-[12px]" style={{ color: 'var(--ink-soft)' }}>
            {lang === 'fr' ? 'Nouveau mot de passe (optionnel)' : 'New password (optional)'}
          </span>
          <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
            placeholder="••••••••" className="w-full mt-1 p-3 rounded-[10px] font-body text-[14px] outline-none" style={inputStyle} />
        </label>

        <label className="block">
          <span className="font-body text-[12px] font-medium" style={{ color: 'var(--ink)' }}>
            {lang === 'fr' ? 'Mot de passe actuel (obligatoire pour confirmer)' : 'Current password (required to confirm)'}
          </span>
          <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder="••••••••" className="w-full mt-1 p-3 rounded-[10px] font-body text-[14px] outline-none" style={inputStyle} />
        </label>
      </div>

      {msg && (
        <p className="font-body text-[13px]" style={{ color: msg.type === 'ok' ? 'var(--gold)' : '#c0392b' }}>
          {msg.text}
        </p>
      )}

      <button onClick={save} disabled={busy} className="gold-btn w-full rounded-[8px] py-3 font-body tracking-caps text-[11px] uppercase flex items-center justify-center gap-2">
        <Save size={16} />
        {busy ? (lang === 'fr' ? 'Enregistrement...' : 'Saving...') : (lang === 'fr' ? 'Enregistrer' : 'Save')}
      </button>
    </div>
  );
};

export default ProfileScreen;
