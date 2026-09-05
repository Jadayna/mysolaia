import React, { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import api from '../lib/api';
import { useT } from '../i18n';

const JournalScreen = ({ go }) => {
  const { t } = useT();
  const [data, setData] = useState(null);
  const [entryIndex, setEntryIndex] = useState(0);

  useEffect(() => {
    api.get('/journal')
      .then((r) => setData(r.data))
      .catch(() => {});
  }, []);

  if (!data) {
    return <div className="px-6 pt-10 font-body" style={{ color: 'var(--ink-faint)' }}>…</div>;
  }

  const entries = data.entries || [];
  const currentEntry = entries[entryIndex];

  const prevEntry = () => setEntryIndex((prev) => Math.max(0, prev - 1));
  const nextEntry = () => setEntryIndex((prev) => Math.min(entries.length - 1, prev + 1));

  return (
    <div className="px-6 pt-6 pb-28 max-h-screen overflow-y-auto animate-fade-up space-y-6">
      {/* En-tête */}
      <div>
        <span className="font-body tracking-caps text-[10px] uppercase" style={{ color: 'var(--ink-faint)' }}>
          {t('nav.journal')}
        </span>
        <h2 className="font-display text-[28px] mt-1">{t('holdRhythm')}</h2>
      </div>

      {/* Graphique des jours */}
      <div>
        <div className="flex items-end justify-between gap-[3px]" style={{ height: 70 }}>
          {data.days.map((day, i) => (
            <div key={i} className="flex-1 flex flex-col justify-end gap-[3px] h-full">
              <div 
                className="rounded-[2px]" 
                style={{ height: day.matin ? 22 : 6, background: day.matin ? 'var(--gold-soft)' : 'var(--line)' }} 
              />
              <div 
                className="rounded-[2px]" 
                style={{ height: day.soir ? 34 : 6, background: day.soir ? 'var(--gold)' : 'var(--line)' }} 
              />
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-1.5">
          {data.days.map((day, i) => (
            <span key={i} className="flex-1 text-center font-body text-[9px] tnum" style={{ color: 'var(--ink-faint)' }}>
              {day.d}
            </span>
          ))}
        </div>
      </div>

      {/* Légende Matin / Soir */}
      <div className="flex items-center gap-5">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-[2px]" style={{ background: 'var(--gold-soft)' }} />
          <span className="font-body tracking-caps text-[9px] uppercase" style={{ color: 'var(--ink-faint)' }}>
            {t('morning')}
          </span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-[2px]" style={{ background: 'var(--gold)' }} />
          <span className="font-body tracking-caps text-[9px] uppercase" style={{ color: 'var(--ink-faint)' }}>
            {t('evening')}
          </span>
        </span>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-3 gap-3 pt-6" style={{ borderTop: '1px solid var(--line)' }}>
        {data.stats.map((s, i) => (
          <div key={i}>
            <p className="font-display text-[32px] leading-none tnum">{s.n}</p>
            <p className="font-body tracking-caps text-[9px] uppercase mt-2" style={{ color: 'var(--ink-faint)' }}>
              {[t('daysStreak'), t('careThirty'), t('exfoThirty')][i]}
            </p>
          </div>
        ))}
      </div>

      {/* Section Dernières Entrées Déroulante avec Flèches (Point #5) */}
      <div className="p-4 rounded-[12px] space-y-3" style={{ border: '1px solid var(--line)', background: 'var(--cream-card)' }}>
        <div className="flex items-center justify-between">
          <span className="font-body tracking-caps text-[10px] uppercase font-semibold" style={{ color: 'var(--gold)' }}>
            {t('lastEntries')}
          </span>

          {entries.length > 0 && (
            <div className="flex items-center gap-1">
              <button 
                onClick={prevEntry} 
                disabled={entryIndex === 0}
                className="p-1 rounded-full border disabled:opacity-30"
                style={{ borderColor: 'var(--line)' }}
              >
                <ChevronLeft size={14} />
              </button>
              <span className="font-body text-[10px] px-1 tnum">
                {entryIndex + 1} / {entries.length}
              </span>
              <button 
                onClick={nextEntry} 
                disabled={entryIndex === entries.length - 1}
                className="p-1 rounded-full border disabled:opacity-30"
                style={{ borderColor: 'var(--line)' }}
              >
                <ChevronRight size={14} />
              </button>
            </div>
          )}
        </div>

        {entries.length === 0 ? (
          <p className="font-body italic text-[13px]" style={{ color: 'var(--ink-faint)' }}>
            {t('demoNote')}
          </p>
        ) : (
          currentEntry && (
            <div className="pt-2">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-body text-[14px] font-medium">{currentEntry.title}</p>
                  <p className="font-body italic text-[11.5px] mt-0.5" style={{ color: 'var(--ink-faint)' }}>
                    {currentEntry.meta}
                  </p>
                </div>
                <span className="font-body text-[12px] tnum" style={{ color: 'var(--ink-soft)' }}>
                  {currentEntry.time}
                </span>
              </div>
            </div>
          )
        )}
      </div>

      {/* Bouton Abonnement */}
      <button 
        onClick={() => go('essai')} 
        className="gold-btn w-full rounded-[8px] py-2.5 font-body tracking-caps text-[10px] uppercase"
      >
        {t('manageSub')}
      </button>
    </div>
  );
};

export default JournalScreen;