import React, { useState, useEffect } from 'react';
import { Sun, Moon, Camera, ArrowRight, CloudSun, Cloud, CloudRain, CloudSnow, CloudFog, CloudLightning } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useT } from '../i18n';
import api from '../lib/api';

// --- Conseils par CONDITION météo (soleil, nuages, pluie, neige, brouillard, orage) ---
const CONDITIONS = {
  sun: {
    fr: [
      "Grand soleil : SPF obligatoire, même 5 minutes dehors comptent. ☀️",
      "Journée ensoleillée — rebadigeonne ton SPF aux 2 heures.",
      "Le soleil plombe : lunettes pis chapeau protègent aussi ta peau.",
      "Beau soleil aujourd'hui! N'oublie pas la crème solaire avant de sortir.",
    ],
    en: [
      "Bright sun: SPF is a must, even 5 minutes outside counts. ☀️",
      "Sunny day — reapply your SPF every 2 hours.",
      "Strong sun: sunglasses and a hat protect your skin too.",
      "Lovely sun today! Don't forget sunscreen before heading out.",
    ],
  },
  cloud: {
    fr: [
      "Nuageux ne veut pas dire sans UV — ton SPF reste de mise. ☁️",
      "Ciel gris : parfait pour une routine tranquille pis un grand verre d'eau.",
      "Les nuages laissent passer jusqu'à 80 % des UV. SPF quand même!",
    ],
    en: [
      "Cloudy doesn't mean UV-free — keep your SPF on. ☁️",
      "Grey sky: perfect for a calm routine and a big glass of water.",
      "Clouds let up to 80% of UV through. SPF anyway!",
    ],
  },
  fog: {
    fr: [
      "Brouillard pis humidité : ta peau boit l'air, allège ton hydratant.",
      "Journée brumeuse — un sérum léger suffit souvent.",
    ],
    en: [
      "Fog and humidity: your skin drinks the air, lighten your moisturizer.",
      "Misty day — a light serum is often enough.",
    ],
  },
  rain: {
    fr: [
      "Pluie dehors : l'humidité aide ta peau, mais garde ton SPF. 🌧️",
      "Jour de pluie, parfait pour rester dedans pis chouchouter ta peau.",
      "L'humidité peut faire luire — un fini matte le matin si tu veux.",
    ],
    en: [
      "Rain outside: humidity helps your skin, but keep your SPF. 🌧️",
      "Rainy day, perfect to stay in and pamper your skin.",
      "Humidity can add shine — a matte finish in the morning if you like.",
    ],
  },
  snow: {
    fr: [
      "Neige = UV réfléchis à double. SPF essentiel, oui même l'hiver. ❄️",
      "Air froid pis sec : crème riche pis baume à lèvres aujourd'hui.",
      "La neige brille de UV — protège ta peau comme en été.",
    ],
    en: [
      "Snow = double the reflected UV. SPF is essential, yes even in winter. ❄️",
      "Cold dry air: rich cream and lip balm today.",
      "Snow bounces UV around — protect your skin like it's summer.",
    ],
  },
  storm: {
    fr: [
      "Orage dehors : journée cocooning, hydrate pis relaxe. ⛈️",
      "Temps instable — garde ta routine simple aujourd'hui.",
    ],
    en: [
      "Storm outside: cozy day, hydrate and relax. ⛈️",
      "Unstable weather — keep your routine simple today.",
    ],
  },
};

// --- Conseils par TEMPÉRATURE ---
const TIPS = {
  glacial: {
    fr: [
      "Froid mordant : une crème riche en barrière protège du vent.",
      "Air glacial = peau déshydratée. Double ton hydratant aujourd'hui.",
      "Le chauffage assèche autant que le froid — pense à un baume à lèvres.",
    ],
    en: [
      "Biting cold: a rich barrier cream shields against the wind.",
      "Freezing air dehydrates skin. Layer on extra moisturizer today.",
      "Indoor heating dries you out too — grab a lip balm.",
    ],
  },
  froid: {
    fr: [
      "Il fait frais : une texture plus riche tient mieux le coup.",
      "Le vent froid gerce les lèvres — garde un baume à portée.",
      "Bois de l'eau tiède : l'hydratation vient aussi de l'intérieur.",
    ],
    en: [
      "Chilly out: a richer texture holds up better.",
      "Cold wind chaps lips — keep a balm handy.",
      "Sip warm water: hydration starts from within too.",
    ],
  },
  doux: {
    fr: [
      "Journée douce : pense à boire de l'eau, ta peau te remerciera. 💧",
      "Rien de spécial dehors — profites-en pour bien dormir ce soir. 😴",
      "Constance > perfection. Ta routine, même courte, compte.",
      "Respire un bon coup. Ta peau reflète ton stress. 🌿",
    ],
    en: [
      "Mild day: remember to drink water, your skin will thank you. 💧",
      "Nothing wild outside — use it to get good sleep tonight. 😴",
      "Consistency > perfection. Even a short routine counts.",
      "Take a deep breath. Your skin mirrors your stress. 🌿",
    ],
  },
  chaud: {
    fr: [
      "Il fait chaud : bois beaucoup d'eau aujourd'hui! 💦",
      "Chaleur = plus de sébum. Un nettoyant doux le matin aide.",
      "Un brumisateur dans le sac pour rafraîchir ta peau, bonne idée.",
    ],
    en: [
      "Hot out: drink lots of water today! 💦",
      "Heat = more oil. A gentle morning cleanser helps.",
      "A facial mist in your bag to cool down — great idea.",
    ],
  },
  canicule: {
    fr: [
      "Canicule : bois de l'eau souvent, même sans avoir soif. 🥵",
      "Évite les actifs forts (rétinol, acides) quand il fait très chaud.",
      "Rafraîchis ta peau à l'eau fraîche, pas glacée, pour pas la choquer.",
    ],
    en: [
      "Heatwave: drink water often, even before you feel thirsty. 🥵",
      "Skip strong actives (retinol, acids) when it's very hot.",
      "Cool your skin with cool — not icy — water to avoid shocking it.",
    ],
  },
};

