import React, { useState, useEffect } from 'react';
import { Sun, Moon, CloudSun, Camera, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useT } from '../i18n';
import api from '../lib/api';

const HomeScreen = ({ go }) => {
  const { user } = useAuth();
  const { lang } = useT();

  const [weather, setWeather] = useState({ temp: '--', condition: '', tip: '' });
  const [products, setProducts] = useState([]);
  const [insight, setInsight] = useState('Tes routines sont bien régulières, continue comme ça !');

  // Détection dynamique du moment de la journée (Jour entre 06h et 18h, sinon Soir)
  const currentHour = new Date().getHours();
  const isDay = currentHour >= 6 && currentHour < 18;
  const phase = isDay ? 'jour' : 'soir';

  useEffect(() => {
    // Géolocalisation pour météo & conseil skincare du jour
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          // Appel API Météo (ex: Open-Meteo gratuit sans clé)
          const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`);
          const data = await res.json();
          const temp = Math.round(data.current_weather.temperature);

          let tip = "Hydrate bien ta peau aujourd'hui.";
          if (temp > 22) tip = "Soleil & chaleur : n'oublie pas ta crème solaire SPF 50 !";
          else if (temp < 5) tip = "Froid intense : privilégie une crème riche protectrice.";

          setWeather({ temp: `${temp}°C`, tip });
        } catch (e) {
          console.error("Erreur météo", e);
        }
      });
    }

    // Chargement produits
    api.get('/shelf/').then((res) => setProducts(res.data || [])).catch(() => {});
  }, []);

  return (
    <div className="px-6 pt-6 pb-12 space-y-6">
      {/* Salutation */}
      <div>
        <p className="font-body text-[11px] uppercase tracking-caps" style={{ color: 'var(--ink-faint)' }}>
          {isDay ? (lang === 'fr' ? 'BONJOUR' : 'GOOD MORNING') : (lang === 'fr' ? 'BONSOIR' : 'GOOD EVENING')}, {user?.prenom || ''}
        </p>
        <h1 className="font-display text-[32px] leading-tight mt-1" style={{ color: 'var(--ink)' }}>
          {isDay 
            ? (lang === 'fr' ? 'Aujourd\'hui, on illumine' : 'Today, let\'s glow') 
            : (lang === 'fr' ? 'Ce soir, on garde ça simple' : 'Tonight, keep it simple')}
        </h1>
      </div>

      {/* Recommandation Météo du Jour */}
      {weather.temp !== '--' && (
        <div className="p-4 rounded-[16px] flex items-center gap-3.5" style={{ background: 'var(--cream-card)', border: '1px solid var(--line)' }}>
          <CloudSun size={24} style={{ color: 'var(--gold)' }} />
          <div>
            <span className="font-display text-[13px] font-semibold" style={{ color: 'var(--ink)' }}>{weather.temp}</span>
            <p className="font-body text-[12px]" style={{ color: 'var(--ink-soft)' }}>{weather.tip}</p>
          </div>
        </div>
      )}

      {/* Carte Routine Recommandée (Jour / Soir) */}
      <div className="p-6 rounded-[20px] shadow-sm space-y-4" style={{ background: 'var(--cream-card)', border: '1px solid var(--line)' }}>
        <div className="flex items-center gap-2 font-body text-[11px] uppercase tracking-caps" style={{ color: 'var(--gold)' }}>
          {isDay ? <Sun size={14} /> : <Moon size={14} />}
          <span>{isDay ? (lang === 'fr' ? 'CE JOUR' : 'THIS DAY') : (lang === 'fr' ? 'CE SOIR' : 'TONIGHT')}</span>
        </div>

        <h3 className="font-display text-[22px]" style={{ color: 'var(--ink)' }}>
          {isDay 
            ? (lang === 'fr' ? 'Routine Jour Protection & Éclat' : 'Day Routine Protect & Glow') 
            : (lang === 'fr' ? 'Routine Soir Réparation' : 'Evening Repair Routine')}
        </h3>

        <button
          onClick={() => go('routine', { phase })}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-[12px] font-body text-[11px] uppercase tracking-caps font-semibold text-white transition-all active:scale-[0.98]"
          style={{ background: '#A37B68' }}
        >
          <span>{lang === 'fr' ? 'COMMENCER · 3 ÉTAPES' : 'START · 3 STEPS'}</span>
          <ArrowRight size={14} />
        </button>
      </div>

      {/* Boîte "CE QUE JE REMARQUE" (déplacée sur la page d'accueil) */}
      <div className="p-5 rounded-[18px]" style={{ background: 'var(--cream-card)', border: '1px solid var(--line)' }}>
        <p className="font-body text-[10px] uppercase tracking-caps font-semibold" style={{ color: 'var(--gold)' }}>
          {lang === 'fr' ? 'CE QUE JE REMARQUE' : 'WHAT I NOTICE'}
        </p>
        <p className="font-body italic text-[13.5px] mt-2 leading-relaxed" style={{ color: 'var(--ink)' }}>
          "{insight}"
        </p>
      </div>

      {/* Étagère Rapide */}
      <div>
        <div className="flex justify-between items-center mb-3">
          <span className="font-body text-[11px] uppercase tracking-caps" style={{ color: 'var(--ink-faint)' }}>
            {lang === 'fr' ? 'TON ÉTAGÈRE' : 'YOUR SHELF'}
          </span>
          <span className="font-body text-[11px]" style={{ color: 'var(--ink-soft)' }}>
            {(products?.length || 0)} {lang === 'fr' ? 'produits' : 'products'}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {(products || []).slice(0, 3).map((p) => (
            <div key={p.id} className="p-4 rounded-[16px] space-y-1" style={{ background: 'var(--cream-card)', border: '1px solid var(--line)' }}>
              <p className="font-body text-[9px] uppercase tracking-caps" style={{ color: 'var(--gold)' }}>{p.categorie || 'SOIN'}</p>
              <p className="font-display text-[13px] line-clamp-1" style={{ color: 'var(--ink)' }}>{p.nom}</p>
              <p className="font-body text-[11px]" style={{ color: 'var(--ink-faint)' }}>{p.marque}</p>
            </div>
          ))}

          <button onClick={() => go('scan')} className="p-4 rounded-[16px] flex flex-col items-center justify-center gap-1 border-dashed" style={{ border: '1px dashed var(--line-strong)', background: 'rgba(250, 246, 240, 0.5)' }}>
            <Camera size={20} style={{ color: 'var(--gold)' }} />
            <span className="font-body text-[10px] uppercase tracking-caps font-medium mt-1" style={{ color: 'var(--ink-soft)' }}>
              {lang === 'fr' ? 'AJOUTER PAR PHOTO' : 'ADD BY PHOTO'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default HomeScreen;
