import React, { useEffect, useState, useRef } from 'react';
import { Sparkles, Play, Pause, Sun, Moon, CheckCircle2, X, ChevronRight, ChevronLeft, Compass, List } from 'lucide-react';
import api from '../lib/api';
import { useT } from '../i18n';
import { isTimerFeedbackEnabled, playSoftChime, vibrateTimerEnd } from '../lib/timerFeedback';

const Timer = ({ seconds, onDone, label }) => {
  const { t, lang } = useT();
  const [rem, setRem] = useState(seconds);
  const [run, setRun] = useState(false);
  const [finished, setFinished] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (run && rem > 0) ref.current = setInterval(() => setRem((r) => (r <= 1 ? 0 : r - 1)), 1000);
    return () => clearInterval(ref.current);
  }, [run, rem]);

  // Nouveau minuteur (changement d'étape) : on réinitialise l'affichage
  useEffect(() => {
    setRem(seconds);
    setRun(false);
    setFinished(false);
  }, [seconds]);

  // Fin du minuteur : le feedback (son + vibration + message) ne se joue qu'une fois
  useEffect(() => {
    if (rem === 0 && !finished) {
      setRun(false);
      setFinished(true);
      if (onDone) onDone();
    }
  }, [rem, finished, onDone]);

  const mm = String(Math.floor(rem / 60)).padStart(2, '0');
  const ss = String(rem % 60).padStart(2, '0');

  return (
    <div className="mt-3">
      <div className="flex items-center gap-3">
        <span className="font-body tracking-caps text-[10px] uppercase" style={{ color: 'var(--ink-faint)' }}>{label || t('suggestedPause')}</span>
        <span className="font-display text-[20px] tnum">{mm} : {ss}</span>
        <button onClick={() => setRun((r) => !r)} className="gold-btn rounded-[6px] px-3 py-1.5 flex items-center gap-1.5 font-body tracking-caps text-[10px] uppercase">
          {run ? <Pause size={12} strokeWidth={1.8} /> : <Play size={12} strokeWidth={1.8} />}
          {run ? t('pause') : t('startTimer')}
        </button>
      </div>
      {finished && (
        <p className="font-body text-[12px] font-medium mt-2 animate-fade-up" style={{ color: 'var(--gold)' }}>
          ⏰ {lang === 'fr' ? "Temps écoulé ! Passe à l'étape suivante ✨" : "Time's up! Move on to the next step ✨"}
        </p>
      )}
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
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [skinRating, setSkinRating] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [guideMode, setGuideMode] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  // Fonction de retour haptique doux pour mobile
  const triggerHaptic = () => {
    if (typeof window !== 'undefined' && window.navigator && window.navigator.vibrate) {
      window.navigator.vibrate(40); // 40ms de vibration douce
    }
  };

  // Étape 7 — fin de minuteur : clochette douce + vibration (si activé dans le profil)
  const handleTimerEnd = () => {
    if (!isTimerFeedbackEnabled()) return;
    playSoftChime();
    vibrateTimerEnd();
  };

  // Réaligne la phase si la prop change
  useEffect(() => {
    if (routinePhase) setPhase(routinePhase);
  }, [routinePhase]);

  useEffect(() => {
    const load = (p) => {
      const apiPhase = (p === 'jour' || p === 'matin') ? 'matin' : 'soir';
      api.get('/routine', { params: { phase: apiPhase, lang } }).then((r) => {
        setRoutine(r.data);
        setDone({});
        setOpen(r.data?.steps?.[0] ? { [r.data.steps[0].n]: true } : {});
      }).catch((e) => console.error("Erreur chargement routine", e));
    };
    load(phase);
  }, [phase, lang]);

  if (!routine) return <div className="px-6 pt-10 font-body" style={{ color: 'var(--ink-faint)' }}>…</div>;

  const total = routine.steps?.length || 0;
  const doneCount = Object.values(done).filter(Boolean).length;

      const finish = () => {
    // Vérifie la préférence sauvegardée dans le Profil
    const pref = localStorage.getItem('solaia_track_skin');
    const trackFeel = pref !== null ? JSON.parse(pref) : true;

    if (trackFeel) {
      // Si activé : on ouvre la boîte de dialogue
      setShowRatingModal(true);
    } else {
      // Si désactivé : on enregistre directement en 1 clic sans pop-up !
      submitJournal(null);
    }
  };

  const submitJournal = async (rating = null) => {
    setIsSubmitting(true);
    try {
      await api.post('/journal', {
        routine_type: routine.title,
        etapes_completees: doneCount,
        nb_total_etapes: total,
        note_peau: rating,
      });
      setShowRatingModal(false);
      // Redirige vers le journal
      if (go) go('journal');
    } catch (e) {
      console.error("Erreur enregistrement journal :", e);
    } finally {
      setIsSubmitting(false);
    }
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

      {/* Sélecteur Mode : Liste vs Rituel Guidé */}
      <div className="flex justify-end mt-3">
        <button
          onClick={() => { setGuideMode(!guideMode); triggerHaptic(); }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full font-body text-[11px] font-medium transition-all"
          style={guideMode 
            ? { background: 'var(--gold)', color: '#fff' }
            : { background: 'var(--cream-card)', border: '1px solid var(--line)', color: 'var(--ink)' }}
        >
          {guideMode ? <List size={13} /> : <Compass size={13} />}
          <span>{guideMode ? (lang === 'fr' ? 'Vue Liste' : 'List View') : (lang === 'fr' ? 'Rituel Guidé ✨' : 'Guided Ritual ✨')}</span>
        </button>
      </div>

            {/* Contenu : Mode Rituel Guidé OU Mode Liste */}
      {guideMode ? (
        /* ===== MODE RITUEL GUIDÉ (Plein écran & pas à pas) ===== */
        <div className="mt-4 p-6 rounded-[24px] space-y-5 animate-fade-up shadow-sm text-center" style={{ background: 'var(--cream-card)', border: '1.5px solid var(--gold-soft)' }}>
          {routine.steps && routine.steps[currentStepIndex] && (() => {
            const step = routine.steps[currentStepIndex];
            const isStepDone = done[step.n];

            return (
              <>
                <div className="flex items-center justify-between font-body text-[11px] tracking-caps uppercase" style={{ color: 'var(--gold)' }}>
                  <span>{lang === 'fr' ? 'Étape' : 'Step'} {step.n} / {total}</span>
                  <span className="px-2 py-0.5 rounded-full" style={{ background: 'rgba(182,130,53,0.1)' }}>
                    {isStepDone ? '✓ ' + (lang === 'fr' ? 'Fait' : 'Done') : (lang === 'fr' ? 'En cours' : 'In progress')}
                  </span>
                </div>

                <div className="py-2">
                  <h3 className="font-display text-[22px] leading-snug" style={{ color: 'var(--ink)' }}>{step.title}</h3>
                  <p className="font-body italic text-[13px] mt-1" style={{ color: 'var(--gold)' }}>{step.sub}</p>
                </div>

                <div className="p-4 rounded-[16px] text-left" style={{ background: '#FAF6F0' }}>
                  <p className="font-body text-[13px] leading-relaxed" style={{ color: 'var(--ink-soft)' }}>{step.why}</p>
                  {step.timer && (
                    <div className="mt-3 pt-3 border-t border-stone-200">
                      <Timer seconds={step.timer.seconds} onDone={handleTimerEnd} label={step.timer.label} />
                      <p className="font-body italic text-[11px] mt-1" style={{ color: 'var(--ink-faint)' }}>{step.timer.note}</p>
                    </div>
                  )}
                </div>

                {/* Validation de l'étape en cours */}
                <button
                  onClick={() => {
                    triggerHaptic();
                    setDone((d) => ({ ...d, [step.n]: !d[step.n] }));
                  }}
                  className="w-full py-3 rounded-[12px] font-body text-[12px] font-medium uppercase tracking-caps flex items-center justify-center gap-2 transition-all"
                  style={isStepDone 
                    ? { background: 'var(--gold)', color: '#fff' } 
                    : { background: '#fff', border: '1.5px solid var(--gold)', color: 'var(--gold)' }}
                >
                  <CheckCircle2 size={16} />
                  <span>{isStepDone ? (lang === 'fr' ? 'Étape validée ✓' : 'Step completed ✓') : (lang === 'fr' ? 'Marquer comme fait' : 'Mark as done')}</span>
                </button>

                {/* Navigation entre les étapes */}
                <div className="flex items-center justify-between pt-2">
                  <button
                    disabled={currentStepIndex === 0}
                    onClick={() => { setCurrentStepIndex((i) => Math.max(0, i - 1)); triggerHaptic(); }}
                    className="p-2.5 rounded-full disabled:opacity-30"
                    style={{ background: '#FAF6F0', color: 'var(--ink)' }}
                  >
                    <ChevronLeft size={20} />
                  </button>

                  <div className="flex gap-1.5">
                    {routine.steps.map((_, idx) => (
                      <div
                        key={idx}
                        className="w-2 h-2 rounded-full transition-all"
                        style={{
                          background: idx === currentStepIndex ? 'var(--gold)' : done[routine.steps[idx].n] ? 'var(--gold-soft)' : 'var(--line)',
                          transform: idx === currentStepIndex ? 'scale(1.3)' : 'scale(1)'
                        }}
                      />
                    ))}
                  </div>

                  {currentStepIndex < total - 1 ? (
                    <button
                      onClick={() => { setCurrentStepIndex((i) => Math.min(total - 1, i + 1)); triggerHaptic(); }}
                      className="p-2.5 rounded-full"
                      style={{ background: '#FAF6F0', color: 'var(--ink)' }}
                    >
                      <ChevronRight size={20} />
                    </button>
                  ) : (
                    <button
                      onClick={finish}
                      className="px-4 py-2 rounded-full font-body text-[11px] uppercase tracking-caps text-white gold-btn"
                    >
                      {lang === 'fr' ? 'Finir ✨' : 'Finish ✨'}
                    </button>
                  )}
                </div>
              </>
            );
          })()}
        </div>
      ) : (
        /* ===== MODE LISTE CLASSIQUE ===== */
        <div className="mt-4">
          {routine.steps?.map((s) => {
            const isDone = done[s.n]; 
            const isOpen = open[s.n];
            return (
              <div key={s.n} className={`py-4 hairline ${isDone ? 'step-done' : ''}`}>
                <div className="flex gap-3">
                  <button 
                    onClick={() => {
                      triggerHaptic();
                      setDone((d) => ({ ...d, [s.n]: !d[s.n] }));
                    }} 
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
                        <Timer seconds={s.timer.seconds} onDone={handleTimerEnd} label={s.timer.label} />
                        <p className="font-body italic text-[11.5px] leading-relaxed mt-2" style={{ color: 'var(--ink-faint)' }}>{s.timer.note}</p>
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

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

                  {/* Modal de Sensation de la peau à 4 humeurs */}
      {showRatingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/40 backdrop-blur-xs animate-fade-up">
          <div className="w-full max-w-sm p-6 rounded-[24px] space-y-4 shadow-2xl text-center" style={{ background: '#FAF6F0', border: '1px solid var(--line)' }}>
            <div className="flex justify-between items-center">
              <h3 className="font-display text-[19px]" style={{ color: 'var(--ink)' }}>
                {lang === 'fr' ? "Comment se sent ta peau ?" : "How does your skin feel?"}
              </h3>
              <button onClick={() => setShowRatingModal(false)} className="p-1 rounded-full text-stone-400">
                <X size={18} />
              </button>
            </div>
            
            <p className="font-body text-[12px]" style={{ color: 'var(--ink-soft)' }}>
              {lang === 'fr'
                ? "Ton retour affine mes recommandations pour tes prochains soins."
                : "Your feedback tunes my next routine recommendations."}
            </p>

            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <button
                onClick={() => submitJournal(5)}
                disabled={isSubmitting}
                className="p-3 rounded-[14px] flex flex-col items-center gap-1 transition-all active:scale-95 bg-white border border-stone-200 hover:border-amber-400 shadow-xs"
              >
                <span className="text-[24px]">✨</span>
                <span className="font-display text-[12px] font-semibold" style={{ color: 'var(--ink)' }}>
                  {lang === 'fr' ? "Éclatante" : "Glowing"}
                </span>
                <span className="font-body text-[10px] text-stone-400">Glowy & lumineuse</span>
              </button>

              <button
                onClick={() => submitJournal(4)}
                disabled={isSubmitting}
                className="p-3 rounded-[14px] flex flex-col items-center gap-1 transition-all active:scale-95 bg-white border border-stone-200 hover:border-blue-400 shadow-xs"
              >
                <span className="text-[24px]">💧</span>
                <span className="font-display text-[12px] font-semibold" style={{ color: 'var(--ink)' }}>
                  {lang === 'fr' ? "Hydratée" : "Hydrated"}
                </span>
                <span className="font-body text-[10px] text-stone-400">Souple & rebondie</span>
              </button>

              <button
                onClick={() => submitJournal(3)}
                disabled={isSubmitting}
                className="p-3 rounded-[14px] flex flex-col items-center gap-1 transition-all active:scale-95 bg-white border border-stone-200 hover:border-emerald-400 shadow-xs"
              >
                <span className="text-[24px]">🌿</span>
                <span className="font-display text-[12px] font-semibold" style={{ color: 'var(--ink)' }}>
                  {lang === 'fr' ? "Apaisée" : "Soothed"}
                </span>
                <span className="font-body text-[10px] text-stone-400">Calme & fraîche</span>
              </button>

              <button
                onClick={() => submitJournal(1)}
                disabled={isSubmitting}
                className="p-3 rounded-[14px] flex flex-col items-center gap-1 transition-all active:scale-95 bg-white border border-stone-200 hover:border-rose-400 shadow-xs"
              >
                <span className="text-[24px]">😣</span>
                <span className="font-display text-[12px] font-semibold" style={{ color: 'var(--ink)' }}>
                  {lang === 'fr' ? "Tiraillements" : "Tight"}
                </span>
                <span className="font-body text-[10px] text-stone-400">Inconfort / sèche</span>
              </button>
            </div>

            <button
              onClick={() => submitJournal(null)}
              disabled={isSubmitting}
              className="mt-2 text-stone-400 font-body text-[11px] underline uppercase tracking-caps"
            >
              {lang === 'fr' ? "Passer sans noter" : "Skip rating"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoutineScreen;
