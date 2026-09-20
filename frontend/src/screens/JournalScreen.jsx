import React, { useEffect, useState } from 'react';
import { Calendar, CalendarDays, Flame, Package, Camera, Trash2, Plus, X, Award, ShieldCheck, Lock, Sparkles, TrendingUp, TrendingDown, Minus, Share2, ArrowLeftRight, ArrowLeft, ChevronLeft, ChevronRight, Trophy, NotebookPen, Activity, Target } from 'lucide-react';
import api from '../lib/api';
import { useT } from '../i18n';
import { useAuth } from '../context/AuthContext';
import { shareVictory } from '../lib/shareCard';


// Carte badge réutilisable (vedettes + sections)
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
const buildBadges = ({ entries, streak, shelfCount, skinPhotos, soins30, exfo30, morningCount, eveningCount, lang }) => {
  const fr = lang === 'fr';
  return [
    { id: 'first', icon: '🌱', rank: 1, title: fr ? 'Première Lueur' : 'First Glow', desc: fr ? '1ère routine validée' : '1st completed routine', unlocked: entries.length >= 1 },
    { id: 'selfie', icon: '📸', rank: 2, title: fr ? 'Miroir du Temps' : 'Time Mirror', desc: fr ? '1er selfie de peau' : '1st skin photo saved', unlocked: skinPhotos.length >= 1 },
    { id: 'shelf', icon: '🧴', rank: 3, title: fr ? 'Armoire de Soins' : 'Skincare Shelf', desc: fr ? '5 flacons ordonnés' : '5 products organized', unlocked: shelfCount >= 5 },
    { id: 'sun', icon: '☀️', rank: 4, title: fr ? 'Bouclier UV' : 'UV Shield', desc: fr ? '3 routines du matin' : '3 morning routines', unlocked: morningCount >= 3 },
    { id: 'streak3', icon: '🔥', rank: 5, title: fr ? 'Rythme Solaire' : 'Solar Rhythm', desc: fr ? '3 jours consécutifs' : '3 days in a row', unlocked: streak >= 3 },
    { id: 'moon', icon: '🌙', rank: 6, title: fr ? 'Reine de la Nuit' : 'Night Queen', desc: fr ? '5 routines du soir' : '5 evening routines', unlocked: eveningCount >= 5 },
    { id: 'streak7', icon: '👑', rank: 7, title: fr ? "Constance d'Or" : 'Golden Habit', desc: fr ? '7 jours consécutifs' : '7 days in a row', unlocked: streak >= 7 },
    { id: 'master', icon: '💎', rank: 8, title: fr ? 'Sagesse Cutanée' : 'Skin Wisdom', desc: fr ? '10 routines notées' : '10 routines logged', unlocked: entries.length >= 10 },
    { id: 'dawn', icon: '🌅', rank: 9, title: fr ? 'Aube Éclatante' : 'Radiant Dawn', desc: fr ? '10 routines du matin' : '10 morning routines', unlocked: morningCount >= 10 },
    { id: 'freshskin', icon: '🌿', rank: 10, title: fr ? 'Peau Neuve' : 'Fresh Skin', desc: fr ? '2 exfoliations (30 j)' : '2 exfoliations (30d)', unlocked: exfo30 >= 2 },
    { id: 'collector', icon: '💄', rank: 11, title: fr ? 'Collectionneuse' : 'Collector', desc: fr ? '10 flacons ordonnés' : '10 products organized', unlocked: shelfCount >= 10 },
    { id: 'night', icon: '🌌', rank: 12, title: fr ? "Veillée d'Or" : 'Golden Night', desc: fr ? '15 routines du soir' : '15 evening routines', unlocked: eveningCount >= 15 },
    { id: 'gallery', icon: '🖼️', rank: 13, title: fr ? 'Galerie du Temps' : 'Time Gallery', desc: fr ? '5 selfies de peau' : '5 skin photos saved', unlocked: skinPhotos.length >= 5 },
    { id: 'streak14', icon: '🌟', rank: 14, title: fr ? 'Étoile Filante' : 'Shooting Star', desc: fr ? '14 jours consécutifs' : '14 days in a row', unlocked: streak >= 14 },
    { id: 'devotee', icon: '📓', rank: 15, title: fr ? 'Rituel Ancré' : 'Anchored Ritual', desc: fr ? '25 routines notées' : '25 routines logged', unlocked: entries.length >= 25 },
    { id: 'steady', icon: '💧', rank: 16, title: fr ? 'Éclat Assidu' : 'Steady Glow', desc: fr ? '20 soins (30 j)' : '20 routines (30d)', unlocked: soins30 >= 20 },
    { id: 'streak30', icon: '🏆', rank: 17, title: fr ? 'Légende Solaire' : 'Solar Legend', desc: fr ? '30 jours consécutifs' : '30 days in a row', unlocked: streak >= 30 },
    { id: 'eternaldawn', icon: '🌄', rank: 18, title: fr ? 'Aube Éternelle' : 'Eternal Dawn', desc: fr ? '20 routines du matin' : '20 morning routines', unlocked: morningCount >= 20 },
    { id: 'nightguard', icon: '🌠', rank: 19, title: fr ? 'Gardienne de la Nuit' : 'Night Guardian', desc: fr ? '30 routines du soir' : '30 evening routines', unlocked: eveningCount >= 30 },
    { id: 'legend', icon: '💫', rank: 20, title: fr ? 'Icône de Constance' : 'Consistency Icon', desc: fr ? '50 routines notées' : '50 routines logged', unlocked: entries.length >= 50 },
    { id: 'conservatory', icon: '🏺', rank: 21, title: fr ? 'Conservatoire de Soins' : 'Skincare Conservatory', desc: fr ? '20 flacons ordonnés' : '20 products organized', unlocked: shelfCount >= 20 },
    { id: 'glowritual', icon: '🍃', rank: 22, title: fr ? "Rituel d'Éclat" : 'Glow Ritual', desc: fr ? '8 exfoliations (30 j)' : '8 exfoliations (30d)', unlocked: exfo30 >= 8 },
    { id: 'century', icon: '💯', rank: 23, title: fr ? 'Centenaire' : 'Century Club', desc: fr ? '100 routines notées' : '100 routines logged', unlocked: entries.length >= 100 },
    { id: 'polaris', icon: '🧭', rank: 24, title: fr ? 'Étoile Polaire' : 'North Star', desc: fr ? '60 jours consécutifs' : '60 days in a row', unlocked: streak >= 60 },
  ];
};

