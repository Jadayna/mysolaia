import React, { useEffect, useState } from 'react';
import { Moon, Sun, Camera, ArrowRight, Sparkles } from 'lucide-react';
import api from '../lib/api';
import { useT } from '../i18n';
import { useAuth } from '../context/AuthContext';

const CAT_FR = { 
  nettoyant: 'Nettoyant', 
  exfoliant: 'Exfoliant', 
  serum: 'Sérum', 
  yeux: 'Yeux', 
  hydratant: 'Hydratant', 
  spf: 'SPF', 
  levres: 'Lèvres', 
  cils_sourcils: 'Cils & sourcils', 
  traitement_cible: 'Ciblé' 
};

const HomeScreen = ({ go }) => {
  const { t, lang } = useT();
  const { user } = useAuth();
  const [data, setData] = useState(null);

  useEffect(() => { 
    api.get('/home').then((r) => setData(r.data)).catch(() => {}); 
  }, []);

  if (!data) return <div className="px-6 pt-10 font-body text-center" style={{ color: 'var(--ink-faint)' }}>…</div>;

  const rawName = user?.prenom || (user?.email || '').split('@')[0];
  const nameCap = rawName.charAt(0).toUpperCase() + rawName.slice(1);
  const evening = data.greeting_kind === 'soir';
  const greet = evening ? t('greetingEvening') : t('greetingMorning');
  const r = data.routine;

  const headline = () => {
    const tt = (r.title || '').toLowerCase();
    if (lang === 'fr') {
      if (tt.includes('sans exfoliation')) return ['Ce soir, ', 'on garde ça simple'];
      if (tt.includes('avec exfoliation')) return ['Ce soir, ', 'on exfolie en douceur'];
      return ['Ce matin, ', 'on protège la peau'];
    }
    if (tt.includes('sans exfoliation')) return ['Tonight, ', 'we keep it simple'];
    if (tt.includes('avec exfoliation')) return ['Tonight, ', 'we exfoliate gently'];
    return ['This morning, ', 'we protect the skin'];
  };
  const [hPrefix, hPhrase] = headline();

  return (
    <div className="px-6 pt-6 pb-24 animate-fade-up">
      {/* Salutation + Prénom */}
      <span className="font-body tracking-caps text-[11px] uppercase font-medium" style={{ color: 'var(--ink-faint)' }}>
        {greet}, {nameCap}
      </span>
      <h2 className="font-display text-[32px] leading-[1.15] mt-1.5" style={{ color: '#A37B68' }}>
        {hPrefix}<span className="italic font-normal">{hPhrase}</span>
      </h2>

      {/* Carte Routine principale */}
      <div className="mt-6 rounded-[20px] p-6 shadow-sm" style={{ background: 'var(--cream-card)', border: '1px solid var(--line)' }}>
        <div className="flex items-center gap-2">
          {evening ? (
            <Moon size={15} style={{ color: '#A37B68' }} />
          ) : (
            <Sun size={15} style={{ color: '#A37B68' }} />
          )}
          <span className="font-body tracking-caps text-[10px] uppercase font-semibold" style={{ color: '#B59B8D' }}>
            {evening ? t('tonight') : t('thisMorning')}
          </span>
        </div>

        <h3 className="font-display text-[22px] mt-2" style={{ color: '#A37B68' }}>{r.title}</h3>
        
        {r.banner && (
          <p className="font-body text-[13.5px] leading-relaxed mt-2" style={{ color: '#8C6250' }}>
            {r.banner}
          </p>
        )}

        <button 
          onClick={() => go('routine', { phase: r.phase })} 
          className="w-full rounded-[14px] py-3.5 mt-5 font-body tracking-caps text-[11px] uppercase font-semibold text-white flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
          style={{ background: '#A37B68', boxShadow: '0 4px 12px rgba(163, 123, 104, 0.2)' }}
        >
          <span>{t('start')} · {r.total} {t('steps')}</span>
          <ArrowRight size={14} />
        </button>
      </div>

      {/* Étagère de soins / Vanité */}
      <div className="flex items-baseline justify-between mt-9">
        <span className="font-body tracking-caps text-[10px] uppercase font-semibold" style={{ color: 'var(--ink-faint)' }}>
          {t('shelf')}
        </span>
        <span className="font-body text-[12px] tnum font-medium" style={{ color: 'var(--ink-faint)' }}>
          {data.shelf_count} {t('products')}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 mt-3">
        {data.shelf_preview.map((p, i) => (
          <div key={i} className="rounded-[16px] p-4 flex flex-col justify-between" style={{ background: 'var(--cream-card)', border: '1px solid var(--line)' }}>
            <div>
              <span className="font-body tracking-caps text-[9px] uppercase font-medium" style={{ color: '#B59B8D' }}>
                {CAT_FR[p.categorie] || p.categorie}
              </span>
              <p className="font-display text-[14px] mt-1.5 leading-snug font-medium" style={{ color: '#A37B68' }}>
                {p.nom}
              </p>
            </div>
            <p className="font-body italic text-[11.5px] mt-2" style={{ color: '#B59B8D' }}>
              {p.brand}
            </p>
          </div>
        ))}

        {/* Bouton Ajouter Photo / Produit */}
        <button 
          onClick={() => go('scan')} 
          className="rounded-[16px] p-4 flex flex-col items-center justify-center gap-2 transition-all active:scale-[0.98]"
          style={{ background: 'rgba(163, 123, 104, 0.04)', border: '1.5px dashed var(--line-strong)' }}
        >
          <Camera size={20} strokeWidth={1.5} style={{ color: '#A37B68' }} />
          <span className="font-body tracking-caps text-[10px] uppercase font-semibold text-center" style={{ color: '#A37B68' }}>
            {t('addPhoto')}
          </span>
        </button>
      </div>

      {data.demo && (
        <p className="font-body italic text-[12px] mt-4 text-center" style={{ color: 'var(--ink-faint)' }}>
          {t('demoNote')}
        </p>
      )}

      {/* Suggestion douce du moment */}
      {data.suggestion && (
        <div className="flex gap-3.5 mt-8 p-4 rounded-[16px]" style={{ background: 'rgba(230, 168, 154, 0.12)', border: '1px solid rgba(230, 168, 154, 0.3)' }}>
          <Sparkles size={18} strokeWidth={1.5} className="mt-0.5 shrink-0" style={{ color: '#A37B68' }} />
          <div>
            <p className="font-display text-[14px] font-medium" style={{ color: '#A37B68' }}>{data.suggestion.title}</p>
            <p className="font-body italic text-[12.5px] leading-relaxed mt-1" style={{ color: '#8C6250' }}>{data.suggestion.text}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default HomeScreen;
