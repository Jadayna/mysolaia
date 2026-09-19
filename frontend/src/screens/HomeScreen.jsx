import React, { useState, useEffect } from 'react';
import { Sun, Moon, Camera, ArrowRight, CloudSun, Cloud, CloudRain, CloudSnow, CloudFog, CloudLightning } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useT } from '../i18n';
import api from '../lib/api';
import { isRoutineDone } from '../lib/reminders';

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

// --- Conseils de NUIT (régénération) — affichés le soir à la place des conseils SPF/soleil ---
const NIGHT_TIPS = {
  fr: [
    "Ce soir, ta peau se régénère pendant que tu dors — une bonne nuit, c'est le meilleur des sérums. 🌙",
    "Rituel du soir : nettoie la journée en douceur, puis hydrate. Ta peau te dira merci demain matin.",
    "Pas de soleil à l'horizon : le soir, c'est le bon moment pour les soins ciblés que tu réserves à la nuit.",
    "Le soir, la peau absorbe mieux : prends ton temps et masse doucement ton hydratant.",
    "Écrans éteints un peu plus tôt ce soir — ton sommeil et ta peau vont adorer. 😴",
    "Une taie d'oreiller propre, ça change tout pour une peau tranquille pendant la nuit.",
  ],
  en: [
    "Tonight your skin repairs itself while you sleep — good rest is the best serum. 🌙",
    "Evening ritual: gently wash the day away, then moisturize. Your skin will thank you tomorrow.",
    "No sun in sight: evening is the right time for the targeted treatments you save for nighttime.",
    "Skin absorbs better in the evening — take your time and massage your moisturizer in slowly.",
    "Screens off a little earlier tonight — your sleep and your skin will love it. 😴",
    "A clean pillowcase makes all the difference for calm skin overnight.",
  ],
};

// Motifs des conseils à ne JAMAIS montrer le soir (SPF / soleil / UV)
const DAY_ONLY_RE = /\bspf\b|sunscreen|crème solaire|\buv\b/i;

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

function pickTip(temp, code, lang, isNight = false) {
  const l = lang === 'fr' ? 'fr' : 'en';
  const cond = conditionFromCode(code);
  const band = tempBand(temp);
  let pool = [...(CONDITIONS[cond]?.[l] || []), ...(TIPS[band]?.[l] || [])];
  if (isNight) {
    // Le soir : aucun conseil SPF/soleil — on bascule sur les conseils de nuit et de régénération
    pool = [...NIGHT_TIPS[l], ...pool.filter((tip) => !DAY_ONLY_RE.test(tip))];
  }
  if (pool.length === 0) return '';

  // Stabilité : un conseil unique par tranche (matin/soir) de chaque jour
  const now = new Date();
  const dayOfYear = Math.floor((now - new Date(now.getFullYear(), 0, 0)) / 1000 / 60 / 60 / 24);
  const slot = now.getHours() < 13 ? 0 : 1;
  const stableIndex = (dayOfYear * 2 + slot) % pool.length;

  return pool[stableIndex];
}

const COND_ICONS = { sun: Sun, cloud: Cloud, fog: CloudFog, rain: CloudRain, snow: CloudSnow, storm: CloudLightning };

