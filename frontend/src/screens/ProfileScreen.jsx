import React, { useState } from 'react';
import { ArrowLeft, Save, Trash2, AlertTriangle, RotateCcw, CreditCard } from 'lucide-react';
import { useT } from '../i18n';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';

const SKIN_TYPES = [
  { value: 'seche', fr: 'Sèche', en: 'Dry' },
  { value: 'normale', fr: 'Normale', en: 'Normal' },
  { value: 'mixte', fr: 'Mixte', en: 'Combination' },
  { value: 'grasse', fr: 'Grasse', en: 'Oily' },
  { value: 'sensible', fr: 'Sensible', en: 'Sensitive' },
];

const SENSITIVITY = [
  { value: 1, fr: 'Faible', en: 'Low' },
  { value: 2, fr: 'Moyenne', en: 'Medium' },
  { value: 3, fr: 'Élevée', en: 'High' },
];

const GOALS = [
  { value: 'hydratation', fr: 'Hydratation', en: 'Hydration' },
  { value: 'anti_age', fr: 'Anti-âge', en: 'Anti-aging' },
  { value: 'taches', fr: 'Anti-taches', en: 'Dark spots' },
  { value: 'acne', fr: 'Acné', en: 'Acne' },
  { value: 'imperfections', fr: 'Anti-imperfections', en: 'Blemishes' },
  { value: 'eclat', fr: 'Éclat', en: 'Radiance' },
  { value: 'apaiser', fr: 'Apaiser', en: 'Soothing' },
];

