import React, { useCallback, useEffect, useState } from 'react';
import { ArrowLeft, Copy, Check, UserPlus, X, Flame, ChevronRight } from 'lucide-react';
import { useT } from '../i18n';
import api from '../lib/api';

// Temps restant avant expiration d'un Wizz (format doux)
const timeLeft = (expiresAt, lang) => {
  const ms = new Date(expiresAt).getTime() - Date.now();
  if (ms <= 0) return lang === 'fr' ? 'expiré' : 'expired';
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  if (lang === 'fr') return h > 0 ? `${h}h ${m}min` : `${m} min`;
  return h > 0 ? `${h}h ${m}m` : `${m} min`;
};

const CircleScreen = ({ go }) => {
  const { lang } = useT();
  const fr = lang === 'fr';
  const [circle, setCircle] = useState(null);
  const [joinCode, setJoinCode] = useState('');
  const [showJoin, setShowJoin] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);
  const [copied, setCopied] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(null);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get('/circle');
      setCircle(data);
    } catch (e) {
      console.error('cercle:', e.message);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const flash = (type, text) => {
    setMsg({ type, text });
    setTimeout(() => setMsg(null), 4000);
  };

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(circle.invite_code);
    } catch {
      const el = document.getElementById('invite-code');
      if (el) {
        const r = document.createRange();
        r.selectNode(el);
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(r);
      }
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleJoin = async () => {
    if (!joinCode.trim() || busy) return;
    setBusy(true);
    try {
      const { data } = await api.post('/circle/join', { code: joinCode.trim() });
      flash('ok', fr ? `${data.friend_nom || 'Ton amie'} a rejoint ton cercle 💛` : `${data.friend_nom || 'Your friend'} joined your circle 💛`);
      setJoinCode('');
      setShowJoin(false);
      load();
    } catch (e) {
      flash('err', e?.response?.data?.detail || (fr ? "Code invalide." : 'Invalid code.'));
    } finally {
      setBusy(false);
    }
  };

  const handleRemove = async (fid) => {
    if (confirmRemove !== fid) {
      setConfirmRemove(fid);
      setTimeout(() => setConfirmRemove((v) => (v === fid ? null : v)), 4000);
      return;
    }
    try {
      await api.delete(`/circle/friends/${fid}`);
      setConfirmRemove(null);
      flash('ok', fr ? 'Amie retirée de ton cercle.' : 'Friend removed from your circle.');
      load();
    } catch (e) {
      flash('err', fr ? 'Impossible pour le moment.' : 'Could not remove right now.');
    }
  };

  const handleWizz = async (f) => {
    if (f.wizz_cooldown) return;
    try {
      await api.post(`/circle/wizz/${f.user_id}`);
      flash('ok', fr ? `Wizz envoyé à ${f.nom} 💫` : `Wizz sent to ${f.nom} 💫`);
      load();
    } catch (e) {
      flash('err', e?.response?.data?.detail || (fr ? 'Impossible pour le moment.' : 'Could not send right now.'));
      load();
    }
  };

  const friends = circle?.friends || [];
  const pendingWizz = (circle?.wizz_received || []).filter((w) => !w.responded && !w.expired);

  return (
    <div className="px-6 pt-6 pb-28 space-y-6 animate-fade-up">
      {/* En-tête */}
      <div className="flex items-center gap-3">
        <button onClick={() => go('accueil')} className="p-2 rounded-full border" style={{ borderColor: 'var(--line)', background: 'var(--cream-card)' }}>
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="font-display text-[24px]" style={{ color: 'var(--ink)' }}>
            {fr ? 'Mon Cercle' : 'My Circle'}
          </h1>
          <p className="font-body text-[12px]" style={{ color: 'var(--ink-faint)' }}>
            {fr ? 'La routine est plus fun à plusieurs 💛' : 'Routines are more fun together 💛'}
          </p>
        </div>
      </div>

      {/* Message */}
      {msg && (
        <div className="p-3.5 rounded-[14px] font-body text-[12.5px] animate-fade-up"
          style={msg.type === 'ok'
            ? { background: 'rgba(182,130,53,0.12)', border: '1px solid var(--gold-soft)', color: 'var(--ink)' }
            : { background: 'rgba(192,57,43,0.07)', border: '1px solid rgba(192,57,43,0.3)', color: '#c0392b' }}>
          {msg.text}
        </div>
      )}

      {/* Code de parrainage */}
      <div className="p-5 rounded-[20px] text-center space-y-2" style={{ background: 'var(--cream-card)', border: '1px solid var(--gold-soft)' }}>
        <p className="font-body text-[10px] uppercase tracking-caps" style={{ color: 'var(--ink-faint)' }}>
          {fr ? 'Ton code de parrainage' : 'Your referral code'}
        </p>
        <p id="invite-code" className="font-display text-[26px] tracking-wide" style={{ color: 'var(--gold)' }}>
          {circle?.invite_code || '…'}
        </p>
        <p className="font-body text-[11.5px]" style={{ color: 'var(--ink-soft)' }}>
          {fr
            ? `${circle?.invites_remaining ?? '…'} invitations restantes — +1 par amie parrainée qui s'abonne`
            : `${circle?.invites_remaining ?? '…'} invites left — +1 per referred friend who subscribes`}
        </p>
        <div className="flex gap-2 pt-1">
          <button onClick={copyCode}
            className="flex-1 py-2.5 rounded-[12px] flex items-center justify-center gap-2 font-body text-[11px] uppercase tracking-caps font-semibold text-white active:scale-[0.98] transition-all"
            style={{ background: '#A37B68' }}>
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? (fr ? 'Copié !' : 'Copied!') : (fr ? 'Copier' : 'Copy')}
          </button>
          <button onClick={() => setShowJoin((v) => !v)}
            className="flex-1 py-2.5 rounded-[12px] flex items-center justify-center gap-2 font-body text-[11px] uppercase tracking-caps font-semibold active:scale-[0.98] transition-all"
            style={{ background: 'transparent', border: '1px solid #A37B68', color: '#A37B68' }}>
            <UserPlus size={14} />
            {fr ? 'Rejoindre' : 'Join'}
          </button>
        </div>
        {showJoin && (
          <div className="flex gap-2 pt-1 animate-fade-up">
            <input
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              placeholder="SOLAIA-XXXXXX"
              className="flex-1 p-2.5 rounded-[10px] font-body text-[14px] outline-none uppercase text-center tracking-widest"
              style={{ background: '#fff', border: '1px solid var(--line)', color: 'var(--ink)' }}
            />
            <button onClick={handleJoin} disabled={busy}
              className="px-5 rounded-[10px] font-body text-[12px] uppercase tracking-caps font-semibold text-white"
              style={{ background: 'var(--gold)' }}>
              OK
            </button>
          </div>
        )}
      </div>

      {/* Wizz reçus */}
      {pendingWizz.length > 0 && (
        <div className="space-y-2">
          {pendingWizz.map((w) => (
            <div key={w.id} className="p-4 rounded-[16px] flex items-center gap-3 animate-fade-up"
              style={{ background: 'rgba(182,130,53,0.1)', border: '1px solid var(--gold-soft)' }}>
              <span className="text-[22px]">💫</span>
              <div className="flex-1">
                <p className="font-body text-[13px] font-medium" style={{ color: 'var(--ink)' }}>
                  {fr ? `${w.from_nom} t'a envoyé un Wizz !` : `${w.from_nom} sent you a Wizz!`}
                </p>
                <p className="font-body text-[11px]" style={{ color: 'var(--ink-soft)' }}>
                  {fr ? `Réponds avec une routine complétée — reste ${timeLeft(w.expires_at, lang)}` : `Answer with a completed routine — ${timeLeft(w.expires_at, lang)} left`}
                </p>
              </div>
              <button onClick={() => go('routine')}
                className="p-2 rounded-full shrink-0" style={{ background: 'var(--gold)', color: '#fff' }}>
                <ChevronRight size={16} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Mes amies */}
      <div className="space-y-3">
        <h2 className="font-display text-[17px]" style={{ color: 'var(--ink)' }}>
          {fr ? 'Mes amies' : 'My friends'}
          <span className="font-body text-[12px] ml-2" style={{ color: 'var(--ink-faint)' }}>({friends.length})</span>
        </h2>

        {friends.length === 0 ? (
          <div className="p-5 rounded-[16px] text-center" style={{ background: 'var(--cream-card)', border: '1px solid var(--line)' }}>
            <p className="font-body text-[13px]" style={{ color: 'var(--ink-soft)' }}>
              {fr
                ? 'Ton cercle est encore vide. Partage ton code à une amie pour commencer 💛'
                : 'Your circle is still empty. Share your code with a friend to begin 💛'}
            </p>
          </div>
        ) : friends.map((f) => (
          <div key={f.user_id} className="p-4 rounded-[16px] space-y-3" style={{ background: 'var(--cream-card)', border: '1px solid var(--line)' }}>
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full flex items-center justify-center font-display text-[18px] shrink-0"
                style={{ background: 'rgba(182,130,53,0.15)', color: 'var(--gold)' }}>
                {(f.nom || '?')[0].toUpperCase()}
              </div>
              <div className="flex-1">
                <p className="font-display text-[15px] font-medium" style={{ color: 'var(--ink)' }}>
                  {f.nom}
                  {f.is_premium && <span className="ml-1.5 text-[13px]">✨</span>}
                </p>
                <p className="font-body text-[11.5px]" style={{ color: 'var(--ink-soft)' }}>
                  {f.streak > 0
                    ? `🔥 ${f.streak} ${fr ? (f.streak > 1 ? 'jours de suite' : 'jour de suite') : (f.streak > 1 ? 'day streak' : 'day streak')}`
                    : (fr ? 'Pas encore de série' : 'No streak yet')}
                  {f.done_today && <span style={{ color: 'var(--gold)' }}> · {fr ? "routine faite aujourd'hui ✓" : 'routine done today ✓'}</span>}
                </p>
              </div>
              {f.wizz_pending && <span className="text-[18px]" title="Wizz reçu">💫</span>}
            </div>

            {/* Timeline 7 derniers jours */}
            {Array.isArray(f.week) && (
              <div className="flex items-center gap-1.5">
                {f.week.map((d, i) => (
                  <div key={i} title={d.d}
                    className="w-6 h-6 rounded-full flex items-center justify-center text-[10px]"
                    style={d.done
                      ? { background: 'rgba(182,130,53,0.2)', color: 'var(--gold)' }
                      : { background: 'var(--cream)', border: '1px solid var(--line)', color: 'transparent' }}>
                    {d.done ? '✓' : '·'}
                  </div>
                ))}
                <span className="font-body text-[10px] ml-1" style={{ color: 'var(--ink-faint)' }}>
                  {fr ? '7 derniers jours' : 'Last 7 days'}
                </span>
              </div>
            )}

            <div className="flex gap-2">
              <button onClick={() => handleWizz(f)} disabled={f.wizz_cooldown}
                className="flex-1 py-2 rounded-[10px] font-body text-[11px] uppercase tracking-caps font-semibold transition-all active:scale-[0.98]"
                style={f.wizz_cooldown
                  ? { background: 'transparent', border: '1px solid var(--line)', color: 'var(--ink-faint)', opacity: 0.6 }
                  : { background: 'rgba(182,130,53,0.12)', border: '1px solid var(--gold-soft)', color: 'var(--gold)' }}>
                💫 {f.wizz_cooldown ? (fr ? 'Wizz envoyé' : 'Wizz sent') : 'Wizz'}
              </button>
              <button onClick={() => handleRemove(f.user_id)}
                className="px-4 py-2 rounded-[10px] font-body text-[11px] uppercase tracking-caps font-medium transition-all active:scale-[0.98]"
                style={confirmRemove === f.user_id
                  ? { background: '#c0392b', color: '#fff', border: '1px solid #c0392b' }
                  : { background: 'transparent', border: '1px solid var(--line)', color: 'var(--ink-faint)' }}>
                {confirmRemove === f.user_id
                  ? (fr ? 'Confirmer ?' : 'Confirm?')
                  : (fr ? 'Retirer' : 'Remove')}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CircleScreen;
