import React, { useState, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useT } from '../i18n';
import api from '../lib/api';

// Étape 8 — Guide des produits capricieux (extrait de l'Aide : écran dédié accessible depuis le menu)
const TrickyGuideScreen = ({ go }) => {
  const { lang } = useT();
  const [guide, setGuide] = useState([]);

  useEffect(() => {
    api.get(`/knowledge/tricky?lang=${lang}`).then(({ data }) => {
      setGuide(data?.familles || []);
    }).catch(() => {});
  }, [lang]);

  return (
    <div className="px-6 pt-6 pb-28 max-h-screen overflow-y-auto space-y-6 animate-fade-up">
      <div className="flex items-center gap-3">
        <button onClick={() => go('accueil')} className="p-2 rounded-full border" style={{ borderColor: 'var(--line)', background: 'var(--cream-card)' }}>
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="font-display text-[24px]" style={{ color: 'var(--ink)' }}>
            {lang === 'fr' ? 'Produits capricieux 🧪' : 'Tricky products 🧪'}
          </h1>
          <p className="font-body text-[12px]" style={{ color: 'var(--ink-faint)' }}>
            {lang === 'fr' ? "Mode d'emploi des actifs puissants" : 'How to use powerful actives'}
          </p>
        </div>
      </div>

      <p className="font-body text-[12px] leading-relaxed" style={{ color: 'var(--ink-soft)' }}>
        {lang === 'fr'
          ? "Ces actifs puissants demandent un mode d'emploi. Retrouve leurs conseils aussi dans la fiche de chaque produit concerné."
          : "These powerful actives need a manual. You'll also find their tips in each concerned product's card."}
      </p>

      <div className="space-y-3">
        {guide.map((fam) => (
          <div key={fam.key} className="p-4 rounded-[16px] space-y-2" style={{ background: 'var(--cream-card)', border: '1px solid var(--gold-soft)' }}>
            <p className="font-display text-[15px] font-medium" style={{ color: 'var(--ink)' }}>{fam.emoji} {fam.titre}</p>
            <p className="font-body text-[12px] italic" style={{ color: 'var(--ink-soft)' }}>{fam.intro}</p>
            <ul className="space-y-1">
              {fam.conseils.map((c, i) => (
                <li key={i} className="font-body text-[12.5px] leading-snug" style={{ color: 'var(--ink-soft)' }}>• {c}</li>
              ))}
            </ul>
            <div className="pt-1 space-y-1">
              {fam.a_eviter.map((w, i) => (
                <p key={i} className="font-body text-[12.5px]" style={{ color: '#c0392b' }}>🚫 {w}</p>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TrickyGuideScreen;
