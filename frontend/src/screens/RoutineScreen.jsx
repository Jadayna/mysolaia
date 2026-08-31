import React, { useEffect, useState, useRef } from 'react';
import { Sparkles, Play, Pause } from 'lucide-react';
import api from '../lib/api';
import { useT } from '../i18n';

const Timer = ({ seconds }) => {
  const { t } = useT();
  const [rem, setRem] = useState(seconds);
  const [run, setRun] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (run && rem > 0) ref.current = setInterval(() => setRem((r) => (r <= 1 ? 0 : r - 1)), 1000);
    return () => clearInterval(ref.current);
  }, [run, rem]);
  useEffect(() => { if (rem === 0) setRun(false); }, [rem]);
  const mm = String(Math.floor(rem / 60)).padStart(2, '0');
  const ss = String(rem % 60).padStart(2, '0');
  return (
    <div className="flex items-center gap-3 mt-3">
      <span className="font-body tracking-caps text-[10px] uppercase" style={{ color: 'var(--ink-faint)' }}>{t('suggestedPause')}</span>
      <span className="font-display text-[20px] tnum">{mm} : {ss}</span>
      <button onClick={() => setRun((r) => !r)} className="gold-btn rounded-[6px] px-3 py-1.5 flex items-center gap-1.5 font-body tracking-caps text-[10px] uppercase">
        {run ? <Pause size={12} strokeWidth={1.8} /> : <Play size={12} strokeWidth={1.8} />}{run ? t('pause') : t('startTimer')}
      </button>
    </div>
  );
};

const RoutineScreen = ({ go, routinePhase }) => {
  const { t } = useT();
  const [phase, setPhase] = useState(routinePhase || 'soir');
  const [routine, setRoutine] = useState(null);
  const [done, setDone] = useState({});
  const [open, setOpen] = useState({});

  const load = (p) => api.get('/routine', { params: { phase: p } }).then((r) => {
    setRoutine(r.data); setDone({}); setOpen(r.data.steps[0] ? { [r.data.steps[0].n]: true } : {});
  });
  useEffect(() => { load(phase); }, [phase]);
  if (!routine) return <div className="px-6 pt-10 font-body" style={{ color: 'var(--ink-faint)' }}>…</div>;

  const total = routine.steps.length;
  const doneCount = Object.values(done).filter(Boolean).length;

  const finish = async () => {
    await api.post('/journal', { routine_type: routine.title, etapes_completees: doneCount, nb_total_etapes: total });
    go('journal');
  };

  return (
    <div className="px-6 pt-6 animate-fade-up">
      <span className="font-body tracking-caps text-[10px] uppercase" style={{ color: 'var(--ink-faint)' }}>{routine.date_label}</span>
      <div className="flex items-start justify-between mt-1">
        <h2 className="font-display text-[26px] leading-tight">{routine.title}</h2>
        <span className="gold-btn rounded-full px-3 py-1 font-body tracking-caps text-[9px] uppercase whitespace-nowrap">{total} {t('steps')}</span>
      </div>

      <div className="grid grid-cols-2 mt-4 rounded-[8px] overflow-hidden" style={{ border: '1px solid var(--line-strong)' }}>
        {[['matin', t('morning')], ['soir', t('evening')]].map(([p, label]) => (
          <button key={p} onClick={() => setPhase(p)} className="py-2.5 font-body tracking-caps text-[10px] uppercase"
            style={phase === p ? { background: 'rgba(182,130,53,0.08)', color: 'var(--gold)' } : { color: 'var(--ink-faint)' }}>{label}</button>
        ))}
      </div>

      {routine.banner && (
        <div className="flex gap-3 mt-5 rounded-[10px] p-4" style={{ background: 'var(--cream-card)', border: '1px solid var(--gold-soft)' }}>
          <Sparkles size={16} strokeWidth={1.5} className="mt-0.5 shrink-0" style={{ color: 'var(--gold)' }} />
          <p className="font-body text-[12.5px] leading-relaxed" style={{ color: 'var(--ink-soft)' }}>{routine.banner}</p>
        </div>
      )}

      <div className="mt-4">
        {routine.steps.map((s) => {
          const isDone = done[s.n]; const isOpen = open[s.n];
          return (
            <div key={s.n} className={`py-4 hairline ${isDone ? 'step-done' : ''}`}>
              <div className="flex gap-3">
                <button onClick={() => setDone((d) => ({ ...d, [s.n]: !d[s.n] }))} className="shrink-0 rounded-full flex items-center justify-center font-body text-[11px] tnum"
                  style={isDone ? { width: 30, height: 30, background: 'var(--gold)', color: '#fff', border: '1px solid var(--gold)' } : { width: 30, height: 30, color: 'var(--gold)', border: '1px solid var(--gold-soft)' }}>{s.n}</button>
                <button onClick={() => setOpen((o) => ({ ...o, [s.n]: !o[s.n] }))} className="text-left flex-1">
                  <p className="step-title font-body text-[15px]">{s.title}</p>
                  <p className="step-sub font-body italic text-[12px] mt-0.5" style={{ color: 'var(--ink-faint)' }}>{s.sub}</p>
                </button>
              </div>
              {isOpen && (
                <div className="pl-[42px] mt-2 animate-fade-up">
                  <p className="font-body text-[12.5px] leading-relaxed" style={{ color: 'var(--ink-soft)' }}>{s.why}</p>
                  {s.timer && (<><Timer seconds={s.timer.seconds} /><p className="font-body italic text-[11.5px] leading-relaxed mt-2" style={{ color: 'var(--ink-faint)' }}>{s.timer.note}</p></>)}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex items-baseline justify-between mt-5">
        <span className="font-body text-[13px] tnum">{doneCount} {t('doneOf')} {total} {t('doneLabel')}</span>
        <span className="font-body tracking-caps text-[10px] uppercase" style={{ color: 'var(--ink-faint)' }}>{t('checkAlong')}</span>
      </div>
      <div className="h-px w-full mt-2" style={{ background: 'var(--line)' }}>
        <div className="h-px transition-all" style={{ width: `${total ? (doneCount / total) * 100 : 0}%`, background: 'var(--gold)' }} />
      </div>

      <button onClick={finish} className="gold-btn w-full rounded-[8px] py-3 mt-6 font-body tracking-caps text-[11px] uppercase">{t('routineDone')}</button>
    </div>
  );
};

export default RoutineScreen;
