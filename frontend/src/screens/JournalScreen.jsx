import React, { useEffect, useState } from 'react';
import { Calendar, CalendarDays, Flame, Package, Camera, Trash2, Plus, X, Award, ShieldCheck, Lock, Sparkles, TrendingUp, TrendingDown, Minus, Share2, ArrowLeftRight } from 'lucide-react';
import api from '../lib/api';
import { useT } from '../i18n';
import { useAuth } from '../context/AuthContext';
import { shareVictory } from '../lib/shareCard';


// Carte badge réutilisable (vedettes + modales)
const BadgeCard = ({ badge, large }) => (
  <div
    className={`rounded-[16px] border transition-all ${
      large ? 'flex flex-col items-center text-center p-3 gap-1.5' : 'flex items-center gap-2.5 p-3'
    } ${badge.unlocked ? 'bg-white shadow-xs border-amber-200' : 'bg-stone-100/50 border-stone-200 opacity-60'}`}
  >
    <div
      className={`${large ? 'w-12 h-12 text-[22px]' : 'w-10 h-10 text-[18px]'} rounded-[12px] flex items-center justify-center shrink-0 ${
        badge.unlocked ? 'bg-amber-50 shadow-xs' : 'bg-stone-200/60 grayscale'
      }`}
    >
      {badge.icon}
    </div>
    <div className={large ? '' : 'flex-1 min-w-0 text-left'}>
      <p
        className={`font-display font-semibold ${large ? 'text-[11px] leading-tight' : 'text-[12.5px] truncate'}`}
        style={{ color: badge.unlocked ? 'var(--ink)' : 'var(--ink-soft)' }}
      >
        {badge.title}
      </p>
      <p className={`font-body text-[10px] text-stone-500 ${large ? 'leading-tight' : 'truncate'}`}>
        {badge.desc}
      </p>
    </div>
  </div>
);

// Définition des badges — rank = prestige (≈ ordre de déblocage : les plus exigeants arrivent en dernier)
const buildBadges = ({ entries, streak, shelfCount, skinPhotos, lang }) => {
  const fr = lang === 'fr';
  const morningCount = entries.filter((e) => { const t = (e.title || '').toLowerCase(); return t.includes('matin') || t.includes('jour') || t.includes('day'); }).length;
  const eveningCount = entries.filter((e) => { const t = (e.title || '').toLowerCase(); return t.includes('soir') || t.includes('evening'); }).length;
  return [
    { id: 'first', icon: '🌱', rank: 1, title: fr ? 'Première Lueur' : 'First Glow', desc: fr ? '1ère routine validée' : '1st completed routine', unlocked: entries.length >= 1 },
    { id: 'selfie', icon: '📸', rank: 2, title: fr ? 'Miroir du Temps' : 'Time Mirror', desc: fr ? '1er selfie de peau' : '1st skin photo saved', unlocked: skinPhotos.length >= 1 },
    { id: 'shelf', icon: '🧴', rank: 3, title: fr ? 'Armoire de Soins' : 'Skincare Shelf', desc: fr ? '5 flacons ordonnés' : '5 products organized', unlocked: shelfCount >= 5 },
    { id: 'sun', icon: '☀️', rank: 4, title: fr ? 'Bouclier UV' : 'UV Shield', desc: fr ? '3 routines du matin' : '3 morning routines', unlocked: morningCount >= 3 },
    { id: 'streak3', icon: '🔥', rank: 5, title: fr ? 'Rythme Solaire' : 'Solar Rhythm', desc: fr ? '3 jours consécutifs' : '3 days in a row', unlocked: streak >= 3 },
    { id: 'moon', icon: '🌙', rank: 6, title: fr ? 'Reine de la Nuit' : 'Night Queen', desc: fr ? '5 routines du soir' : '5 evening routines', unlocked: eveningCount >= 5 },
    { id: 'streak7', icon: '👑', rank: 7, title: fr ? "Constance d'Or" : 'Golden Habit', desc: fr ? '7 jours consécutifs' : '7 days in a row', unlocked: streak >= 7 },
    { id: 'master', icon: '💎', rank: 8, title: fr ? 'Sagesse Cutanée' : 'Skin Wisdom', desc: fr ? '10 routines notées' : '10 routines logged', unlocked: entries.length >= 10 },
  ];
};

