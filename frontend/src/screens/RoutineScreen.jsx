import React, { useEffect, useState, useRef } from 'react';
import { Sparkles, Play, Pause, Sun, Moon } from 'lucide-react';
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
        {run ? <Pause size={12} strokeWidth={1.8} /> : <Play size={12} strokeWidth={1.8} />}
        {run ? t('pause') : t('startTimer')}
      </button>
    </div>
  );
};

const RoutineScreen = ({ go, routinePhase }) => {
  const { t, lang } = useT();
  // Utilise la phase transmise (jour/matin ou soir), sinon par défaut 'jour'
  const [phase, setPhase] = useState(routinePhase || 'jour');
  const [routine, setRoutine] = useState(null);
  const [done, setDone] = useState({});
  const [open, setOpen] = useState({});

  // Réaligne la phase si la prop change
  useEffect(() => {
    if (routinePhase) setPhase(routinePhase);
  }, [routinePhase]);

  const load = (p) => {
    // Normalisation du paramètre si le backend attend 'matin' ou 'jour'
    const apiPhase = (p === 'jour' || p === 'matin') ? 'matin' : 'soir';
    api.get('/routine', { params: { phase: apiPhase, lang } }).then((r) => {
      setRoutine(r.data);
      setDone({});
      setOpen(r.data?.steps?.[0] ? { [r.data.steps[0].n]: true } : {});
    }).catch((e) => console.error("Erreur chargement routine", e));
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { 
    load(phase); 
  }, [phase, lang]);

  if (!routine) return <div className="px-6 pt-10 font-body" style={{ color: 'var(--ink-faint)' }}>…</div>;

  const total = routine.steps?.length || 0;
  const doneCount = Object.values(done).filter(Boolean).length;

  const finish = async () => {
    await api.post('/journal', { routine_type: routine.title, etapes_completees: doneCount, nb_total_etapes: total });
    go('journal');
  };

  return (
    <div className="px-6 pt-6 pb-12 animate-fade-up">
      <span className="font-body tracking-caps text-[10px] uppercase" style={{ color: 'var(--ink-faint)' }}>{routine.date_label}</span>
      <div className="flex items-start justify-between mt-1">
        <h2 className="font-display text-[26px] leading-tight">{routine.title}</h2>
        <span className="gold-btn rounded-full px-3 py-1 font-body tracking-caps text-[9px] uppercase whitespace-nowrap">
          {total} {t('steps')}
        </span>
      </div>

      {/* Sélecteur JOUR / SOIR */}
      <div className="grid grid-cols-2 mt-4 rounded-[8px] overflow-hidden p-1" style={{ border: '1px solid var(--line-strong)', background: 'var(--cream-card)' }}>
        <button 
          onClick={() => setPhase('jour')} 
          className={`py-2.5 flex items-center justify-center gap-1.5 font-body tracking-caps text-[10px] uppercase rounded-[6px] transition-all ${
            (phase === 'jour' || phase === 'matin') ? 'font-semibold' : ''
          }`}
          style={(phase === 'jour' || phase === 'matin') 
            ? { background: 'rgba(182,130,53,0.12)', color: 'var(--gold)' } 
            : { color: 'var(--ink-faint)' }}
        >
          <Sun size={13} />
          <span>{lang === 'fr' ? 'Jour' : 'Day'}</span>
        </button>

        <button 
          onClick={() => setPhase('soir')} 
          className={`py-2.5 flex items-center justify-center gap-1.5 font-body tracking-caps text-[10px] uppercase rounded-[6px] transition-all ${
            phase === 'soir' ? 'font-semibold' : ''
          }`}
          style={phase === 'soir' 
            ? { background: 'rgba(182,130,53,0.12)', color: 'var(--gold)' } 
            : { color: 'var(--ink-faint)' }}
        >
          <Moon size={13} />
          <span>{t('evening')}</span>
        </button>
      </div>

      {routine.banner && (
        <div className="flex gap-3 mt-5 rounded-[10px] p-4" style={{ background: 'var(--cream-card)', border: '1px solid var(--gold-soft)' }}>
          <Sparkles size={16} strokeWidth={1.5} className="mt-0.5 shrink-0" style={{ color: 'var(--gold)' }} />
          <p className="font-body text-[12.5px] leading-relaxed" style={{ color: 'var(--ink-soft)' }}>{routine.banner}</p>
        </div>
      )}

      {/* Liste des étapes */}
      <div className="mt-4">
        {routine.steps?.map((s) => {
          const isDone = done[s.n]; 
          const isOpen = open[s.n];
          return (
            <div key={s.n} className={`py-4 hairline ${isDone ? 'step-done' : ''}`}>
              <div className="flex gap-3">
                <button 
                  onClick={() => setDone((d) => ({ ...d, [s.n]: !d[s.n] }))} 
                  className="shrink-0 rounded-full flex items-center justify-center font-body text-[11px] tnum"
                  style={isDone ? { width: 30, height: 30, background: 'var(--gold)', color: '#fff', border: '1px solid var(--gold)' } : { width: 30, height: 30, color: 'var(--gold)', border: '1px solid var(--gold-soft)' }}
                >
                  {s.n}
                </button>
                <button onClick={() => setOpen((o) => ({ ...o, [s.n]: !o[s.n] }))} className="text-left flex-1">
                  <p className="step-title font-body text-[15px]">{s.title}</p>
                  <p className="step-sub font-body italic text-[12px] mt-0.5" style={{ color: 'var(--ink-faint)' }}>{s.sub}</p>
                </button>
              </div>
              {isOpen && (
                <div className="pl-[42px] mt-2 animate-fade-up">
                  <p className="font-body text-[12.5px] leading-relaxed" style={{ color: 'var(--ink-soft)' }}>{s.why}</p>
                  {s.timer && (
                    <>
                      <Timer seconds={s.timer.seconds} />
                      <p className="font-body italic text-[11.5px] leading-relaxed mt-2" style={{ color: 'var(--ink-faint)' }}>{s.timer.note}</p>
                    </>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Progression */}
      <div className="flex items-baseline justify-between mt-5">
        <span className="font-body text-[13px] tnum">{doneCount} {t('doneOf')} {total} {t('doneLabel')}</span>
        <span className="font-body tracking-caps text-[10px] uppercase" style={{ color: 'var(--ink-faint)' }}>{t('checkAlong')}</span>
      </div>
      <div className="h-px w-full mt-2" style={{ background: 'var(--line)' }}>
        <div className="h-px transition-all" style={{ width: `${total ? (doneCount / total) * 100 : 0}%`, background: 'var(--gold)' }} />
      </div>

      <button onClick={finish} className="gold-btn w-full rounded-[8px] py-3 mt-6 font-body tracking-caps text-[11px] uppercase">
        {t('routineDone')}
      </button>
    </div>
  );
};

export default RoutineScreen;