// Codes météo WMO (Open-Meteo) → condition
function conditionFromCode(code) {
  if (code === 0 || code === 1) return 'sun';
  if (code === 2 || code === 3) return 'cloud';
  if (code === 45 || code === 48) return 'fog';
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return 'rain';
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return 'snow';
  if (code >= 95) return 'storm';
  return 'cloud';
}

function tempBand(temp) {
  if (temp < 0) return 'glacial';
  if (temp < 10) return 'froid';
  if (temp < 22) return 'doux';
  if (temp < 30) return 'chaud';
  return 'canicule';
}

function pickTip(temp, code, lang) {
  const l = lang === 'fr' ? 'fr' : 'en';
  const cond = conditionFromCode(code);
  const band = tempBand(temp);
  const pool = [...(CONDITIONS[cond]?.[l] || []), ...(TIPS[band]?.[l] || [])];
  if (pool.length === 0) return '';
  return pool[Math.floor(Math.random() * pool.length)];
}

const COND_ICONS = { sun: Sun, cloud: Cloud, fog: CloudFog, rain: CloudRain, snow: CloudSnow, storm: CloudLightning };

const HomeScreen = ({ go }) => {
  const { user } = useAuth();
  const { lang } = useT();

  const [weather, setWeather] = useState({ temp: '--', tip: '', cond: null });
  const [products, setProducts] = useState([]);

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
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          try {
            const { latitude, longitude } = pos.coords;
            const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`);
            if (!res.ok) return;
            const data = await res.json();
            const cw = data?.current_weather;
            if (cw && typeof cw.temperature === 'number') {
              const temp = Math.round(cw.temperature);
              const code = typeof cw.weathercode === 'number' ? cw.weathercode : 2;
              setWeather({ temp: `${temp}°C`, tip: pickTip(temp, code, lang), cond: conditionFromCode(code) });
            }
          } catch (e) {
            console.warn("Météo ignorée :", e.message);
          }
        },
        (err) => console.warn("Géolocalisation indisponible :", err.message),
        { timeout: 5000 }
      );
    }

    api.get('/shelf')
      .then((res) => {
        const data = res?.data;
        if (Array.isArray(data)) setProducts(data);
        else if (data && Array.isArray(data.shelf)) setProducts(data.shelf);
        else if (data && Array.isArray(data.products)) setProducts(data.products);
        else setProducts([]);
      })
      .catch(() => setProducts([]));
  }, [lang]);

  const safeProducts = Array.isArray(products) ? products : [];
  const WeatherIcon = COND_ICONS[weather.cond] || CloudSun;

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

      {/* Météo + conseil */}
      {weather.temp !== '--' && (
        <div className="p-4 rounded-[16px] flex items-center gap-3.5" style={{ background: 'var(--cream-card)', border: '1px solid var(--line)' }}>
          <WeatherIcon size={24} style={{ color: 'var(--gold)' }} />
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
          onClick={() => go(safeProducts.length === 0 ? 'scan' : 'routine', { phase })}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-[12px] font-body text-[11px] uppercase tracking-caps font-semibold text-white transition-all active:scale-[0.98]"
          style={{ background: '#A37B68' }}
        >
          <span>
            {safeProducts.length === 0
              ? (lang === 'fr' ? 'AJOUTER UN PRODUIT' : 'ADD A PRODUCT')
              : (lang === 'fr' ? 'COMMENCER MA ROUTINE' : 'START MY ROUTINE')}
          </span>
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

        <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 snap-x snap-mandatory" style={{ scrollbarWidth: 'none' }}>
          {safeProducts.map((p) => (
            <div key={p.id || p.nom} className="shrink-0 w-[150px] snap-start p-4 rounded-[16px] space-y-1" style={{ background: 'var(--cream-card)', border: '1px solid var(--line)' }}>
              <p className="font-body text-[9px] uppercase tracking-caps" style={{ color: 'var(--gold)' }}>{p.categorie || 'SOIN'}</p>
              <p className="font-display text-[13px] line-clamp-1" style={{ color: 'var(--ink)' }}>{p.nom}</p>
              <p className="font-body text-[11px]" style={{ color: 'var(--ink-faint)' }}>{p.marque}</p>
            </div>
          ))}
        </div>

        <button onClick={() => go('scan')} className="w-full mt-3 py-3 rounded-[12px] font-body text-[10px] uppercase tracking-caps font-semibold" style={{ background: 'var(--cream-card)', border: '1px solid var(--line-strong)', color: 'var(--ink-soft)' }}>
          {lang === 'fr' ? 'GÉRER MES PRODUITS' : 'MANAGE PRODUCTS'}
        </button>
      </div>
    </div>
  );
};

export default HomeScreen;