const JournalScreen = ({ go }) => {
  const { t, lang } = useT();
  const [periode, setPeriode] = useState('week'); // 'week' | 'month'
  const [data, setData] = useState(null);
  const [shelfCount, setShelfCount] = useState(0);
  const [skinPhotos, setSkinPhotos] = useState(() => {
    try {
      const saved = localStorage.getItem('solaia_skin_photos');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [previewPhoto, setPreviewPhoto] = useState(null);
  const [comparing, setComparing] = useState(false);
  const [splitPos, setSplitPos] = useState(50);
  const [sharing, setSharing] = useState(false);
  const [badgeView, setBadgeView] = useState(null); // null | 'all' (mes badges) | 'todo' (à obtenir)
  const { user } = useAuth();

  // Charger les photos depuis le compte utilisateur
  useEffect(() => {
    api.get('/auth/me').then((res) => {
      const userPhotos = res?.data?.user?.skin_photos;
      if (Array.isArray(userPhotos) && userPhotos.length > 0) {
        setSkinPhotos(userPhotos);
        try { localStorage.setItem('solaia_skin_photos', JSON.stringify(userPhotos)); } catch {}
      }
    }).catch(() => {});
  }, []);


  // Compression photo côté client (max 800px)
  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX = 800;
        let w = img.width, h = img.height;
        if (w > h && w > MAX) { h = Math.round((h * MAX) / w); w = MAX; }
        else if (h > MAX) { w = Math.round((w * MAX) / h); h = MAX; }
        canvas.width = w; canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);

        const newPhoto = {
          id: Date.now(),
          date: new Date().toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-US', { day: 'numeric', month: 'short' }),
          url: dataUrl,
        };

       const updated = [newPhoto, ...skinPhotos].slice(0, 10);
        setSkinPhotos(updated);
        try { localStorage.setItem('solaia_skin_photos', JSON.stringify(updated)); } catch {}
        // Sauvegarde permanente dans le profil utilisateur
        api.put('/auth/profile', { skin_photos: updated }).catch((err) => {
          console.error("Erreur sauvegarde selfie cloud :", err);
        });

      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleShare = async () => {
    if (sharing) return;
    setSharing(true);
    try {
      const userName = user?.nom || user?.prenom || user?.first_name || '';
      const lastEntry = entries[0];
      await shareVictory({ lang, streak, routineTitle: lastEntry?.title || '', userName, soins30, exfo30, badges: unlockedBadges.map((b) => ({ icon: b.icon, title: b.title })) });
    } catch (e) {
      console.warn('Partage impossible :', e.message);
    } finally {
      setSharing(false);
    }
  };

  const deletePhoto = (id) => {
    const updated = skinPhotos.filter((p) => p.id !== id);
    setSkinPhotos(updated);
    try { localStorage.setItem('solaia_skin_photos', JSON.stringify(updated)); } catch {}
    api.put('/auth/profile', { skin_photos: updated }).catch(() => {});
    setPreviewPhoto(null);
  };

  useEffect(() => {
    let active = true;
    api.get('/journal', { params: { periode, lang, tz: Intl.DateTimeFormat().resolvedOptions().timeZone } })
      .then((r) => { if (active) setData(r.data); })
      .catch(() => {});
    return () => { active = false; };
  }, [periode, lang]);

  useEffect(() => {
    let active = true;
    api.get('/shelf')
      .then((r) => {
        if (!active) return;
        const arr = r?.data?.shelf || r?.data || [];
        setShelfCount(Array.isArray(arr) ? arr.length : 0);
      })
      .catch(() => {});
    return () => { active = false; };
  }, []);

  if (!data) {
    return <div className="px-6 pt-10 font-body" style={{ color: 'var(--ink-faint)' }}>…</div>;
  }

  const days = Array.isArray(data.days) ? data.days : [];
  const entries = Array.isArray(data.entries) ? data.entries : [];
  const stats = Array.isArray(data.stats) ? data.stats : [];
  const streak = parseInt(data?.stats?.[0]?.n || '0', 10) || 0;

  // Badges : 3 plus prestigieux débloqués en vedette (≈ les plus récents)
  const badges = buildBadges({ entries, streak, shelfCount, skinPhotos, lang });
  const unlockedBadges = badges.filter((b) => b.unlocked);
  const lockedBadges = badges.filter((b) => !b.unlocked);
  const featuredBadges = [...unlockedBadges].sort((a, b) => b.rank - a.rank).slice(0, 3);

  return (
    <div className="px-6 pt-6 pb-28 max-h-screen overflow-y-auto animate-fade-up space-y-6">
      {/* En-tête */}
      <div>
        <span className="font-body tracking-caps text-[10px] uppercase" style={{ color: 'var(--ink-faint)' }}>
          {t('nav.journal')}
        </span>
        <h2 className="font-display text-[28px] mt-1">{t('holdRhythm')}</h2>
      </div>

      {/* Galerie Évolution de la peau */}
      <div className="p-4 rounded-[16px] space-y-3" style={{ background: 'var(--cream-card)', border: '1px solid var(--line)' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Camera size={16} style={{ color: 'var(--gold)' }} />
            <h3 className="font-display text-[15px]" style={{ color: 'var(--ink)' }}>
              {lang === 'fr' ? 'Évolution de ma peau' : 'Skin Evolution'}
            </h3>
          </div>
          <div className="flex items-center gap-2">
            {skinPhotos.length >= 2 && (
              <button
                onClick={() => setComparing((c) => !c)}
                className="flex items-center gap-1 px-2.5 py-1 rounded-full font-body text-[10px] uppercase tracking-caps transition-all"
                style={comparing
                  ? { background: 'var(--gold)', color: '#fff' }
                  : { background: 'var(--cream-card)', border: '1px solid var(--line-strong)', color: 'var(--ink-soft)' }}
              >
                <ArrowLeftRight size={12} />
                <span>{lang === 'fr' ? 'Comparer' : 'Compare'}</span>
              </button>
            )}
            <label className="cursor-pointer flex items-center gap-1 px-2.5 py-1 rounded-full font-body text-[10px] uppercase tracking-caps text-white gold-btn">
              <Plus size={12} />
              <span>{lang === 'fr' ? 'Ajouter' : 'Add'}</span>
              <input type="file" accept="image/*" capture="user" onChange={handlePhotoUpload} className="hidden" />
            </label>
          </div>
        </div>

        {skinPhotos.length === 0 ? (
          <p className="font-body italic text-[12px] py-2 text-center" style={{ color: 'var(--ink-faint)' }}>
            {lang === 'fr' 
              ? 'Prends un selfie chaque semaine pour observer l\'éclat de ta peau au fil du temps.' 
              : 'Take a selfie every week to track your skin glow over time.'}
          </p>
        ) : comparing && skinPhotos.length >= 2 ? (
          /* ===== Comparateur avant / après ===== */
          <div className="animate-fade-up">
            <div className="relative w-full rounded-[14px] overflow-hidden select-none" style={{ height: 300, border: '1.5px solid var(--gold-soft)' }}>
              {/* Avant = la plus ancienne */}
              <img src={skinPhotos[skinPhotos.length - 1].url} alt="Avant" className="absolute inset-0 w-full h-full object-cover" draggable={false} />
              {/* Après = la plus récente, révélée à droite du curseur */}
              <img
                src={skinPhotos[0].url}
                alt="Après"
                draggable={false}
                className="absolute inset-0 w-full h-full object-cover"
                style={{ clipPath: `inset(0 0 0 ${splitPos}%)` }}
              />
              {/* Ligne de séparation */}
              <div className="absolute top-0 bottom-0 w-[2px]" style={{ left: `${splitPos}%`, background: '#fff', boxShadow: '0 0 8px rgba(0,0,0,0.4)' }} />
              <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full font-body text-[10px] uppercase tracking-caps text-white" style={{ background: 'rgba(0,0,0,0.45)' }}>
                {lang === 'fr' ? 'Avant' : 'Before'} · {skinPhotos[skinPhotos.length - 1].date}
              </span>
              <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full font-body text-[10px] uppercase tracking-caps text-white" style={{ background: 'rgba(182,130,53,0.85)' }}>
                {lang === 'fr' ? 'Après' : 'After'} · {skinPhotos[0].date}
              </span>
            </div>
            <input
              type="range" min={2} max={98} value={splitPos}
              onChange={(e) => setSplitPos(Number(e.target.value))}
              className="w-full mt-3"
              aria-label={lang === 'fr' ? 'Curseur de comparaison' : 'Comparison slider'}
            />
          </div>
        ) : (
          <div className="flex gap-3 overflow-x-auto pb-1 pt-1">
            {skinPhotos.map((p) => (
              <div 
                key={p.id} 
                onClick={() => setPreviewPhoto(p)}
                className="shrink-0 cursor-pointer flex flex-col items-center gap-1 group"
              >
                <div className="w-16 h-16 rounded-[12px] overflow-hidden shadow-sm" style={{ border: '1.5px solid var(--gold-soft)' }}>
                  <img src={p.url} alt="Skin selfie" className="w-full h-full object-cover group-hover:scale-105 transition-all" />
                </div>
                <span className="font-body text-[10px] tnum" style={{ color: 'var(--ink-soft)' }}>{p.date}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Zoom Photo */}
      {badgeView && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-6 animate-fade-in"
          onClick={() => setBadgeView(null)}
        >
          <div
            className="w-full max-w-sm rounded-[20px] p-4 space-y-3 animate-fade-up max-h-[82vh] overflow-y-auto"
            style={{ background: '#FAF6F0' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <span className="font-body text-[11px] uppercase tracking-caps font-semibold" style={{ color: 'var(--gold)' }}>
                {badgeView === 'all'
                  ? (lang === 'fr' ? 'Mes badges' : 'My badges')
                  : (lang === 'fr' ? 'Badges à obtenir' : 'Badges to earn')}
              </span>
              <button onClick={() => setBadgeView(null)} className="p-1 rounded-full text-stone-400">
                <X size={18} />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              {(badgeView === 'all' ? unlockedBadges : lockedBadges).map((badge) => (
                <BadgeCard key={badge.id} badge={badge} />
              ))}
            </div>
          </div>
        </div>
      )}

      {previewPhoto && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex flex-col items-center justify-center p-6 animate-fade-in">
          <div className="w-full max-w-xs rounded-[20px] overflow-hidden p-4 space-y-3 animate-fade-up" style={{ background: '#FAF6F0' }}>
            <div className="flex items-center justify-between">
              <span className="font-body text-[12px] font-semibold" style={{ color: 'var(--ink)' }}>{previewPhoto.date}</span>
              <button onClick={() => setPreviewPhoto(null)} className="p-1 rounded-full text-stone-400">
                <X size={18} />
              </button>
            </div>
            <img src={previewPhoto.url} alt="Selfie zoom" className="w-full h-64 object-cover rounded-[14px]" />
            <button
              onClick={() => deletePhoto(previewPhoto.id)}
              className="w-full py-2 rounded-[8px] flex items-center justify-center gap-1.5 text-red-600 font-body text-[11px] uppercase tracking-caps"
              style={{ background: 'rgba(239,68,68,0.1)' }}
            >
              <Trash2 size={13} />
              <span>{lang === 'fr' ? 'Supprimer cette photo' : 'Delete photo'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Tendance de la peau — corrélée à tes notes */}
      {data.tendance && (
        <div className="p-4 rounded-[16px] flex items-center gap-3 animate-fade-up" style={{ background: 'var(--cream-card)', border: '1px solid var(--line)' }}>
          {data.tendance.sens === 'hausse' && <TrendingUp size={22} className="shrink-0" style={{ color: 'var(--gold)' }} />}
          {data.tendance.sens === 'baisse' && <TrendingDown size={22} className="shrink-0" style={{ color: '#B0563A' }} />}
          {data.tendance.sens === 'stable' && <Minus size={22} className="shrink-0" style={{ color: 'var(--ink-faint)' }} />}
          <div>
            <p className="font-body text-[10px] uppercase tracking-caps font-semibold" style={{ color: 'var(--gold)' }}>
              {lang === 'fr' ? 'Tendance de ma peau' : 'My skin trend'}
            </p>
            <p className="font-body text-[12.5px] mt-1 leading-relaxed" style={{ color: 'var(--ink-soft)' }}>
              {data.tendance.message}
            </p>
          </div>
        </div>
      )}

      {/* Toggle Semaine / Mois */}
      <div className="grid grid-cols-2 rounded-[10px] overflow-hidden p-1" style={{ border: '1px solid var(--line-strong)', background: 'var(--cream-card)' }}>
        <button onClick={() => setPeriode('week')} className="py-2.5 flex items-center justify-center gap-1.5 font-body tracking-caps text-[10px] uppercase rounded-[6px] transition-all"
          style={periode === 'week' ? { background: 'rgba(182,130,53,0.12)', color: 'var(--gold)', fontWeight: 600 } : { color: 'var(--ink-faint)' }}>
          <Calendar size={13} />
          {t('thisWeek')}
        </button>
        <button onClick={() => setPeriode('month')} className="py-2.5 flex items-center justify-center gap-1.5 font-body tracking-caps text-[10px] uppercase rounded-[6px] transition-all"
          style={periode === 'month' ? { background: 'rgba(182,130,53,0.12)', color: 'var(--gold)', fontWeight: 600 } : { color: 'var(--ink-faint)' }}>
          <CalendarDays size={13} />
          {t('thisMonth')}
        </button>
      </div>

      {/* Graphique des jours */}
      <div>
        <div className="flex items-end justify-between gap-[3px]" style={{ height: 70 }}>
          {days.map((day, i) => (
            <div key={i} className="flex-1 flex flex-col justify-end gap-[3px] h-full">
              <div className="rounded-[2px]" style={{ height: day.matin ? 22 : 6, background: day.matin ? 'var(--gold-soft)' : 'var(--line)' }} />
              <div className="rounded-[2px]" style={{ height: day.soir ? 34 : 6, background: day.soir ? 'var(--gold)' : 'var(--line)' }} />
            </div>
          ))}
        </div>
        {periode === 'week' && (
          <div className="flex justify-between mt-1.5">
            {days.map((day, i) => (
              <span key={i} className="flex-1 text-center font-body text-[9px] tnum" style={{ color: 'var(--ink-faint)' }}>{day.d}</span>
            ))}
          </div>
        )}
      </div>

      {/* Légende Matin / Soir */}
      <div className="flex items-center gap-5">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-[2px]" style={{ background: 'var(--gold-soft)' }} />
          <span className="font-body tracking-caps text-[9px] uppercase" style={{ color: 'var(--ink-faint)' }}>{t('morning')}</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-[2px]" style={{ background: 'var(--gold)' }} />
          <span className="font-body tracking-caps text-[9px] uppercase" style={{ color: 'var(--ink-faint)' }}>{t('evening')}</span>
        </span>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-3 gap-3 pt-6" style={{ borderTop: '1px solid var(--line)' }}>
        {stats.map((s, i) => (
          <div key={i}>
            <p className="font-display text-[32px] leading-none tnum">{s.n}</p>
            <p className="font-body tracking-caps text-[9px] uppercase mt-2" style={{ color: 'var(--ink-faint)' }}>
              {[t('daysStreak'), t('careThirty'), t('exfoThirty')][i]}
            </p>
          </div>
        ))}
      </div>

          {/* ===== Salle des Trophées ===== */}
      <div className="space-y-2.5 pt-2">
        <div className="flex items-center justify-between">
          <span className="font-body text-[10px] uppercase tracking-caps font-semibold" style={{ color: 'var(--gold)' }}>
            {lang === 'fr' ? 'Mes Victoires de Soin' : 'Care Victories'}
          </span>
          <span className="font-body text-[11px] font-medium" style={{ color: 'var(--ink-soft)' }}>
            {unlockedBadges.length} / {badges.length} {lang === 'fr' ? 'débloqués' : 'unlocked'}
          </span>
        </div>
        <button
          onClick={handleShare}
          disabled={sharing}
          className="w-full flex items-center justify-center gap-2 px-3 py-3 rounded-[14px] font-body text-[11px] uppercase tracking-caps font-semibold text-white gold-btn disabled:opacity-50"
        >
          <Share2 size={14} />
          <span>{sharing ? '…' : (lang === 'fr' ? 'Partager ma victoire' : 'Share my victory')}</span>
        </button>

        {/* Vedettes : les 3 badges les plus prestigieux débloqués */}
        {featuredBadges.length > 0 ? (
          <div className="grid grid-cols-3 gap-2.5">
            {featuredBadges.map((badge) => (
              <BadgeCard key={badge.id} badge={badge} large />
            ))}
          </div>
        ) : (
          <p className="font-body italic text-[12px] py-2 text-center" style={{ color: 'var(--ink-faint)' }}>
            {lang === 'fr'
              ? "Valide ta première routine pour débloquer ton premier badge !"
              : "Complete your first routine to unlock your first badge!"}
          </p>
        )}

        {/* Liens : tous mes badges / badges à obtenir */}
        <div className="flex items-center justify-center gap-6 pt-1">
          {unlockedBadges.length > 0 && (
            <button
              onClick={() => setBadgeView('all')}
              className="font-body text-[11px] font-semibold underline underline-offset-4"
              style={{ color: 'var(--gold)' }}
            >
              {lang === 'fr' ? 'Voir mes badges' : 'See my badges'} →
            </button>
          )}
          {lockedBadges.length > 0 && (
            <button
              onClick={() => setBadgeView('todo')}
              className="font-body text-[11px] font-semibold underline underline-offset-4"
              style={{ color: 'var(--ink-soft)' }}
            >
              {lang === 'fr' ? 'Badges à obtenir' : 'Badges to earn'} →
            </button>
          )}
        </div>
      </div>

      {/* Entrées */}
      <div className="p-4 rounded-[12px] space-y-3" style={{ border: '1px solid var(--line)', background: 'var(--cream-card)' }}>
        <div className="flex items-center justify-between pb-2 border-b" style={{ borderColor: 'var(--line)' }}>
          <span className="font-body tracking-caps text-[10px] uppercase font-semibold" style={{ color: 'var(--gold)' }}>{t('lastEntries')}</span>
          <span className="font-body text-[10px] tnum" style={{ color: 'var(--ink-soft)' }}>{entries.length} {t('entriesLabel')}</span>
        </div>

        {entries.length === 0 ? (
          <p className="font-body italic text-[13px] py-2" style={{ color: 'var(--ink-faint)' }}>
            {lang === 'fr' ? 'Aucune activité pour cette période.' : 'No activity for this period.'}
          </p>
        ) : (
          <div className="space-y-3 max-h-[260px] overflow-y-auto pr-1">
            {entries.map((entry, idx) => (
              <div key={idx} className="flex justify-between items-start py-1.5 border-b last:border-b-0" style={{ borderColor: 'rgba(163, 123, 104, 0.1)' }}>
                <div>
                  <div className="flex items-center gap-1.5">
                    <p className="font-body text-[13.5px] font-medium">{entry.title}</p>
                    {entry.note_peau && (
                      <span className="text-[13px]" title={lang === 'fr' ? 'Ressenti peau' : 'Skin feel'}>
                        {entry.note_peau <= 2 ? '😣' : entry.note_peau <= 4 ? '✨' : '🌟'}
                      </span>
                    )}
                  </div>
                  {entry.meta && (
                    <p className="font-body italic text-[11px] mt-0.5" style={{ color: 'var(--ink-faint)' }}>{entry.meta}</p>
                  )}
                </div>
                <span className="font-body text-[11px] tnum whitespace-nowrap ml-2" style={{ color: 'var(--ink-soft)' }}>{entry.time}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bouton Abonnement */}
      <button onClick={() => go('trial')} className="gold-btn w-full rounded-[8px] py-2.5 font-body tracking-caps text-[10px] uppercase">
        {t('manageSub')}
      </button>
    </div>
  );
};

export default JournalScreen;