const HomeScreen = ({ go }) => {
  const { user } = useAuth();
  const { lang } = useT();

  const [weather, setWeather] = useState({ temp: '--', tip: '', cond: null });
  const [suggestion, setSuggestion] = useState(null);
  const [products, setProducts] = useState(() => {
    try {
      const saved = localStorage.getItem('solaia_cached_shelf');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [entries, setEntries] = useState(() => {
    try {
      const saved = localStorage.getItem('solaia_cached_journal');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const userName = user?.nom || user?.prenom || user?.first_name || '';

  const currentHour = new Date().getHours();
  const isMorning = currentHour >= 5 && currentHour < 12;
  const isAfternoon = currentHour >= 12 && currentHour < 19;
  const isNight = currentHour >= 19 || currentHour < 5;
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

  // Streak : nombre de jours consécutifs avec au moins 1 routine complétée
  const computeStreak = () => {
    const days = new Set(
      entries.map((e) => {
        const d = e.date || e.created_at || e.timestamp;
        return d ? new Date(d).toISOString().slice(0, 10) : null;
      }).filter(Boolean)
    );
    let streak = 0;
    const cursor = new Date();
    // Si rien aujourd'hui, on part d'hier (la journée n'est peut-être pas finie)
    if (!days.has(cursor.toISOString().slice(0, 10))) cursor.setDate(cursor.getDate() - 1);
    while (days.has(cursor.toISOString().slice(0, 10))) {
      streak += 1;
      cursor.setDate(cursor.getDate() - 1);
    }
    return streak;
  };
  const streak = computeStreak();
  const totalEntries = entries.length;

  const [cachedInsight, setCachedInsight] = useState(() => {
    return localStorage.getItem('solaia_last_insight') || '';
  });

  const computedInsight = (() => {
    const fr = lang === 'fr';

    if (totalEntries === 0) {
      return fr
        ? "J'apprends encore à te connaître. Fais ta première routine et je commencerai à observer ton rythme naturel."
        : "I'm still getting to know you. Do your first routine and I'll start observing your natural rhythm.";
    }

    const lastEntry = entries[0];
    if (lastEntry?.note_peau && lastEntry.note_peau <= 2) {
      return fr
        ? "Ta peau a tiraillé récemment. Pour cette séance, privilégie une hydratation riche et laisse tes exfoliants de côté."
        : "Your skin felt tight recently. For this session, focus on rich hydration and give exfoliating acids a rest.";
    }
    if (lastEntry?.note_peau === 5) {
      return fr
        ? "Ta peau est rayonnante ! Ton rythme actuel et l'ordre de tes soins lui conviennent à merveille."
        : "Your skin is glowing! Your current rhythm and product pairing work wonderfully.";
    }

    if (totalEntries >= 4) {
      const timestamps = entries
        .map((e) => new Date(e.date || e.created_at || e.horodatage).getTime())
        .filter((t) => !isNaN(t))
        .sort((a, b) => b - a);

      if (timestamps.length >= 3) {
        const diffsInDays = [];
        for (let i = 0; i < Math.min(timestamps.length - 1, 5); i++) {
          const diff = (timestamps[i] - timestamps[i + 1]) / (1000 * 60 * 60 * 24);
          diffsInDays.push(diff);
        }
        const avgGap = diffsInDays.reduce((a, b) => a + b, 0) / diffsInDays.length;

        if (avgGap >= 1.8 && avgGap <= 4.2) {
          return fr
            ? "Je remarque que tu prends soin de ta peau environ tous les 2 à 3 jours. C'est un excellent rythme ! J'optimise l'ordre de tes soins pour en tirer le maximum à chaque séance."
            : "I notice you care for your skin every 2 to 3 days. It's a great rhythm! I tailor the order of your products to get the most out of every single session.";
        }
      }
    }

    if (streak >= 3) {
      return fr
        ? `${streak} jours consécutifs ! Ta régularité est remarquable, ta barrière cutanée te remercie.`
        : `${streak} days in a row! Your consistency is remarkable, your skin barrier thanks you.`;
    }

    return fr
      ? `${totalEntries} routines notées. Peu importe l'heure ou la fréquence, c'est ton moment à toi.`
      : `${totalEntries} routines logged. No matter the time or frequency, this is your personal ritual.`;
  })();

  // Dès qu'une vraie phrase personnalisée est calculée, on la grave dans le marbre
  useEffect(() => {
    if (computedInsight && !computedInsight.includes("J'apprends") && !computedInsight.includes("still getting")) {
      setCachedInsight(computedInsight);
      localStorage.setItem('solaia_last_insight', computedInsight);
    }
  }, [computedInsight]);

  // Si on a déjà une phrase en mémoire, on l'affiche SANS ATTENDRE pour éliminer tout saut visuel
  const finalInsight = (totalEntries === 0 && cachedInsight) ? cachedInsight : (computedInsight || cachedInsight);

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
              setWeather({ temp: `${temp}°C`, tempNum: temp, tip: pickTip(temp, code, lang, isNight), cond: conditionFromCode(code) });
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
        const raw = res?.data;
        const list = Array.isArray(raw) 
          ? raw 
          : (raw?.shelf || raw?.products || []);
        setProducts(list);
        localStorage.setItem('solaia_cached_shelf', JSON.stringify(list));
      })
      .catch(() => {});

    api.get('/journal')
      .then((res) => {
        const list = res?.data?.entries || [];
        setEntries(list);
        localStorage.setItem('solaia_cached_journal', JSON.stringify(list));
      })
      .catch(() => {});

    // Conseils du moteur : ce qui manque à l'étagère (phase locale, pas UTC serveur)
    const apiPhase = isNight ? 'soir' : 'matin';
    api.get('/home', { params: { lang, phase: apiPhase } })
      .then((res) => setSuggestion(res?.data?.suggestion || null))
      .catch(() => {});
  }, [lang]);



  const safeProducts = Array.isArray(products) ? products : [];
  const WeatherIcon = COND_ICONS[weather.cond] || CloudSun;

  // Météo → conseil adaptatif concret (au-delà du simple tip)
  const weatherAlert = () => {
    const t = weather.tempNum;
    if (typeof t !== 'number') return null;
    if (t <= -5) return lang === 'fr'
      ? '🥶 Grand froid dehors — ce soir, mise sur une texture riche et nourrissante.'
      : '🥶 Freezing outside — tonight, go for a rich, nourishing texture.';
    if (t >= 28) return lang === 'fr'
      ? '🥵 Forte chaleur — allège les textures et bois beaucoup d’eau.'
      : '🥵 Heat wave — keep textures light and drink plenty of water.';
    if (weather.cond === 'sun' && !isNight) return lang === 'fr'
      ? '☀️ Gros soleil — pense à renouveler ton SPF dans la journée.'
      : '☀️ Strong sun — remember to reapply your SPF during the day.';
    return null;
  };
  const alertMsg = weatherAlert();

  // Streak en danger : le soir, routine non faite, streak à protéger
  const streakAtRisk = isNight && streak > 0 && !isRoutineDone('soir');


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

      {/* Alerte météo adaptative */}
      {alertMsg && (
        <div className="p-4 rounded-[16px] flex items-center gap-3 animate-fade-up" style={{ background: 'rgba(182,130,53,0.10)', border: '1px solid var(--gold-soft)' }}>
          <p className="font-body text-[12.5px] leading-relaxed" style={{ color: 'var(--ink)' }}>{alertMsg}</p>
        </div>
      )}

      {/* Streak en danger */}
      {streakAtRisk && (
        <div className="p-4 rounded-[16px] flex items-center gap-3 animate-fade-up" style={{ background: 'rgba(182,130,53,0.14)', border: '1.5px solid var(--gold-soft)' }}>
          <span className="font-display text-[26px]">🔥</span>
          <div>
            <p className="font-display text-[14px] font-semibold" style={{ color: 'var(--ink)' }}>
              {lang === 'fr' ? `Tes ${streak} jours sont en jeu ce soir !` : `Your ${streak}-day streak is at stake tonight!`}
            </p>
            <p className="font-body text-[12px]" style={{ color: 'var(--ink-soft)' }}>
              {lang === 'fr' ? 'Termine ta routine pour garder la flamme.' : 'Finish your routine to keep the flame alive.'}
            </p>
          </div>
        </div>
      )}

      {/* Routine */}
      <div className="p-6 rounded-[20px] shadow-sm space-y-4" style={{ background: 'var(--cream-card)', border: '1px solid var(--line)' }}>
        <div className="flex items-center justify-between font-body text-[11px] uppercase tracking-caps" style={{ color: 'var(--gold)' }}>
          <div className="flex items-center gap-2">
            {isNight ? <Moon size={14} /> : <Sun size={14} />}
            <span>
              {isNight
                ? (lang === 'fr' ? 'CE SOIR' : 'TONIGHT')
                : (lang === 'fr' ? 'CE JOUR' : 'THIS DAY')}
            </span>
          </div>
          {streak > 0 && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full font-semibold" style={{ background: 'rgba(182,130,53,0.12)' }}>
              🔥 {streak} {lang === 'fr' ? (streak > 1 ? 'jours' : 'jour') : (streak > 1 ? 'days' : 'day')}
            </span>
          )}
        </div>

        <h3 className="font-display text-[22px]" style={{ color: 'var(--ink)' }}>
          {isNight
            ? (lang === 'fr' ? 'Routine Soir Réparation' : 'Evening Repair Routine')
            : (lang === 'fr' ? 'Routine Jour Protection & Éclat' : 'Day Routine Protect & Glow')}
        </h3>

        <button
          onClick={() => go(safeProducts.length === 0 ? 'scan' : 'routine', { phase })}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-[12px] font-body text-[11px] uppercase tracking-caps font-semibold text-white transition-all duration-200 active:scale-[0.98] hover:opacity-95"
          style={{ 
            background: 'var(--ink)', 
            boxShadow: '0 8px 20px -6px rgba(163, 123, 104, 0.35)' 
          }}
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
          "{finalInsight}"
        </p>
      </div>

      {/* Conseil du moteur — ce qui manque */}
      {suggestion && (
        <div className="p-5 rounded-[18px] animate-fade-up" style={{ background: 'var(--cream-card)', border: '1px solid var(--gold-soft)' }}>
          <p className="font-body text-[10px] uppercase tracking-caps font-semibold" style={{ color: 'var(--gold)' }}>
            {suggestion.title}
          </p>
          <p className="font-body text-[13px] mt-2 leading-relaxed" style={{ color: 'var(--ink-soft)' }}>
            {suggestion.text}
          </p>
          <button
            onClick={() => go('scan')}
            className="mt-3 font-body text-[11px] uppercase tracking-caps font-semibold"
            style={{ color: 'var(--gold)' }}
          >
            {lang === 'fr' ? 'Scanner un produit →' : 'Scan a product →'}
          </button>
        </div>
      )}

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

        <button 
          onClick={() => go('scan')} 
          className="w-full mt-3 py-3 rounded-[12px] font-body text-[10px] uppercase tracking-caps font-semibold transition-all active:scale-[0.98]" 
          style={{ 
            background: 'var(--cream-card)', 
            border: '1px solid var(--line-strong)', 
            color: 'var(--ink-soft)' 
          }}
        >
          {lang === 'fr' ? 'GÉRER MES PRODUITS' : 'MANAGE PRODUCTS'}
        </button>
      </div>
    </div>
  );
};

export default HomeScreen;