// Tuile carrée du hub
const SectionTile = ({ icon, title, subtitle, onClick }) => (
  <button
    onClick={onClick}
    className="aspect-square rounded-[20px] p-4 flex flex-col items-start justify-between text-left transition-all active:scale-[0.97]"
    style={{ background: 'var(--cream-card)', border: '1px solid var(--line)' }}
  >
    <div className="w-11 h-11 rounded-[14px] flex items-center justify-center" style={{ background: 'rgba(182,130,53,0.12)' }}>
      {icon}
    </div>
    <div>
      <p className="font-display text-[16px] font-semibold leading-tight" style={{ color: 'var(--ink)' }}>{title}</p>
      <p className="font-body text-[11px] mt-1 tnum" style={{ color: 'var(--ink-soft)' }}>{subtitle}</p>
    </div>
  </button>
);

// ===== Section Ma peau : note moyenne + historique des notes =====
const PeauSection = ({ entries, avg, lang, onBack }) => {
  const fr = lang === 'fr';
  const rated = entries.filter((e) => typeof e.note_peau === 'number' && e.note_peau > 0).slice(0, 10);
  return (
    <div className="space-y-5">
      <SectionHeader
        title={fr ? 'Ma peau' : 'My skin'}
        subtitle={avg ? `${fr ? 'Note moyenne' : 'Average rating'} : ${avg} / 5` : null}
        onBack={onBack}
      />
      {avg ? (
        <>
          <div className="p-6 rounded-[20px] text-center" style={{ background: 'var(--cream-card)', border: '1px solid var(--line)' }}>
            <p className="font-display text-[44px] tnum" style={{ color: 'var(--gold)' }}>{avg}<span className="text-[20px]"> / 5</span></p>
            <p className="font-body text-[11px] mt-1" style={{ color: 'var(--ink-faint)' }}>
              {fr ? 'D’après tes notes après chaque routine.' : 'Based on your ratings after each routine.'}
            </p>
          </div>
          <div className="space-y-2">
            {rated.map((e, i) => (
              <div key={i} className="flex items-center justify-between gap-3 px-4 py-3 rounded-[14px]" style={{ background: 'var(--cream-card)', border: '1px solid var(--line)' }}>
                <span className="font-body text-[12px] line-clamp-1" style={{ color: 'var(--ink-soft)' }}>{e.title || (fr ? 'Routine' : 'Routine')}</span>
                <span className="font-display text-[15px] shrink-0" style={{ color: 'var(--gold)' }}>
                  {'★'.repeat(e.note_peau)}{'☆'.repeat(Math.max(0, 5 - e.note_peau))}
                </span>
              </div>
            ))}
          </div>
        </>
      ) : (
        <p className="font-body text-[13px] text-center py-8" style={{ color: 'var(--ink-faint)' }}>
          {fr ? 'Note ta peau après chaque routine et ta moyenne apparaîtra ici. ✨' : 'Rate your skin after each routine and your average will appear here. ✨'}
        </p>
      )}
    </div>
  );
};

