import React, { useEffect, useState } from 'react';
import api from '../lib/api';
import { useT } from '../i18n';

const JournalScreen = ({ go }) => {
  const { t } = useT();
  const [data, setData] = useState(null);
  useEffect(() => { api.get('/journal').then((r) => setData(r.data)).catch(() => {}); }, []);
  if (!data) return <div className="px-6 pt-10 font-body" style={{ color: 'var(--ink-faint)' }}>…</div>;

  return (
    <div className="px-6 pt-6 animate-fade-up">
      <span className="font-body tracking-caps text-[10px] uppercase" style={{ color: 'var(--ink-faint)' }}>{t('nav.journal')}</span>
      <h2 className="font-display text-[28px] mt-1">{t('holdRhythm')}</h2>

      <div className="mt-6">
        <div className="flex items-end justify-between gap-[3px]" style={{ height: 70 }}>
          {data.days.map((day, i) => (
            <div key={i} className="flex-1 flex flex-col justify-end gap-[3px] h-full">
              <div className="rounded-[2px]" style={{ height: day.matin ? 22 : 6, background: day.matin ? 'var(--gold-soft)' : 'var(--line)' }} />
              <div className="rounded-[2px]" style={{ height: day.soir ? 34 : 6, background: day.soir ? 'var(--gold)' : 'var(--line)' }} />
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-1.5">
          {data.days.map((day, i) => (<span key={i} className="flex-1 text-center font-body text-[9px] tnum" style={{ color: 'var(--ink-faint)' }}>{day.d}</span>))}
        </div>
      </div>

      <div className="flex items-center gap-5 mt-4">
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-[2px]" style={{ background: 'var(--gold-soft)' }} /><span className="font-body tracking-caps text-[9px] uppercase" style={{ color: 'var(--ink-faint)' }}>{t('morning')}</span></span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-[2px]" style={{ background: 'var(--gold)' }} /><span className="font-body tracking-caps text-[9px] uppercase" style={{ color: 'var(--ink-faint)' }}>{t('evening')}</span></span>
      </div>

      <div className="grid grid-cols-3 gap-3 mt-7 pt-6" style={{ borderTop: '1px solid var(--line)' }}>
        {data.stats.map((s, i) => (
          <div key={i}>
            <p className="font-display text-[32px] leading-none tnum">{s.n}</p>
            <p className="font-body tracking-caps text-[9px] uppercase mt-2" style={{ color: 'var(--ink-faint)' }}>{[t('daysStreak'), t('careThirty'), t('exfoThirty')][i]}</p>
          </div>
        ))}
      </div>

      <div className="mt-7 rounded-[10px] p-4" style={{ border: '1px solid var(--line)' }}>
        <span className="font-body tracking-caps text-[10px] uppercase" style={{ color: 'var(--gold)' }}>{t('whatINotice')}</span>
        <p className="font-body text-[12.5px] leading-relaxed mt-2" style={{ color: 'var(--ink-soft)' }}>{data.observation}</p>
      </div>

      <div className="mt-7">
        <span className="font-body tracking-caps text-[10px] uppercase" style={{ color: 'var(--ink-faint)' }}>{t('lastEntries')}</span>
        {data.entries.length === 0 && <p className="font-body italic text-[13px] mt-3" style={{ color: 'var(--ink-faint)' }}>{t('demoNote')}</p>}
        {data.entries.map((e, i) => (
          <div key={i} className="flex justify-between items-start py-3.5 mt-1 hairline">
            <div><p className="font-body text-[14px]">{e.title}</p><p className="font-body italic text-[11.5px] mt-0.5" style={{ color: 'var(--ink-faint)' }}>{e.meta}</p></div>
            <span className="font-body text-[13px] tnum" style={{ color: 'var(--ink-soft)' }}>{e.time}</span>
          </div>
        ))}
      </div>

      <button onClick={() => go('essai')} className="gold-btn w-full rounded-[8px] py-2.5 mt-8 font-body tracking-caps text-[10px] uppercase">{t('manageSub')}</button>
    </div>
  );
};

export default JournalScreen;
