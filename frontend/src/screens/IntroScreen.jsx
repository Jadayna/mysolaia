import React, { useState } from 'react';
import { Sparkles, Camera, ListChecks, LineChart, ArrowRight } from 'lucide-react';
import { useT } from '../i18n';

// Cartes d'intro — première utilisation uniquement, jamais re-montrées.
// Placées après la création du compte, avant le quiz « Parle-moi de ta peau ».
// Pas de mention de l'essai gratuit (décision produit).
const CARDS = [
  {
    icon: Sparkles,
    fr: { title: 'Bienvenue sur MySolaia', text: 'La routine qui se construit toute seule.' },
    en: { title: 'Welcome to MySolaia', text: 'The routine that builds itself.' },
  },
  {
    icon: Camera,
    fr: { title: 'Scanne tes produits', text: 'Photographie tes flacons : l\u2019IA identifie le produit, ses actifs et sa dur\u00e9e de conservation.' },
    en: { title: 'Scan your products', text: 'Snap your bottles: AI identifies the product, its actives and shelf life.' },
  },
  {
    icon: ListChecks,
    fr: { title: 'Ta routine matin & soir', text: 'Ordre d\u2019application, conflits d\u2019actifs, exfoliation : tout est calcul\u00e9 pour toi.' },
    en: { title: 'Your morning & evening routine', text: 'Application order, active conflicts, exfoliation: all figured out for you.' },
  },
  {
    icon: LineChart,
    fr: { title: 'Suis ta peau jour apr\u00e8s jour', text: 'Journal, minuteurs et rappels pour rester r\u00e9guli\u00e8re sans y penser.' },
    en: { title: 'Track your skin day by day', text: 'Journal, timers and reminders to stay consistent without thinking about it.' },
  },
];

const IntroScreen = ({ onDone }) => {
  const { lang } = useT();
  const [index, setIndex] = useState(0);
  const last = index === CARDS.length - 1;
  const L = lang === 'fr'
    ? { next: 'Suivant', skip: 'Passer', cta: 'Scanner mon premier produit' }
    : { next: 'Next', skip: 'Skip', cta: 'Scan my first product' };

  const finish = (goToScan) => {
    try {
      localStorage.setItem('mysolaia_intro_seen', '1');
      if (goToScan) sessionStorage.setItem('solaia_active_tab', 'scan');
    } catch (e) { /* stockage indisponible : on continue quand même */ }
    onDone();
  };

  const { icon: Icon, fr, en } = CARDS[index];
  const copy = lang === 'fr' ? fr : en;

  return (
    <div className="app-shell">
      <div className="flex-1 flex flex-col px-7 pt-6 pb-10" style={{ background: '#FAF6F0' }}>
        <div className="flex justify-end">
          <button
            onClick={() => finish(false)}
            className="font-body text-[13px] py-2 px-1"
            style={{ color: 'var(--ink-faint)' }}
          >
            {L.skip}
          </button>
        </div>

        <div key={index} className="flex-1 flex flex-col items-center justify-center text-center animate-fade-up px-2">
          <div
            className="w-24 h-24 rounded-full flex items-center justify-center mb-8"
            style={{ background: 'rgba(163,123,104,0.12)' }}
          >
            <Icon size={40} style={{ color: '#A37B68' }} strokeWidth={1.5} />
          </div>
          <h1 className="font-display text-[28px] leading-tight" style={{ color: 'var(--ink)' }}>
            {copy.title}
          </h1>
          <p className="font-body text-[15px] leading-relaxed mt-4 max-w-[280px]" style={{ color: 'var(--ink-soft)' }}>
            {copy.text}
          </p>
        </div>

        <div className="flex items-center justify-center gap-2 mb-8">
          {CARDS.map((_, i) => (
            <span
              key={i}
              className="rounded-full transition-all"
              style={{
                width: i === index ? 24 : 8,
                height: 8,
                background: i === index ? '#A37B68' : 'var(--line-strong)',
              }}
            />
          ))}
        </div>

        <button
          onClick={() => (last ? finish(true) : setIndex(index + 1))}
          className="w-full rounded-[12px] py-3.5 font-body text-[12px] uppercase font-semibold text-white flex items-center justify-center gap-2"
          style={{ background: '#A37B68', letterSpacing: '0.08em' }}
        >
          {last ? L.cta : L.next}
          {last && <ArrowRight size={16} />}
        </button>
      </div>
    </div>
  );
};

export default IntroScreen;