// ===== Section Assiduité : % d'étapes complétées =====
const AssiduiteSection = ({ pct, done, total, lang, onBack }) => {
  const fr = lang === 'fr';
  return (
    <div className="space-y-5">
      <SectionHeader
        title={fr ? 'Assiduité' : 'Consistency'}
        subtitle={pct !== null ? `${done} / ${total} ${fr ? 'étapes' : 'steps'}` : null}
        onBack={onBack}
      />
      <div className="p-6 rounded-[20px] text-center space-y-3" style={{ background: 'var(--cream-card)', border: '1px solid var(--line)' }}>
        <p className="font-display text-[44px] tnum" style={{ color: 'var(--gold)' }}>{pct !== null ? `${pct} %` : '—'}</p>
        <div className="h-2.5 rounded-full overflow-hidden" style={{ background: 'var(--line)' }}>
          <div className="h-full rounded-full transition-all" style={{ width: `${pct || 0}%`, background: 'var(--gold)' }} />
        </div>
        <p className="font-body text-[12px]" style={{ color: 'var(--ink-faint)' }}>
          {fr ? 'Des étapes de ta routine complétées sur la période affichée.' : 'Of your routine steps completed in the shown period.'}
        </p>
      </div>
    </div>
  );
};

// En-tête d'une section (avec retour)
const SectionHeader = ({ title, subtitle, onBack }) => (
  <div className="flex items-center gap-3">
    <button
      onClick={onBack}
      aria-label="Retour"
      className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-all active:scale-95"
      style={{ border: '1px solid var(--line-strong)', background: 'var(--cream-card)' }}
    >
      <ArrowLeft size={16} style={{ color: 'var(--ink)' }} />
    </button>
    <div>
      <h2 className="font-display text-[22px] leading-tight" style={{ color: 'var(--ink)' }}>{title}</h2>
      {subtitle ? (
        <p className="font-body text-[11px] tnum" style={{ color: 'var(--ink-soft)' }}>{subtitle}</p>
      ) : null}
    </div>
  </div>
);

