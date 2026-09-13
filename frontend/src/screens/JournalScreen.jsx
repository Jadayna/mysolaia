import React, { useEffect, useState } from 'react';
import { Calendar, CalendarDays, Flame, Package, Camera, Trash2, Plus, X, Award, ShieldCheck, Lock, Sparkles } from 'lucide-react';
import api from '../lib/api';
import { useT } from '../i18n';

// Paliers de badges (calculés à la volée depuis les données existantes)
const STREAK_BADGES = [
  { n: 1, fr: 'Premier jour', en: 'First day' },
  { n: 3, fr: '3 jours de suite', en: '3-day streak' },
  { n: 7, fr: 'Une semaine', en: 'One week' },
  { n: 30, fr: 'Un mois', en: 'One month' },
  { n: 100, fr: '100 jours', en: '100 days' },
  { n: 365, fr: 'Une année', en: 'One year' },
];

const PRODUCT_BADGES = [
  { n: 1, fr: 'Premier produit', en: 'First product' },
  { n: 5, fr: 'Étagère garnie', en: 'Stocked shelf' },
  { n: 10, fr: 'Collectionneuse', en: 'Collector' },
  { n: 20, fr: 'Passionnée', en: 'Enthusiast' },
];

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

        const updated = [newPhoto, ...skinPhotos].slice(0, 10); // Garder les 10 dernières photos
        setSkinPhotos(updated);
        try { localStorage.setItem('solaia_skin_photos', JSON.stringify(updated)); } catch {}
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  };

  const deletePhoto = (id) => {
    const updated = skinPhotos.filter((p) => p.id !== id);
    setSkinPhotos(updated);
    try { localStorage.setItem('solaia_skin_photos', JSON.stringify(updated)); } catch {}
    setPreviewPhoto(null);
  };

  useEffect(() => {
    let active = true;
    api.get('/journal', { params: { periode, lang } })
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
          <label className="cursor-pointer flex items-center gap-1 px-2.5 py-1 rounded-full font-body text-[10px] uppercase tracking-caps text-white gold-btn">
            <Plus size={12} />
            <span>{lang === 'fr' ? 'Ajouter' : 'Add'}</span>
            <input type="file" accept="image/*" capture="user" onChange={handlePhotoUpload} className="hidden" />
          </label>
        </div>

        {skinPhotos.length === 0 ? (
          <p className="font-body italic text-[12px] py-2 text-center" style={{ color: 'var(--ink-faint)' }}>
            {lang === 'fr' 
              ? 'Prends un selfie chaque semaine pour observer l\'éclat de ta peau au fil du temps.' 
              : 'Take a selfie every week to track your skin glow over time.'}
          </p>
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

            {/* ===== Mes Victoires de Soin ===== */}
      <div className="space-y-2 pt-2">
        <span className="font-body tracking-caps text-[10px] uppercase" style={{ color: 'var(--ink-faint)' }}>
          {lang === 'fr' ? 'Mes victoires de soin' : 'My skincare milestones'}
        </span>
        <div className="grid grid-cols-2 gap-2.5">
          {/* Badge 1 : Première Lueur */}
          {(() => {
            const unlocked = entries.length >= 1;
            return (
              <div className="p-3 rounded-[14px] flex items-center gap-2.5"
                style={{
                  background: unlocked ? 'var(--cream-card)' : 'rgba(0,0,0,0.02)',
                  border: unlocked ? '1px solid var(--gold-soft)' : '1px dashed var(--line)',
                  opacity: unlocked ? 1 : 0.45
                }}>
                <div className="p-2 rounded-full shrink-0" style={{ background: unlocked ? 'rgba(182,130,53,0.15)' : '#eee', color: unlocked ? 'var(--gold)' : '#999' }}>
                  {unlocked ? <Sparkles size={16} /> : <Lock size={16} />}
                </div>
                <div>
                  <p className="font-display text-[12px] font-medium" style={{ color: 'var(--ink)' }}>
                    {lang === 'fr' ? "Première Lueur" : 'First Glow'}
                  </p>
                  <p className="font-body text-[10px]" style={{ color: 'var(--ink-faint)' }}>
                    {lang === 'fr' ? '1ère routine faite' : '1st routine done'}
                  </p>
                </div>
              </div>
            );
          })()}

          {/* Badge 2 : Rythme Solaire */}
          {(() => {
            const unlocked = streak >= 3;
            return (
              <div className="p-3 rounded-[14px] flex items-center gap-2.5"
                style={{
                  background: unlocked ? 'var(--cream-card)' : 'rgba(0,0,0,0.02)',
                  border: unlocked ? '1px solid var(--gold-soft)' : '1px dashed var(--line)',
                  opacity: unlocked ? 1 : 0.45
                }}>
                <div className="p-2 rounded-full shrink-0" style={{ background: unlocked ? 'rgba(182,130,53,0.15)' : '#eee', color: unlocked ? 'var(--gold)' : '#999' }}>
                  {unlocked ? <Flame size={16} /> : <Lock size={16} />}
                </div>
                <div>
                  <p className="font-display text-[12px] font-medium" style={{ color: 'var(--ink)' }}>
                    {lang === 'fr' ? 'Rythme Solaire' : 'Solar Rhythm'}
                  </p>
                  <p className="font-body text-[10px]" style={{ color: 'var(--ink-faint)' }}>
                    {lang === 'fr' ? "3 jours d'affilée" : '3-day streak'}
                  </p>
                </div>
              </div>
            );
          })()}

          {/* Badge 3 : Bouclier Cutané */}
          {(() => {
            const unlocked = entries.length >= 5;
            return (
              <div className="p-3 rounded-[14px] flex items-center gap-2.5"
                style={{
                  background: unlocked ? 'var(--cream-card)' : 'rgba(0,0,0,0.02)',
                  border: unlocked ? '1px solid var(--gold-soft)' : '1px dashed var(--line)',
                  opacity: unlocked ? 1 : 0.45
                }}>
                <div className="p-2 rounded-full shrink-0" style={{ background: unlocked ? 'rgba(182,130,53,0.15)' : '#eee', color: unlocked ? 'var(--gold)' : '#999' }}>
                  {unlocked ? <ShieldCheck size={16} /> : <Lock size={16} />}
                </div>
                <div>
                  <p className="font-display text-[12px] font-medium" style={{ color: 'var(--ink)' }}>
                    {lang === 'fr' ? 'Bouclier Cutané' : 'Skin Shield'}
                  </p>
                  <p className="font-body text-[10px]" style={{ color: 'var(--ink-faint)' }}>
                    {lang === 'fr' ? '5 routines validées' : '5 routines done'}
                  </p>
                </div>
              </div>
            );
          })()}

          {/* Badge 4 : Constance d'Or */}
          {(() => {
            const unlocked = streak >= 7;
            return (
              <div className="p-3 rounded-[14px] flex items-center gap-2.5"
                style={{
                  background: unlocked ? 'var(--cream-card)' : 'rgba(0,0,0,0.02)',
                  border: unlocked ? '1px solid var(--gold-soft)' : '1px dashed var(--line)',
                  opacity: unlocked ? 1 : 0.45
                }}>
                <div className="p-2 rounded-full shrink-0" style={{ background: unlocked ? 'rgba(182,130,53,0.15)' : '#eee', color: unlocked ? 'var(--gold)' : '#999' }}>
                  {unlocked ? <Award size={16} /> : <Lock size={16} />}
                </div>
                <div>
                  <p className="font-display text-[12px] font-medium" style={{ color: 'var(--ink)' }}>
                    {lang === 'fr' ? "Constance d'Or" : 'Golden Ritual'}
                  </p>
                  <p className="font-body text-[10px]" style={{ color: 'var(--ink-faint)' }}>
                    {lang === 'fr' ? '7 jours de streak' : '7-day streak'}
                  </p>
                </div>
              </div>
            );
          })()}
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