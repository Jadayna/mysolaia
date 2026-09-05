import React, { useState } from 'react';
import { useT } from '../i18n';
import { useAuth } from '../context/AuthContext';

const OnboardingScreen = () => {
  const { t, lang } = useT();
  const { saveProfile } = useAuth();
  const [skin, setSkin] = useState('');
  const [sens, setSens] = useState(1);
  const [goals, setGoals] = useState([]);
  const [busy, setBusy] = useState(false);

  const skinTypes = lang === 'fr'
    ? [['seche', 'Sèche'], ['mixte', 'Mixte'], ['grasse', 'Grasse'], ['normale', 'Normale']]
    : [['seche', 'Dry'], ['mixte', 'Combination'], ['grasse', 'Oily'], ['normale', 'Normal']];
  const sensLabels = lang === 'fr'
    ? ['Pas du tout', 'Un peu', 'Assez', 'Très']
    : ['Not at all', 'A little', 'Fairly', 'Very'];
  const goalOpts = lang === 'fr'
    ? [['hydratation', 'Hydratation'], ['imperfections', 'Imperfections'], ['eclat', 'Éclat'], ['rides', 'Rides'], ['taches', 'Taches'], ['apaiser', 'Apaiser']]
    : [['hydratation', 'Hydration'], ['imperfections', 'Blemishes'], ['eclat', 'Glow'], ['rides', 'Fine lines'], ['taches', 'Dark spots'], ['apaiser', 'Soothe']];

  const toggleGoal = (g) => setGoals((cur) => cur.includes(g) ? cur.filter((x) => x !== g) : [...cur, g]);

  const finish = async () => {
    setBusy(true);
    // On récupère automatiquement le timezone local de l'utilisateur
    const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    
    await saveProfile({ 
      type_de_peau: skin || 'normale', 
      sensibilite: sens, 
      objectifs: goals, 
      langue: lang,
      timezone: userTimezone
    });
    setBusy(false);
  };

  return (
    <div className="app-shell">
      <div className="flex-1 overflow-y-auto px-7 pt-14 pb-10">
        <h1 className="font-display text-[34px] leading-tight">{t('onbTitle')}</h1>

        <p className="font-body tracking-caps text-[10px] uppercase mt-9" style={{ color: 'var(--ink-faint)' }}>{t('skinType')}</p>
        <div className="grid grid-cols-2 gap-2.5 mt-3">
          {skinTypes.map(([v, label]) => (
            <button key={v} onClick={() => setSkin(v)} className="rounded-[8px] py-3 font-body text-[14px]"
              style={skin === v ? { border: '1px solid var(--gold)', color: 'var(--gold)', background: 'rgba(182,130,53,0.05)' } : { border: '1px solid var(--line-strong)', color: 'var(--ink-soft)' }}>
              {label}
            </button>
          ))}
        </div>

        <p className="font-body tracking-caps text-[10px] uppercase mt-8" style={{ color: 'var(--ink-faint)' }}>{t('sensitivity')}</p>
        <div className="grid grid-cols-4 gap-2 mt-3">
          {sensLabels.map((label, i) => (
            <button key={i} onClick={() => setSens(i)} className="rounded-[8px] py-3 font-body text-[12px]"
              style={sens === i ? { border: '1px solid var(--gold)', color: 'var(--gold)', background: 'rgba(182,130,53,0.05)' } : { border: '1px solid var(--line-strong)', color: 'var(--ink-soft)' }}>
              {label}
            </button>
          ))}
        </div>

        <p className="font-body tracking-caps text-[10px] uppercase mt-8" style={{ color: 'var(--ink-faint)' }}>{t('goals')}</p>
        <div className="flex flex-wrap gap-2.5 mt-3">
          {goalOpts.map(([v, label]) => (
            <button key={v} onClick={() => toggleGoal(v)} className="rounded-full px-4 py-2 font-body text-[13px]"
              style={goals.includes(v) ? { border: '1px solid var(--gold)', color: 'var(--gold)', background: 'rgba(182,130,53,0.05)' } : { border: '1px solid var(--line-strong)', color: 'var(--ink-soft)' }}>
              {label}
            </button>
          ))}
        </div>

        <button onClick={finish} disabled={busy} className="gold-btn w-full rounded-[12px] py-3.5 mt-12 font-body tracking-caps text-[11px] uppercase font-semibold text-white" style={{ background: '#A37B68' }}>
          {t('continue')}
        </button>
      </div>
    </div>
  );
};

export default OnboardingScreen;
