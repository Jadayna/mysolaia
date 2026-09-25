import React, { useState } from 'react';
import { ArrowLeft, Save, Trash2, AlertTriangle, RotateCcw, CreditCard, Layers, ChevronDown, ChevronUp } from 'lucide-react';
import { useT } from '../i18n';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import { isTimerFeedbackEnabled, setTimerFeedbackEnabled } from '../lib/timerFeedback';
import { getReminderSettings, saveReminderSettings, scheduleReminders, notificationPermission, requestNotificationPermission } from '../lib/reminders';
import { MAGASINS, CUSTOM_PREFIX, magasinLabel } from '../lib/magasins';

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
  const [prenom, setPrenom] = useState(user?.nom || '');
  const [skinType, setSkinType] = useState(user?.type_de_peau || '');
  const [sensibilite, setSensibilite] = useState(user?.sensibilite ?? 1);
  const [objectifs, setObjectifs] = useState(Array.isArray(user?.objectifs) ? user.objectifs : []);
  const [busyProfile, setBusyProfile] = useState(false);
  const [msgProfile, setMsgProfile] = useState(null);
  const [trackSkinFeel, setTrackSkinFeel] = useState(
    user?.track_skin_feel !== undefined ? user.track_skin_feel : true
  );

  // Étape 7 — Sons & vibrations des minuteurs (activé par défaut)
  const [timerFeedback, setTimerFeedback] = useState(isTimerFeedbackEnabled);

  // Rappels de routine (notifications locales)
  const [reminders, setReminders] = useState(getReminderSettings);
  const [notifPerm, setNotifPerm] = useState(notificationPermission());
  const updateReminders = (patch) => {
    const next = { ...reminders, ...patch };
    setReminders(next);
    saveReminderSettings(next);
    scheduleReminders(lang);
  };
  const enableReminders = async () => {
    const perm = await requestNotificationPermission();
    setNotifPerm(perm);
    updateReminders({ enabled: perm === 'granted' });
  };

  // --- Réinitialiser ---
  const [showReset, setShowReset] = useState(false);
  const [resetting, setResetting] = useState(false);

  // --- Vider l'étagère uniquement ---
  const [showClearShelf, setShowClearShelf] = useState(false);
  const [showSecurity, setShowSecurity] = useState(false);
  const [clearingShelf, setClearingShelf] = useState(false);

  // --- Suppression de compte ---
  const [showDelete, setShowDelete] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleting, setDeleting] = useState(false);

  const inputStyle = { background: 'var(--cream-card)', border: '1px solid var(--line)', color: 'var(--ink)' };

  const toggleGoal = (g) => {
    setObjectifs((prev) => (prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]));
  };

  // --- Magasins favoris (max 3) : proposés en premier au moment de racheter ---
  const [magasins, setMagasins] = useState(
    Array.isArray(user?.magasins_favoris) ? user.magasins_favoris.filter((m) => typeof m === 'string') : []
  );
  const [storeQuery, setStoreQuery] = useState('');
  const [storeOpen, setStoreOpen] = useState(false);

  // Normalise pour la recherche (insensible aux accents et aux majuscules)
  const norm = (t) => (t || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  const addMagasin = (id) => {
    if (magasins.length >= 3 || magasins.includes(id)) return;
    setMagasins((prev) => [...prev, id]);
    setStoreQuery('');
    setStoreOpen(false);
  };
  const addCustomMagasin = () => {
    const nom = storeQuery.trim();
    if (!nom || magasins.length >= 3) return;
    const exists = magasins.some((m) => norm(magasinLabel(m, lang)) === norm(nom));
    if (exists) return;
    setMagasins((prev) => [...prev, `${CUSTOM_PREFIX}${nom}`]);
    setStoreQuery('');
    setStoreOpen(false);
  };
  const storeMatches = MAGASINS.filter((m) => {
    if (magasins.includes(m.id)) return false;
    const q = norm(storeQuery.trim());
    if (!q) return true;
    return norm(m.fr).includes(q) || norm(m.en).includes(q);
  }).slice(0, 8);
  const removeMagasin = (id) => setMagasins((prev) => prev.filter((m) => m !== id));

  const saveProfile = async () => {
    setMsgProfile(null);
    setBusyProfile(true);
    try {
      await api.put('/auth/profile', {
        nom: prenom, // <--- AJOUTER CETTE LIGNE ICI
        type_de_peau: skinType || null,
        sensibilite: sensibilite,
        objectifs: objectifs,
        track_skin_feel: trackSkinFeel,
        magasins_favoris: magasins,
      });
      localStorage.setItem('solaia_track_skin', JSON.stringify(trackSkinFeel));
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

    const clearShelf = async () => {
    setClearingShelf(true);
    try {
      await api.delete('/shelf/clear');
      setShowClearShelf(false);
      // Redirection immédiate vers l'étagère fraîchement vidée
      if (go) go('scan');
    } catch (e) {
      alert(lang === 'fr' ? "Impossible de vider l'étagère." : 'Could not clear your shelf.');
    } finally {
      setClearingShelf(false);
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

      {/* Champ Prénom */}
        <div>
          <span className="font-body text-[11px] uppercase tracking-caps" style={{ color: 'var(--ink-faint)' }}>
            {lang === 'fr' ? 'Ton prénom' : 'First name'}
          </span>
       <input
          type="text"
          value={prenom}
          onChange={(e) => setPrenom(e.target.value)}
          className="w-full mt-1.5 p-3 rounded-[10px] font-body text-[14px] outline-none"
          style={inputStyle}
        />
        </div>

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

      {/* ===== Courriel & mot de passe (repliable) ===== */}
      <div className="p-4 rounded-[16px] space-y-3" style={{ background: 'var(--cream-card)', border: '1px solid var(--line)' }}>
        <button type="button" onClick={() => setShowSecurity(!showSecurity)} className="w-full flex items-center justify-between gap-2 text-left">
          <span>
            <span className="font-display text-[15px] block" style={{ color: 'var(--ink)' }}>
              {lang === 'fr' ? 'Courriel & mot de passe' : 'Email & password'}
            </span>
            <span className="font-body text-[11px] block mt-0.5" style={{ color: 'var(--ink-faint)' }}>{user?.email}</span>
          </span>
          {showSecurity
            ? <ChevronUp size={18} style={{ color: 'var(--ink-soft)' }} />
            : <ChevronDown size={18} style={{ color: 'var(--ink-soft)' }} />}
        </button>
        {showSecurity && (
          <>
            <p className="font-body text-[11px] leading-relaxed" style={{ color: 'var(--ink-soft)' }}>
              {lang === 'fr' ? 'Remplis uniquement ce que tu veux changer.' : 'Fill in only what you want to change.'}
            </p>
            <label className="block">
              <span className="font-body text-[12px]" style={{ color: 'var(--ink-soft)' }}>
                {lang === 'fr' ? 'Nouveau courriel' : 'New email'}
              </span>
              <input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)}
                placeholder={user?.email || ''} className="w-full mt-1 p-3 rounded-[10px] font-body text-[14px] outline-none" style={inputStyle} />
            </label>
            <label className="block">
              <span className="font-body text-[12px]" style={{ color: 'var(--ink-soft)' }}>
                {lang === 'fr' ? 'Nouveau mot de passe' : 'New password'}
              </span>
              <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••" className="w-full mt-1 p-3 rounded-[10px] font-body text-[14px] outline-none" style={inputStyle} />
            </label>
            <label className="block">
              <span className="font-body text-[12px] font-medium" style={{ color: 'var(--ink)' }}>
                {lang === 'fr' ? 'Mot de passe actuel (requis pour confirmer)' : 'Current password (required to confirm)'}
              </span>
              <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••" className="w-full mt-1 p-3 rounded-[10px] font-body text-[14px] outline-none" style={inputStyle} />
            </label>
            {msg && (
              <p className="font-body text-[13px]" style={{ color: msg.type === 'ok' ? 'var(--gold)' : '#c0392b' }}>{msg.text}</p>
            )}
            <button onClick={save} disabled={busy} className="gold-btn w-full rounded-[8px] py-3 font-body tracking-caps text-[11px] uppercase flex items-center justify-center gap-2">
              <Save size={16} />
              {busy ? (lang === 'fr' ? 'Enregistrement...' : 'Saving...') : (lang === 'fr' ? 'Enregistrer courriel / mot de passe' : 'Save email / password')}
            </button>
          </>
        )}
      </div>
      {/* ===== Préférences du journal ===== */}
      <div className="p-4 rounded-[16px] space-y-3" style={{ background: 'var(--cream-card)', border: '1px solid var(--line)' }}>
        <h2 className="font-display text-[15px]" style={{ color: 'var(--ink)' }}>
          {lang === 'fr' ? 'Préférences' : 'Preferences'}
        </h2>
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="font-body text-[13px] font-medium" style={{ color: 'var(--ink)' }}>
              {lang === 'fr' ? 'Évaluation du ressenti' : 'Track skin feel'}
            </p>
            <p className="font-body text-[11px]" style={{ color: 'var(--ink-soft)' }}>
              {lang === 'fr'
                ? 'Demander l’état de ta peau à la fin de chaque routine.'
                : 'Ask how your skin feels after each completed routine.'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              const next = !trackSkinFeel;
              setTrackSkinFeel(next);
              localStorage.setItem('solaia_track_skin', JSON.stringify(next));
            }}
            className="w-11 h-6 rounded-full transition-colors relative p-0.5 shrink-0"
            style={{ background: trackSkinFeel ? 'var(--gold)' : 'var(--line)' }}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white transition-transform ${
                trackSkinFeel ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="font-body text-[13px] font-medium" style={{ color: 'var(--ink)' }}>
              {lang === 'fr' ? 'Sons & vibrations des minuteurs' : 'Timer sounds & vibrations'}
            </p>
            <p className="font-body text-[11px]" style={{ color: 'var(--ink-soft)' }}>
              {lang === 'fr'
                ? 'Clochette douce et vibration à la fin de chaque minuteur.'
                : 'Gentle chime and vibration when each timer ends.'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              const next = !timerFeedback;
              setTimerFeedback(next);
              setTimerFeedbackEnabled(next);
            }}
            className="w-11 h-6 rounded-full transition-colors relative p-0.5 shrink-0"
            style={{ background: timerFeedback ? 'var(--gold)' : 'var(--line)' }}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white transition-transform ${
                timerFeedback ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
        {/* ===== Rappels de routine ===== */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="font-body text-[13px] font-medium" style={{ color: 'var(--ink)' }}>
              {lang === 'fr' ? 'Rappels de routine' : 'Routine reminders'}
            </p>
            <p className="font-body text-[11px]" style={{ color: 'var(--ink-soft)' }}>
              {lang === 'fr'
                ? 'Un doux rappel matin & soir — jamais si ta routine est déjà faite.'
                : 'A gentle morning & evening nudge — never if your routine is already done.'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => { reminders.enabled ? updateReminders({ enabled: false }) : enableReminders(); }}
            className="w-11 h-6 rounded-full transition-colors relative p-0.5 shrink-0"
            style={{ background: reminders.enabled ? 'var(--gold)' : 'var(--line)' }}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white transition-transform ${
                reminders.enabled ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
        {reminders.enabled && notifPerm !== 'granted' && (
          <button
            type="button"
            onClick={enableReminders}
            className="w-full py-2 rounded-[8px] font-body text-[11px] uppercase tracking-caps"
            style={{ background: 'rgba(182,130,53,0.12)', color: 'var(--gold)', border: '1px solid var(--gold-soft)' }}
          >
            {lang === 'fr' ? 'Autoriser les notifications' : 'Allow notifications'}
          </button>
        )}
        {reminders.enabled && (
          <div className="grid grid-cols-2 gap-3 pt-1">
            <label className="block">
              <span className="font-body text-[11px] uppercase tracking-caps" style={{ color: 'var(--ink-faint)' }}>
                {lang === 'fr' ? 'Matin' : 'Morning'}
              </span>
              <input
                type="time"
                value={reminders.morning}
                onChange={(e) => updateReminders({ morning: e.target.value })}
                className="mt-1 w-full px-3 py-2 rounded-[8px] font-body text-[13px] tnum"
                style={{ background: '#fff', border: '1px solid var(--line)', color: 'var(--ink)' }}
              />
            </label>
            <label className="block">
              <span className="font-body text-[11px] uppercase tracking-caps" style={{ color: 'var(--ink-faint)' }}>
                {lang === 'fr' ? 'Soir' : 'Evening'}
              </span>
              <input
                type="time"
                value={reminders.evening}
                onChange={(e) => updateReminders({ evening: e.target.value })}
                className="mt-1 w-full px-3 py-2 rounded-[8px] font-body text-[13px] tnum"
                style={{ background: '#fff', border: '1px solid var(--line)', color: 'var(--ink)' }}
              />
            </label>
          </div>
        )}
      </div>

            {/* ===== Mes magasins favoris ===== */}
      <div className="p-4 rounded-[16px] space-y-3" style={{ background: 'var(--cream-card)', border: '1px solid var(--line)' }}>
        <h2 className="font-display text-[15px]" style={{ color: 'var(--ink)' }}>
          {lang === 'fr' ? 'Mes magasins favoris' : 'My favourite stores'}
        </h2>
        <p className="font-body text-[11px] leading-relaxed" style={{ color: 'var(--ink-soft)' }}>
          {lang === 'fr'
            ? `Choisis jusqu'à 3 magasins — tape un nom, choisis dans les suggestions. (${magasins.length}/3)`
            : `Pick up to 3 stores — type a name, pick from the suggestions. (${magasins.length}/3)`}
        </p>
        {magasins.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {magasins.map((m) => (
              <span key={m} className="pl-3 pr-1.5 py-1 rounded-full font-body text-[12px] flex items-center gap-1"
                style={{ background: 'var(--gold)', color: '#fff', border: '1px solid var(--gold)' }}>
                {magasinLabel(m, lang)}
                <button type="button" onClick={() => removeMagasin(m)}
                  className="w-5 h-5 rounded-full font-bold leading-none" style={{ background: 'rgba(255,255,255,0.25)' }}
                  aria-label={lang === 'fr' ? 'Retirer' : 'Remove'}>
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
        {magasins.length < 3 && (
          <div className="relative">
            <input
              type="text"
              value={storeQuery}
              onChange={(e) => { setStoreQuery(e.target.value); setStoreOpen(true); }}
              onFocus={() => setStoreOpen(true)}
              onBlur={() => setTimeout(() => setStoreOpen(false), 150)}
              placeholder={lang === 'fr' ? 'Tape le nom d\u2019un magasin\u2026' : 'Type a store name\u2026'}
              className="w-full p-2.5 rounded-[10px] font-body text-[13px] outline-none"
              style={inputStyle}
            />
            {storeOpen && (
              <div className="absolute left-0 right-0 mt-1 rounded-[10px] z-20 max-h-56 overflow-y-auto"
                style={{ background: '#fff', border: '1px solid var(--line)', boxShadow: '0 8px 24px rgba(0,0,0,0.08)' }}>
                {storeMatches.map((m) => (
                  <button key={m.id} type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => addMagasin(m.id)}
                    className="w-full text-left px-3.5 py-2.5 font-body text-[13px] active:bg-black/5"
                    style={{ color: 'var(--ink)', borderBottom: '1px solid var(--line)' }}>
                    {lang === 'fr' ? m.fr : m.en}
                  </button>
                ))}
                {storeQuery.trim() !== '' && (
                  <button type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={addCustomMagasin}
                    className="w-full text-left px-3.5 py-2.5 font-body text-[13px] font-semibold"
                    style={{ color: 'var(--gold)' }}>
                    {lang === 'fr' ? `Ajouter \u00ab ${storeQuery.trim()} \u00bb` : `Add \u201c${storeQuery.trim()}\u201d`}
                  </button>
                )}
              </div>
            )}
          </div>
        )}
        {msgProfile && (
          <p className="font-body text-[13px]" style={{ color: msgProfile.type === 'ok' ? 'var(--gold)' : '#c0392b' }}>{msgProfile.text}</p>
        )}
        <button onClick={saveProfile} disabled={busyProfile} className="gold-btn w-full rounded-[8px] py-3 font-body tracking-caps text-[11px] uppercase flex items-center justify-center gap-2">
          <Save size={16} />
          {busyProfile ? (lang === 'fr' ? 'Enregistrement...' : 'Saving...') : (lang === 'fr' ? 'Enregistrer mes magasins' : 'Save my stores')}
        </button>
      </div>
{/* ===== Vider mon étagère ===== */}
      <div className="p-4 rounded-[16px] space-y-3" style={{ background: 'var(--cream-card)', border: '1px solid var(--line)' }}>
        <div className="flex items-center gap-2">
          <Layers size={16} style={{ color: 'var(--ink)' }} />
          <h2 className="font-display text-[15px]" style={{ color: 'var(--ink)' }}>
            {lang === 'fr' ? 'Vider mon étagère' : 'Clear my shelf'}
          </h2>
        </div>
        <p className="font-body text-[12px]" style={{ color: 'var(--ink-soft)' }}>
          {lang === 'fr'
            ? 'Retire tous les produits de ton étagère tout en conservant tes notes et ton journal.'
            : 'Removes all products from your shelf while keeping your notes and journal history.'}
        </p>

        {!showClearShelf ? (
          <button onClick={() => setShowClearShelf(true)} className="w-full rounded-[8px] py-2.5 font-body tracking-caps text-[11px] uppercase" style={{ background: '#fff', border: '1px solid var(--line)', color: 'var(--ink)' }}>
            {lang === 'fr' ? 'Vider mon étagère' : 'Clear shelf'}
          </button>
        ) : (
          <div className="flex gap-2">
            <button onClick={() => setShowClearShelf(false)} className="flex-1 rounded-[8px] py-2.5 font-body tracking-caps text-[11px] uppercase" style={{ background: '#fff', border: '1px solid var(--line)', color: 'var(--ink-soft)' }}>
              {lang === 'fr' ? 'Annuler' : 'Cancel'}
            </button>
            <button onClick={clearShelf} disabled={clearingShelf} className="flex-1 rounded-[8px] py-2.5 font-body tracking-caps text-[11px] uppercase text-white" style={{ background: 'var(--ink)' }}>
              {clearingShelf ? (lang === 'fr' ? 'En cours...' : 'Clearing...') : (lang === 'fr' ? 'Confirmer' : 'Confirm')}
            </button>
          </div>
        )}
      </div>

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