const ProfileScreen = ({ go }) => {
  const { lang } = useT();
  const { user, logout } = useAuth();

  const hasActiveSub = user?.is_premium || user?.statut_abonnement === 'actif';

  // --- Sécurité (courriel / mot de passe) ---
  const [currentPassword, setCurrentPassword] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);

  // --- Infos perso ---
  const [skinType, setSkinType] = useState(user?.type_de_peau || '');
  const [sensibilite, setSensibilite] = useState(user?.sensibilite ?? 1);
  const [objectifs, setObjectifs] = useState(Array.isArray(user?.objectifs) ? user.objectifs : []);
  const [busyProfile, setBusyProfile] = useState(false);
  const [msgProfile, setMsgProfile] = useState(null);

  // --- Réinitialiser ---
  const [showReset, setShowReset] = useState(false);
  const [resetting, setResetting] = useState(false);

  // --- Suppression de compte ---
  const [showDelete, setShowDelete] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleting, setDeleting] = useState(false);

  const inputStyle = { background: 'var(--cream-card)', border: '1px solid var(--line)', color: 'var(--ink)' };

  const toggleGoal = (g) => {
    setObjectifs((prev) => (prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]));
  };

  const saveProfile = async () => {
    setMsgProfile(null);
    setBusyProfile(true);
    try {
      await api.put('/auth/profile', {
        type_de_peau: skinType || null,
        sensibilite: sensibilite,
        objectifs: objectifs,
      });
      setMsgProfile({ type: 'ok', text: lang === 'fr' ? 'Profil enregistré.' : 'Profile saved.' });
    } catch (e) {
      const detail = e?.response?.data?.detail;
      setMsgProfile({ type: 'err', text: detail || (lang === 'fr' ? 'Une erreur est survenue.' : 'Something went wrong.') });
    } finally {
      setBusyProfile(false);
    }
  };

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

  const resetData = async () => {
    setResetting(true);
    try {
      await api.post('/auth/reset-data');
      setShowReset(false);
      alert(lang === 'fr' ? 'Tes données ont été réinitialisées.' : 'Your data has been reset.');
    } catch (e) {
      alert(lang === 'fr' ? 'Impossible de réinitialiser tes données.' : 'Could not reset your data.');
    } finally {
      setResetting(false);
    }
  };

  const deleteAccount = async () => {
    if (!deletePassword) {
      alert(lang === 'fr' ? 'Entre ton mot de passe pour confirmer.' : 'Enter your password to confirm.');
      return;
    }
    setDeleting(true);
    try {
      await api.post('/auth/delete-account', { current_password: deletePassword });
      logout();
    } catch (e) {
      const detail = e?.response?.data?.detail;
      alert(detail || (lang === 'fr' ? 'Impossible de supprimer le compte.' : 'Could not delete the account.'));
      setDeleting(false);
    }
  };

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
            {lang === 'fr' ? 'Gère tes infos, ton courriel et ton mot de passe' : 'Manage your info, email and password'}
          </p>
        </div>
      </div>

      {/* ===== Infos perso ===== */}
      <div className="p-4 rounded-[16px] space-y-4" style={{ background: 'var(--cream-card)', border: '1px solid var(--line)' }}>
        <h2 className="font-display text-[16px]" style={{ color: 'var(--ink)' }}>
          {lang === 'fr' ? 'Ma peau' : 'My skin'}
        </h2>

        <div>
          <span className="font-body text-[11px] uppercase tracking-caps" style={{ color: 'var(--ink-faint)' }}>{lang === 'fr' ? 'Type de peau' : 'Skin type'}</span>
          <div className="flex flex-wrap gap-2 mt-2">
            {SKIN_TYPES.map((s) => {
              const on = skinType === s.value;
              return (
                <button key={s.value} onClick={() => setSkinType(s.value)} className="px-3 py-1.5 rounded-full font-body text-[12px] transition-all" style={on ? { background: 'var(--gold)', color: '#fff', border: '1px solid var(--gold)' } : { background: '#fff', color: 'var(--ink-soft)', border: '1px solid var(--line)' }}>
                  {lang === 'fr' ? s.fr : s.en}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <span className="font-body text-[11px] uppercase tracking-caps" style={{ color: 'var(--ink-faint)' }}>{lang === 'fr' ? 'Sensibilité' : 'Sensitivity'}</span>
          <div className="flex flex-wrap gap-2 mt-2">
            {SENSITIVITY.map((s) => {
              const on = sensibilite === s.value;
              return (
                <button key={s.value} onClick={() => setSensibilite(s.value)} className="px-3 py-1.5 rounded-full font-body text-[12px] transition-all" style={on ? { background: 'var(--gold)', color: '#fff', border: '1px solid var(--gold)' } : { background: '#fff', color: 'var(--ink-soft)', border: '1px solid var(--line)' }}>
                  {lang === 'fr' ? s.fr : s.en}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <span className="font-body text-[11px] uppercase tracking-caps" style={{ color: 'var(--ink-faint)' }}>{lang === 'fr' ? 'Objectifs' : 'Goals'}</span>
          <div className="flex flex-wrap gap-2 mt-2">
            {GOALS.map((g) => {
              const on = objectifs.includes(g.value);
              return (
                <button key={g.value} onClick={() => toggleGoal(g.value)} className="px-3 py-1.5 rounded-full font-body text-[12px] transition-all" style={on ? { background: 'var(--gold)', color: '#fff', border: '1px solid var(--gold)' } : { background: '#fff', color: 'var(--ink-soft)', border: '1px solid var(--line)' }}>
                  {lang === 'fr' ? g.fr : g.en}
                </button>
              );
            })}
          </div>
        </div>

        {msgProfile && (
          <p className="font-body text-[13px]" style={{ color: msgProfile.type === 'ok' ? 'var(--gold)' : '#c0392b' }}>{msgProfile.text}</p>
        )}

        <button onClick={saveProfile} disabled={busyProfile} className="gold-btn w-full rounded-[8px] py-3 font-body tracking-caps text-[11px] uppercase flex items-center justify-center gap-2">
          <Save size={16} />
          {busyProfile ? (lang === 'fr' ? 'Enregistrement...' : 'Saving...') : (lang === 'fr' ? 'Enregistrer ma peau' : 'Save my skin')}
        </button>
      </div>

      {/* ===== Courriel actuel ===== */}
      <div className="p-4 rounded-[16px]" style={{ background: 'var(--cream-card)', border: '1px solid var(--line)' }}>
        <p className="font-body text-[11px] uppercase tracking-caps" style={{ color: 'var(--ink-faint)' }}>
          {lang === 'fr' ? 'Courriel actuel' : 'Current email'}
        </p>
        <p className="font-display text-[15px] mt-1" style={{ color: 'var(--ink)' }}>{user?.email}</p>
      </div>

      {/* ===== Sécurité ===== */}
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
        {busy ? (lang === 'fr' ? 'Enregistrement...' : 'Saving...') : (lang === 'fr' ? 'Enregistrer courriel / mot de passe' : 'Save email / password')}
      </button>

      {/* ===== Réinitialiser mes données ===== */}
      <div className="p-4 rounded-[16px] space-y-3" style={{ background: 'rgba(182,130,53,0.06)', border: '1px solid var(--gold-soft)' }}>
        <div className="flex items-center gap-2">
          <RotateCcw size={16} style={{ color: 'var(--gold)' }} />
          <h2 className="font-display text-[15px]" style={{ color: 'var(--ink)' }}>
            {lang === 'fr' ? 'Réinitialiser mes données' : 'Reset my data'}
          </h2>
        </div>
        <p className="font-body text-[12px]" style={{ color: 'var(--ink-soft)' }}>
          {lang === 'fr'
            ? 'Efface tous tes produits et ton journal, mais garde ton compte.'
            : 'Erases all your products and journal, but keeps your account.'}
        </p>

        {!showReset ? (
          <button onClick={() => setShowReset(true)} className="w-full rounded-[8px] py-2.5 font-body tracking-caps text-[11px] uppercase" style={{ background: 'transparent', border: '1px solid var(--gold)', color: 'var(--gold)' }}>
            {lang === 'fr' ? 'Réinitialiser' : 'Reset'}
          </button>
        ) : (
          <div className="flex gap-2">
            <button onClick={() => setShowReset(false)} className="flex-1 rounded-[8px] py-2.5 font-body tracking-caps text-[11px] uppercase" style={{ background: '#fff', border: '1px solid var(--line)', color: 'var(--ink-soft)' }}>
              {lang === 'fr' ? 'Annuler' : 'Cancel'}
            </button>
            <button onClick={resetData} disabled={resetting} className="flex-1 gold-btn rounded-[8px] py-2.5 font-body tracking-caps text-[11px] uppercase">
              {resetting ? (lang === 'fr' ? 'En cours...' : 'Resetting...') : (lang === 'fr' ? 'Confirmer' : 'Confirm')}
            </button>
          </div>
        )}
      </div>

      {/* ===== Zone de danger : supprimer le compte ===== */}
      <div className="p-4 rounded-[16px] space-y-3" style={{ background: 'rgba(192,57,43,0.05)', border: '1px solid rgba(192,57,43,0.3)' }}>
        <div className="flex items-center gap-2">
          <AlertTriangle size={16} style={{ color: '#c0392b' }} />
          <h2 className="font-display text-[15px]" style={{ color: '#c0392b' }}>
            {lang === 'fr' ? 'Supprimer mon compte' : 'Delete my account'}
          </h2>
        </div>
        <p className="font-body text-[12px]" style={{ color: 'var(--ink-soft)' }}>
          {lang === 'fr'
            ? 'Cette action est définitive. Ton compte, tes produits et ton journal seront effacés.'
            : 'This action is permanent. Your account, products and journal will be erased.'}
        </p>

        {hasActiveSub ? (
          <div className="space-y-2.5">
            <p className="font-body text-[12px] font-medium" style={{ color: '#c0392b' }}>
              {lang === 'fr'
                ? 'Annule ton abonnement avant de supprimer ton compte.'
                : 'Cancel your subscription before deleting your account.'}
            </p>
            <button onClick={() => go('trial')} className="w-full rounded-[8px] py-2.5 font-body tracking-caps text-[11px] uppercase flex items-center justify-center gap-2" style={{ background: 'transparent', border: '1px solid #c0392b', color: '#c0392b' }}>
              <CreditCard size={15} />
              {lang === 'fr' ? 'Gérer mon abonnement' : 'Manage my subscription'}
            </button>
          </div>
        ) : !showDelete ? (
          <button onClick={() => setShowDelete(true)} className="w-full rounded-[8px] py-2.5 font-body tracking-caps text-[11px] uppercase flex items-center justify-center gap-2" style={{ background: 'transparent', border: '1px solid #c0392b', color: '#c0392b' }}>
            <Trash2 size={15} />
            {lang === 'fr' ? 'Supprimer mon compte' : 'Delete my account'}
          </button>
        ) : (
          <div className="space-y-2.5">
            <input type="password" value={deletePassword} onChange={(e) => setDeletePassword(e.target.value)}
              placeholder={lang === 'fr' ? 'Ton mot de passe' : 'Your password'}
              className="w-full p-3 rounded-[10px] font-body text-[14px] outline-none" style={{ background: '#fff', border: '1px solid rgba(192,57,43,0.4)', color: 'var(--ink)' }} />
            <div className="flex gap-2">
              <button onClick={() => { setShowDelete(false); setDeletePassword(''); }} className="flex-1 rounded-[8px] py-2.5 font-body tracking-caps text-[11px] uppercase" style={{ background: '#fff', border: '1px solid var(--line)', color: 'var(--ink-soft)' }}>
                {lang === 'fr' ? 'Annuler' : 'Cancel'}
              </button>
              <button onClick={deleteAccount} disabled={deleting} className="flex-1 rounded-[8px] py-2.5 font-body tracking-caps text-[11px] uppercase text-white" style={{ background: '#c0392b' }}>
                {deleting ? (lang === 'fr' ? 'Suppression...' : 'Deleting...') : (lang === 'fr' ? 'Confirmer' : 'Confirm')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfileScreen;
