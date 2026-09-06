import React, { useEffect, useState } from 'react';
import { Calendar, CalendarDays } from 'lucide-react';
import api from '../lib/api';
import { useT } from '../i18n';

const JournalScreen = ({ go }) => {
  const { t, lang } = useT();
  const [periode, setPeriode] = useState('week'); // 'week' | 'month'
  const [data, setData] = useState(null);

  useEffect(() => {
    let active = true;
    api.get('/journal', { params: { periode, lang } })
      .then((r) => { if (active) setData(r.data); })
      .catch(() => {});
    return () => { active = false; };
  }, [periode, lang]);

  if (!data) {
    return <div className="px-6 pt-10 font-body" style={{ color: 'var(--ink-faint)' }}>…</div>;
  }

  const days = Array.isArray(data.days) ? data.days : [];
  const entries = Array.isArray(data.entries) ? data.entries : [];
  const stats = Array.isArray(data.stats) ? data.stats : [];

  return (
    <div className="px-6 pt-6 pb-28 max-h-screen overflow-y-auto animate-fade-up space-y-6">
      {/* En-tête */}
      <div>
        <span className="font-body tracking-caps text-[10px] uppercase" style={{ color: 'var(--ink-faint)' }}>
          {t('nav.journal')}
        </span>
        <h2 className="font-display text-[28px] mt-1">{t('holdRhythm')}</h2>
      </div>

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
                  <p className="font-body text-[13.5px] font-medium">{entry.title}</p>
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