// ===== Section Photos : galerie + comparateur + visionneuse navigable =====
const PhotosSection = ({ skinPhotos, onBack, onUpload, onDelete, lang }) => {
  const fr = lang === 'fr';
  const [comparing, setComparing] = useState(false);
  const [splitPos, setSplitPos] = useState(50);
  const [previewIdx, setPreviewIdx] = useState(null); // index dans skinPhotos (0 = plus récente)
  const [touchX, setTouchX] = useState(null);

  const goPhoto = (dir) => {
    setPreviewIdx((i) => {
      if (i === null) return i;
      const n = i + dir;
      return n < 0 || n >= skinPhotos.length ? i : n;
    });
  };

  return (
    <div className="space-y-4 animate-fade-up">
      <SectionHeader
        title={fr ? 'Évolution de ma peau' : 'My skin evolution'}
        subtitle={skinPhotos.length > 0 ? `${skinPhotos.length} ${fr ? 'photos' : 'photos'}` : null}
        onBack={onBack}
      />

      <div className="flex items-center justify-end gap-2">
        {skinPhotos.length >= 2 && (
          <button
            onClick={() => setComparing((c) => !c)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-full font-body text-[10px] uppercase tracking-caps transition-all"
            style={comparing
              ? { background: 'var(--gold)', color: '#fff' }
              : { background: 'var(--cream-card)', border: '1px solid var(--line-strong)', color: 'var(--ink-soft)' }}
          >
            <ArrowLeftRight size={12} />
            <span>{fr ? 'Comparer' : 'Compare'}</span>
          </button>
        )}
        <label className="cursor-pointer flex items-center gap-1 px-2.5 py-1 rounded-full font-body text-[10px] uppercase tracking-caps text-white gold-btn">
          <Plus size={12} />
          <span>{fr ? 'Ajouter' : 'Add'}</span>
          <input type="file" accept="image/*" capture="user" onChange={onUpload} className="hidden" />
        </label>
      </div>

      {skinPhotos.length === 0 ? (
        <p className="font-body italic text-[12px] py-6 text-center" style={{ color: 'var(--ink-faint)' }}>
          {fr
            ? "Prends un selfie chaque semaine pour observer l'éclat de ta peau au fil du temps."
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
              {fr ? 'Avant' : 'Before'} · {skinPhotos[skinPhotos.length - 1].date}
            </span>
            <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full font-body text-[10px] uppercase tracking-caps text-white" style={{ background: 'rgba(182,130,53,0.85)' }}>
              {fr ? 'Après' : 'After'} · {skinPhotos[0].date}
            </span>
          </div>
          <input
            type="range" min={2} max={98} value={splitPos}
            onChange={(e) => setSplitPos(Number(e.target.value))}
            className="w-full mt-3"
            aria-label={fr ? 'Curseur de comparaison' : 'Comparison slider'}
          />
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2.5">
          {skinPhotos.map((p, idx) => (
            <button
              key={p.id}
              onClick={() => setPreviewIdx(idx)}
              className="flex flex-col items-center gap-1 group"
            >
              <div className="w-full aspect-square rounded-[12px] overflow-hidden shadow-sm" style={{ border: '1.5px solid var(--gold-soft)' }}>
                <img src={p.url} alt="Skin selfie" className="w-full h-full object-cover group-hover:scale-105 transition-all" />
              </div>
              <span className="font-body text-[10px] tnum" style={{ color: 'var(--ink-soft)' }}>{p.date}</span>
            </button>
          ))}
        </div>
      )}

      {/* Visionneuse photo : navigue d'une photo à l'autre pour voir l'évolution */}
      {previewIdx !== null && skinPhotos[previewIdx] && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex flex-col items-center justify-center p-6 animate-fade-in"
          onClick={() => setPreviewIdx(null)}
        >
          <div
            className="w-full max-w-sm rounded-[20px] overflow-hidden p-4 space-y-3 animate-fade-up max-h-[92vh] overflow-y-auto"
            style={{ background: '#FAF6F0' }}
            onClick={(e) => e.stopPropagation()}
            onTouchStart={(e) => setTouchX(e.touches[0].clientX)}
            onTouchEnd={(e) => {
              if (touchX === null) return;
              const dx = e.changedTouches[0].clientX - touchX;
              if (dx > 40) goPhoto(1);       // balayage vers la droite → photo plus ancienne
              else if (dx < -40) goPhoto(-1); // balayage vers la gauche → photo plus récente
              setTouchX(null);
            }}
          >
            <div className="flex items-center justify-between">
              <span className="font-body text-[12px] font-semibold tnum" style={{ color: 'var(--ink)' }}>
                {skinPhotos[previewIdx].date} · {skinPhotos.length - previewIdx}/{skinPhotos.length}
              </span>
              <button onClick={() => setPreviewIdx(null)} className="p-1 rounded-full text-stone-400" aria-label={fr ? 'Fermer' : 'Close'}>
                <X size={18} />
              </button>
            </div>
            <div className="relative">
              <img src={skinPhotos[previewIdx].url} alt="Selfie" className="w-full max-h-[58vh] object-contain rounded-[14px]" draggable={false} />
              {previewIdx < skinPhotos.length - 1 && (
                <button
                  onClick={(e) => { e.stopPropagation(); goPhoto(1); }}
                  aria-label={fr ? 'Photo précédente' : 'Previous photo'}
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/45 text-white flex items-center justify-center active:scale-95"
                >
                  <ChevronLeft size={20} />
                </button>
              )}
              {previewIdx > 0 && (
                <button
                  onClick={(e) => { e.stopPropagation(); goPhoto(-1); }}
                  aria-label={fr ? 'Photo suivante' : 'Next photo'}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/45 text-white flex items-center justify-center active:scale-95"
                >
                  <ChevronRight size={20} />
                </button>
              )}
            </div>
            <p className="font-body italic text-[10px] text-center" style={{ color: 'var(--ink-faint)' }}>
              {fr ? 'Balaye ou utilise les flèches pour voir ton évolution' : 'Swipe or use arrows to see your progress'}
            </p>
            <button
              onClick={() => { onDelete(skinPhotos[previewIdx].id); setPreviewIdx(null); }}
              className="w-full py-2 rounded-[8px] flex items-center justify-center gap-1.5 text-red-600 font-body text-[11px] uppercase tracking-caps"
              style={{ background: 'rgba(239,68,68,0.1)' }}
            >
              <Trash2 size={13} />
              <span>{fr ? 'Supprimer cette photo' : 'Delete photo'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// ===== Section Défis : vedettes + mes badges + prochains défis =====
const BadgesSection = ({ badges, unlockedBadges, lockedBadges, featuredBadges, lang, onBack, onShare, sharing }) => {
  const fr = lang === 'fr';
  return (
    <div className="space-y-4 animate-fade-up">
      <SectionHeader
        title={fr ? 'Défis de soin' : 'Skincare challenges'}
        subtitle={`${unlockedBadges.length} / ${badges.length} ${fr ? 'débloqués' : 'unlocked'}`}
        onBack={onBack}
      />

      <button
        onClick={onShare}
        disabled={sharing}
        className="w-full flex items-center justify-center gap-2 px-3 py-3 rounded-[14px] font-body text-[11px] uppercase tracking-caps font-semibold text-white gold-btn disabled:opacity-50"
      >
        <Share2 size={14} />
        <span>{sharing ? '…' : (fr ? 'Partager ma victoire' : 'Share my victory')}</span>
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
          {fr
            ? 'Valide ta première routine pour débloquer ton premier badge !'
            : 'Complete your first routine to unlock your first badge!'}
        </p>
      )}

      {/* Mes badges */}
      {unlockedBadges.length > 0 && (
        <div className="space-y-2.5">
          <span className="font-body text-[10px] uppercase tracking-caps font-semibold" style={{ color: 'var(--gold)' }}>
            {fr ? 'Mes badges' : 'My badges'}
          </span>
          <div className="grid grid-cols-2 gap-2.5">
            {unlockedBadges.map((badge) => (
              <BadgeCard key={badge.id} badge={badge} />
            ))}
          </div>
        </div>
      )}

      {/* Prochains défis */}
      {lockedBadges.length > 0 && (
        <div className="space-y-2.5">
          <span className="font-body text-[10px] uppercase tracking-caps font-semibold" style={{ color: 'var(--ink-soft)' }}>
            {fr ? 'Prochains défis' : 'Upcoming challenges'}
          </span>
          <div className="grid grid-cols-2 gap-2.5">
            {lockedBadges.map((badge) => (
              <BadgeCard key={badge.id} badge={badge} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ===== Section Activité : liste des entrées =====
const ActiviteSection = ({ entries, lang, t, onBack }) => {
  const fr = lang === 'fr';
  return (
    <div className="space-y-4 animate-fade-up">
      <SectionHeader
        title={fr ? 'Activité' : 'Activity'}
        subtitle={`${entries.length} ${t('entriesLabel')}`}
        onBack={onBack}
      />
      <div className="p-4 rounded-[12px] space-y-3" style={{ border: '1px solid var(--line)', background: 'var(--cream-card)' }}>
        {entries.length === 0 ? (
          <p className="font-body italic text-[13px] py-2" style={{ color: 'var(--ink-faint)' }}>
            {fr ? 'Aucune activité pour cette période.' : 'No activity for this period.'}
          </p>
        ) : (
          <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
            {entries.map((entry, idx) => (
              <div key={idx} className="flex justify-between items-start py-1.5 border-b last:border-b-0" style={{ borderColor: 'rgba(163, 123, 104, 0.1)' }}>
                <div>
                  <div className="flex items-center gap-1.5">
                    <p className="font-body text-[13.5px] font-medium">{entry.title}</p>
                    {entry.note_peau && (
                      <span className="text-[13px]" title={fr ? 'Ressenti peau' : 'Skin feel'}>
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
    </div>
  );
};

// ===== Section Rythme : toggle + graphique + stats + tendance =====
const RythmeSection = ({ periode, setPeriode, days, stats, tendance, lang, t, onBack }) => {
  const fr = lang === 'fr';
  return (
    <div className="space-y-4 animate-fade-up">
      <SectionHeader title={fr ? 'Mon rythme' : 'My rhythm'} onBack={onBack} />

      {/* Tendance de la peau — corrélée à tes notes */}
      {tendance && (
        <div className="p-4 rounded-[16px] flex items-center gap-3 animate-fade-up" style={{ background: 'var(--cream-card)', border: '1px solid var(--line)' }}>
          {tendance.sens === 'hausse' && <TrendingUp size={22} className="shrink-0" style={{ color: 'var(--gold)' }} />}
          {tendance.sens === 'baisse' && <TrendingDown size={22} className="shrink-0" style={{ color: '#B0563A' }} />}
          {tendance.sens === 'stable' && <Minus size={22} className="shrink-0" style={{ color: 'var(--ink-faint)' }} />}
          <div>
            <p className="font-body text-[10px] uppercase tracking-caps font-semibold" style={{ color: 'var(--gold)' }}>
              {fr ? 'Tendance de ma peau' : 'My skin trend'}
            </p>
            <p className="font-body text-[12.5px] mt-1 leading-relaxed" style={{ color: 'var(--ink-soft)' }}>
              {tendance.message}
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
      <div className="grid grid-cols-3 gap-3 pt-4" style={{ borderTop: '1px solid var(--line)' }}>
        {stats.map((s, i) => (
          <div key={i}>
            <p className="font-display text-[32px] leading-none tnum">{s.n}</p>
            <p className="font-body tracking-caps text-[9px] uppercase mt-2" style={{ color: 'var(--ink-faint)' }}>
              {[t('daysStreak'), t('careThirty'), t('exfoThirty')][i]}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

const JournalScreen = ({ go }) => {
  const { t, lang } = useT();
  const fr = lang === 'fr';
  const [periode, setPeriode] = useState('week'); // 'week' | 'month'
  const [data, setData] = useState(null);
  const [shelfCount, setShelfCount] = useState(0);
  const [section, setSection] = useState(null); // null | 'photos' | 'badges' | 'activite' | 'rythme'
  const [sharing, setSharing] = useState(false);
  const { user } = useAuth();
  const [skinPhotos, setSkinPhotos] = useState(() => {
    try {
      const saved = localStorage.getItem('solaia_skin_photos');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

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

  const deletePhoto = (id) => {
    const updated = skinPhotos.filter((p) => p.id !== id);
    setSkinPhotos(updated);
    try { localStorage.setItem('solaia_skin_photos', JSON.stringify(updated)); } catch {}
    api.put('/auth/profile', { skin_photos: updated }).catch(() => {});
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
  const soins30 = parseInt(stats[1]?.n || '0', 10) || 0;
  const exfo30 = parseInt(stats[2]?.n || '0', 10) || 0;
  const _tl = (e) => (e.title || '').toLowerCase();
  const morningCount = entries.filter((e) => { const t = _tl(e); return t.includes('matin') || t.includes('jour') || t.includes('day'); }).length;
  const eveningCount = entries.filter((e) => { const t = _tl(e); return t.includes('soir') || t.includes('evening'); }).length;

  // Ma peau : note moyenne (période affichée, échelle 1-5)
  const ratedEntries = entries.filter((e) => typeof e.note_peau === 'number' && e.note_peau > 0);
  const skinNoteAvg = ratedEntries.length > 0
    ? (ratedEntries.reduce((sum, e) => sum + e.note_peau, 0) / ratedEntries.length).toFixed(1).replace('.', fr ? ',' : '.')
    : null;
  // Assiduité : % d'étapes de routine complétées (période affichée)
  const stepsDone = entries.reduce((sum, e) => sum + (parseInt(e.etapes_completees, 10) || 0), 0);
  const stepsTotal = entries.reduce((sum, e) => sum + (parseInt(e.nb_total_etapes, 10) || 0), 0);
  const assiduite = stepsTotal > 0 ? Math.round((stepsDone / stepsTotal) * 100) : null;

  // Badges : 3 plus prestigieux débloqués en vedette (≈ les plus récents)
  const badges = buildBadges({ entries, streak, shelfCount, skinPhotos, soins30, exfo30, morningCount, eveningCount, lang });
  const unlockedBadges = badges.filter((b) => b.unlocked);
  const lockedBadges = badges.filter((b) => !b.unlocked);
  const featuredBadges = [...unlockedBadges].sort((a, b) => b.rank - a.rank).slice(0, 3);

  const handleShare = async () => {
    if (sharing) return;
    setSharing(true);
    try {
      const userName = user?.nom || user?.prenom || user?.first_name || '';
      const lastEntry = entries[0];
      await shareVictory({ lang, streak, routineTitle: lastEntry?.title || '', userName, soins30, exfo30, badges: featuredBadges.map((b) => ({ icon: b.icon, title: b.title, desc: b.desc, rank: b.rank })),
        badgesTotal: unlockedBadges.length });
    } catch (e) {
      console.warn('Partage impossible :', e.message);
    } finally {
      setSharing(false);
    }
  };

  const back = () => setSection(null);

  return (
    <div className="px-6 pt-6 pb-28 max-h-screen overflow-y-auto animate-fade-up space-y-6">
      {section === 'photos' && (
        <PhotosSection
          skinPhotos={skinPhotos}
          onBack={back}
          onUpload={handlePhotoUpload}
          onDelete={deletePhoto}
          lang={lang}
        />
      )}

      {section === 'badges' && (
        <BadgesSection
          badges={badges}
          unlockedBadges={unlockedBadges}
          lockedBadges={lockedBadges}
          featuredBadges={featuredBadges}
          lang={lang}
          onBack={back}
          onShare={handleShare}
          sharing={sharing}
        />
      )}

      {section === 'activite' && (
        <ActiviteSection entries={entries} lang={lang} t={t} onBack={back} />
      )}

      {section === 'rythme' && (
        <RythmeSection
          periode={periode}
          setPeriode={setPeriode}
          days={days}
          stats={stats}
          tendance={data.tendance}
          lang={lang}
          t={t}
          onBack={back}
        />
      )}

      {section === 'peau' && (
        <PeauSection entries={entries} avg={skinNoteAvg} lang={lang} onBack={back} />
      )}

      {section === 'assiduite' && (
        <AssiduiteSection pct={assiduite} done={stepsDone} total={stepsTotal} lang={lang} onBack={back} />
      )}

      {section === null && (
        <>
          {/* En-tête */}
          <div>
            <span className="font-body tracking-caps text-[10px] uppercase" style={{ color: 'var(--ink-faint)' }}>
              {t('nav.journal')}
            </span>
            <h2 className="font-display text-[28px] mt-1">{t('holdRhythm')}</h2>
          </div>

          {/* Tuiles : 4 sections carrées */}
          <div className="grid grid-cols-2 gap-3 animate-fade-up">
            <SectionTile
              icon={<Camera size={22} style={{ color: 'var(--gold)' }} />}
              title={fr ? 'Mon évolution' : 'My evolution'}
              subtitle={`${skinPhotos.length} ${fr ? 'photos' : 'photos'}`}
              onClick={() => setSection('photos')}
            />
            <SectionTile
              icon={<Trophy size={22} style={{ color: 'var(--gold)' }} />}
              title={fr ? 'Défis' : 'Challenges'}
              subtitle={`${unlockedBadges.length} / ${badges.length} ${fr ? 'débloqués' : 'unlocked'}`}
              onClick={() => setSection('badges')}
            />
            <SectionTile
              icon={<NotebookPen size={22} style={{ color: 'var(--gold)' }} />}
              title={fr ? 'Activité' : 'Activity'}
              subtitle={`${entries.length} ${t('entriesLabel')}`}
              onClick={() => setSection('activite')}
            />
            <SectionTile
              icon={<Activity size={22} style={{ color: 'var(--gold)' }} />}
              title={fr ? 'Mon rythme' : 'My rhythm'}
              subtitle={`${streak} ${fr ? 'jours de suite' : 'day streak'}`}
              onClick={() => setSection('rythme')}
            />
            <SectionTile
              icon={<Sparkles size={22} style={{ color: 'var(--gold)' }} />}
              title={fr ? 'Ma peau' : 'My skin'}
              subtitle={skinNoteAvg ? `${skinNoteAvg} / 5` : (fr ? 'Pas encore notée' : 'Not rated yet')}
              onClick={() => setSection('peau')}
            />
            <SectionTile
              icon={<Target size={22} style={{ color: 'var(--gold)' }} />}
              title={fr ? 'Assiduité' : 'Consistency'}
              subtitle={assiduite !== null ? `${assiduite} %` : '—'}
              onClick={() => setSection('assiduite')}
            />
          </div>
        </>
      )}
    </div>
  );
};

export default JournalScreen;
