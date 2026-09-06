import React, { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import api from '../lib/api';
import { useT } from '../i18n';

const JournalScreen = ({ go }) => {
  const { t } = useT();
  const [data, setData] = useState(null);
  const [weekOffset, setWeekOffset] = useState(0); // 0 = cette semaine, -1 = semaine passée, etc.

  useEffect(() => {
    api.get('/journal')
      .then((r) => setData(r.data))
      .catch(() => {});
  }, []);

  if (!data) {
    return <div className="px-6 pt-10 font-body" style={{ color: 'var(--ink-faint)' }}>…</div>;
  }

  // Si l'API retourne un tableau de semaines ou de jours, on s'adapte
  const allWeeks = data.weeks || [
    {
      label: weekOffset === 0 ? (t('thisWeek')) : `${t('weeksAgo')} ${Math.abs(weekOffset)}`,
      days: data.days || [],
      entries: data.entries || []
    }
  ];

  // Gestion des limites de navigation par semaine
  const currentWeekIndex = Math.min(Math.max(0, -weekOffset), allWeeks.length - 1);
  const currentWeek = allWeeks[currentWeekIndex] || { days: data.days || [], entries: data.entries || [], label: "Semaine" };

  const handlePrevWeek = () => {
    if (currentWeekIndex < allWeeks.length - 1) {
      setWeekOffset((prev) => prev - 1);
    }
  };

  const handleNextWeek = () => {
    if (currentWeekIndex > 0) {
      setWeekOffset((prev) => prev + 1);
    }
  };

  return (
    <div className="px-6 pt-6 pb-28 max-h-screen overflow-y-auto animate-fade-up space-y-6">
      {/* En-tête */}
      <div>
        <span className="font-body tracking-caps text-[10px] uppercase" style={{ color: 'var(--ink-faint)' }}>
          {t('nav.journal')}
        </span>
        <h2 className="font-display text-[28px] mt-1">{t('holdRhythm')}</h2>
      </div>

      {/* Navigation Semaine par Semaine */}
      <div className="flex items-center justify-between p-3 rounded-[12px]" style={{ background: 'var(--cream-card)', border: '1px solid var(--line)' }}>
        <button 
          onClick={handlePrevWeek} 
          disabled={currentWeekIndex >= allWeeks.length - 1}
          className="p-1.5 rounded-full border disabled:opacity-30 flex items-center justify-center"
          style={{ borderColor: 'var(--line)' }}
        >
          <ChevronLeft size={16} />
        </button>

        <div className="flex items-center gap-2">
          <Calendar size={14} style={{ color: 'var(--gold)' }} />
          <span className="font-display text-[14px] font-medium" style={{ color: 'var(--ink)' }}>
            {currentWeek.label || `Semaine ${currentWeekIndex + 1}`}
          </span>
        </div>

        <button 
          onClick={handleNextWeek} 
          disabled={currentWeekIndex <= 0}
          className="p-1.5 rounded-full border disabled:opacity-30 flex items-center justify-center"
          style={{ borderColor: 'var(--line)' }}
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Graphique des jours de la semaine */}
      <div>
        <div className="flex items-end justify-between gap-[3px]" style={{ height: 70 }}>
          {currentWeek.days.map((day, i) => (
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
          {currentWeek.days.map((day, i) => (
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

      {/* Section Dernières Entrées de la Semaine */}
      <div className="p-4 rounded-[12px] space-y-3" style={{ border: '1px solid var(--line)', background: 'var(--cream-card)' }}>
        <div className="flex items-center justify-between pb-2 border-b" style={{ borderColor: 'var(--line)' }}>
          <span className="font-body tracking-caps text-[10px] uppercase font-semibold" style={{ color: 'var(--gold)' }}>
            {t('lastEntries')}
          </span>
          <span className="font-body text-[10px] tnum" style={{ color: 'var(--ink-soft)' }}>
            {currentWeek.entries.length} {t('entriesLabel')}
          </span>
        </div>

        {currentWeek.entries.length === 0 ? (
          <p className="font-body italic text-[13px] py-2" style={{ color: 'var(--ink-faint)' }}>
            {t('demoNote') || "Aucune activité enregistrée pour cette semaine."}
          </p>
        ) : (
          <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
            {currentWeek.entries.map((entry, idx) => (
              <div key={idx} className="flex justify-between items-start py-1.5 border-b last:border-b-0" style={{ borderColor: 'rgba(163, 123, 104, 0.1)' }}>
                <div>
                  <p className="font-body text-[13.5px] font-medium">{entry.title}</p>
                  {entry.meta && (
                    <p className="font-body italic text-[11px] mt-0.5" style={{ color: 'var(--ink-faint)' }}>
                      {entry.meta}
                    </p>
                  )}
                </div>
                <span className="font-body text-[11px] tnum whitespace-nowrap ml-2" style={{ color: 'var(--ink-soft)' }}>
                  {entry.time}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bouton Abonnement */}
      <button 
        onClick={() => go('trial')}
        className="gold-btn w-full rounded-[8px] py-2.5 font-body tracking-caps text-[10px] uppercase"
      >
        {t('manageSub')}
      </button>
    </div>
  );
};

export default JournalScreen;