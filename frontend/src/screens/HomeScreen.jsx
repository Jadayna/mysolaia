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

  // Récupération multi-champs du prénom
  const userName = user?.prenom || user?.first_name || user?.name || '';

  const currentHour = new Date().getHours();
  const isMorning = currentHour >= 5 && currentHour < 12;
  const isAfternoon = currentHour >= 12 && currentHour < 18;
  const isNight = currentHour >= 18 || currentHour < 5;
  const phase = isNight ? 'soir' : 'jour';

  const getGreeting = () => {
    if (lang === 'fr') {
      if (isNight) return 'BONSOIR';
      return 'BONJOUR';
    } else {
      if (isMorning) return 'GOOD MORNING';
      if (isAfternoon) return 'GOOD AFTERNOON';
      return 'GOOD EVENING';
    }
  };

  const insightText = lang === 'fr' 
    ? "Tes routines sont bien régulières, continue comme ça !"
    : "Your routines are consistent, keep it up!";

  useEffect(() => {
    // 1. Météo
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          try {
            const { latitude, longitude } = pos.coords;
            const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`);
            if (!res.ok) return;
            const data = await res.json();
            
            if (data && data.current_weather && typeof data.current_weather.temperature === 'number') {
              const temp = Math.round(data.current_weather.temperature);
              let tip = lang === 'fr' ? "Hydrate bien ta peau aujourd'hui." : "Keep your skin well hydrated today.";
              
              if (temp > 22) {
                tip = lang === 'fr' 
                  ? "Soleil & chaleur : n'oublie pas ta crème solaire SPF 50 !" 
                  : "Sun & heat: don't forget your SPF 50 sunscreen!";
              } else if (temp < 5) {
                tip = lang === 'fr' 
                  ? "Froid intense : privilégie une crème riche protectrice." 
                  : "Cold weather: use a rich protective cream.";
              }

              setWeather({ temp: `${temp}°C`, tip });
            }
          } catch (e) {
            console.warn("Météo ignorée :", e.message);
          }
        },
        (err) => console.warn("Géolocalisation indisponible :", err.message),
        { timeout: 5000 }
      );
    }

    // 2. Chargement de la liste des produits
    api.get('/shelf/')
      .then((res) => {
        const data = res?.data;
        if (Array.isArray(data)) setProducts(data);
        else if (data && Array.isArray(data.products)) setProducts(data.products);
        else setProducts([]);
      })
      .catch(() => setProducts([]));
  }, [lang]);

  const safeProducts = Array.isArray(products) ? products : [];

  return (
    <div className="px-6 pt-6 pb-12 space-y-6">
      {/* Salutation */}
      <div>
        <p className="font-body text-[11px] uppercase tracking-caps" style={{ color: 'var(--ink-faint)' }}>
          {getGreeting()}{userName ? `, ${userName}` : ''}
        </p>
        <h1 className="font-display text-[32px] leading-tight mt-1" style={{ color: 'var(--ink)' }}>
          {isNight 
            ? (lang === 'fr' ? 'Ce soir, on garde ça simple' : 'Tonight, keep it simple')
            : (lang === 'fr' ? 'Aujourd\'hui, on illumine' : 'Today, let\'s glow')}
        </h1>
      </div>

      {/* Météo */}
      {weather.temp !== '--' && (
        <div className="p-4 rounded-[16px] flex items-center gap-3.5" style={{ background: 'var(--cream-card)', border: '1px solid var(--line)' }}>
          <CloudSun size={24} style={{ color: 'var(--gold)' }} />
          <div>
            <span className="font-display text-[13px] font-semibold" style={{ color: 'var(--ink)' }}>{weather.temp}</span>
            <p className="font-body text-[12px]" style={{ color: 'var(--ink-soft)' }}>{weather.tip}</p>
          </div>
        </div>
      )}

      {/* Routine */}
      <div className="p-6 rounded-[20px] shadow-sm space-y-4" style={{ background: 'var(--cream-card)', border: '1px solid var(--line)' }}>
        <div className="flex items-center gap-2 font-body text-[11px] uppercase tracking-caps" style={{ color: 'var(--gold)' }}>
          {isNight ? <Moon size={14} /> : <Sun size={14} />}
          <span>
            {isNight 
              ? (lang === 'fr' ? 'CE SOIR' : 'TONIGHT') 
              : (lang === 'fr' ? 'CE JOUR' : 'THIS DAY')}
          </span>
        </div>

        <h3 className="font-display text-[22px]" style={{ color: 'var(--ink)' }}>
          {isNight 
            ? (lang === 'fr' ? 'Routine Soir Réparation' : 'Evening Repair Routine') 
            : (lang === 'fr' ? 'Routine Jour Protection & Éclat' : 'Day Routine Protect & Glow')}
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

      {/* Remarque */}
      <div className="p-5 rounded-[18px]" style={{ background: 'var(--cream-card)', border: '1px solid var(--line)' }}>
        <p className="font-body text-[10px] uppercase tracking-caps font-semibold" style={{ color: 'var(--gold)' }}>
          {lang === 'fr' ? 'CE QUE JE REMARQUE' : 'WHAT I NOTICE'}
        </p>
        <p className="font-body italic text-[13.5px] mt-2 leading-relaxed" style={{ color: 'var(--ink)' }}>
          "{insightText}"
        </p>
      </div>

      {/* Étagère Rapide */}
      <div>
        <div className="flex justify-between items-center mb-3">
          <span className="font-body text-[11px] uppercase tracking-caps" style={{ color: 'var(--ink-faint)' }}>
            {lang === 'fr' ? 'TON ÉTAGÈRE' : 'YOUR SHELF'}
          </span>
          <span className="font-body text-[11px]" style={{ color: 'var(--ink-soft)' }}>
            {safeProducts.length} {lang === 'fr' ? 'produits' : 'products'}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {safeProducts.slice(0, 3).map((p) => (
            <div key={p.id || p.nom} className="p-4 rounded-[16px] space-y-1" style={{ background: 'var(--cream-card)', border: '1px solid var(--line)' }}>
              <p className="font-body text-[9px] uppercase tracking-caps" style={{ color: 'var(--gold)' }}>{p.categorie || 'SOIN'}</p>
              <p className="font-display text-[13px] line-clamp-1" style={{ color: 'var(--ink)' }}>{p.nom}</p>
              <p className="font-body text-[11px]" style={{ color: 'var(--ink-faint)' }}>{p.marque}</p>
            </div>
          ))}

          <button onClick={() => go('scan')} className="p-4 rounded-[16px] flex flex-col items-center justify-center gap-1 border-dashed" style={{ border: '1px dashed var(--line-strong)', background: 'rgba(250, 246, 240, 0.5)' }}>
            <Camera size={20} style={{ color: 'var(--gold)' }} />
            <span className="font-body text-[10px] uppercase tracking-caps font-medium mt-1 text-center" style={{ color: 'var(--ink-soft)' }}>
              {lang === 'fr' ? 'GÉRER MES PRODUITS' : 'MANAGE PRODUCTS'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default HomeScreen;