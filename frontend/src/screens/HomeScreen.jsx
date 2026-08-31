import React, { useEffect, useState } from 'react';
import { Moon, Sun, Camera } from 'lucide-react';
import api from '../lib/api';
import { useT } from '../i18n';
import { useAuth } from '../context/AuthContext';

const CAT_FR = { nettoyant: 'Nettoyant', exfoliant: 'Exfoliant', serum: 'Sérum', yeux: 'Yeux', hydratant: 'Hydratant', spf: 'SPF', levres: 'Lèvres', cils_sourcils: 'Cils & sourcils', traitement_cible: 'Ciblé' };

const HomeScreen = ({ go }) => {
  const { t, lang } = useT();
  const { user } = useAuth();
  const [data, setData] = useState(null);

  useEffect(() => { api.get('/home').then((r) => setData(r.data)).catch(() => {}); }, []);
  if (!data) return <div className="px-6 pt-10 font-body" style={{ color: 'var(--ink-faint)' }}>…</div>;

  const name = (user?.email || '').split('@')[0];
  const nameCap = name.charAt(0).toUpperCase() + name.slice(1);
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
    <div className="px-6 pt-6 animate-fade-up">
      <span className="font-body tracking-caps text-[10px] uppercase" style={{ color: 'var(--ink-faint)' }}>{greet}, {nameCap}</span>
      <h2 className="font-display text-[30px] leading-[1.1] mt-2">
        {hPrefix}<span className="italic">{hPhrase}</span>
      </h2>

      <div className="mt-6 rounded-[10px] p-5" style={{ background: 'var(--cream-card)', border: '1px solid var(--gold-soft)' }}>
        <span className="font-body tracking-caps text-[10px] uppercase" style={{ color: 'var(--ink-faint)' }}>{evening ? t('tonight') : t('thisMorning')}</span>
        <h3 className="font-display text-[22px] mt-1">{r.title}</h3>
        {r.banner && <p className="font-body text-[13.5px] leading-relaxed mt-2" style={{ color: 'var(--ink-soft)' }}>{r.banner}</p>}
        <button onClick={() => go('routine', { phase: r.phase })} className="gold-btn w-full rounded-[8px] py-3 mt-4 font-body tracking-caps text-[11px] uppercase">
          {t('start')} · {r.total} {t('steps')}
        </button>
      </div>

      <div className="flex items-baseline justify-between mt-8">
        <span className="font-body tracking-caps text-[10px] uppercase" style={{ color: 'var(--ink-faint)' }}>{t('shelf')}</span>
        <span className="font-body text-[12px] tnum" style={{ color: 'var(--ink-faint)' }}>{data.shelf_count} {t('products')}</span>
      </div>

      <div className="grid grid-cols-2 gap-3 mt-3">
        {data.shelf_preview.map((p, i) => (
          <div key={i} className="rounded-[8px] p-4" style={{ border: '1px solid var(--line)' }}>
            <span className="font-body tracking-caps text-[9px] uppercase" style={{ color: 'var(--ink-faint)' }}>{CAT_FR[p.categorie] || p.categorie}</span>
            <p className="font-body text-[14px] mt-2 leading-tight">{p.nom}</p>
            <p className="font-body italic text-[12px] mt-1" style={{ color: 'var(--ink-faint)' }}>{p.brand}</p>
          </div>
        ))}
        <button onClick={() => go('scan')} className="tile-dashed rounded-[8px] p-4 flex flex-col items-start justify-center">
          <Camera size={18} strokeWidth={1.5} style={{ color: 'var(--gold)' }} />
          <span className="font-body tracking-caps text-[10px] uppercase mt-2 text-left" style={{ color: 'var(--gold)' }}>{t('addPhoto')}</span>
        </button>
      </div>

      {data.demo && <p className="font-body italic text-[12px] mt-4" style={{ color: 'var(--ink-faint)' }}>{t('demoNote')}</p>}

      {data.suggestion && (
        <div className="flex gap-3 mt-8 mb-4">
          <Moon size={16} strokeWidth={1.5} className="mt-0.5 shrink-0" style={{ color: 'var(--gold)' }} />
          <div>
            <p className="font-body text-[13.5px]">{data.suggestion.title}</p>
            <p className="font-body italic text-[12.5px] leading-relaxed mt-1" style={{ color: 'var(--ink-faint)' }}>{data.suggestion.text}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default HomeScreen;
