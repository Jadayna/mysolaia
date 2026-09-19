// Étape 7 — Sons & vibrations des minuteurs
// Préférence locale (activée par défaut), clochette douce via Web Audio (aucun fichier),
// et vibration de fin de minuteur sur mobile.

const STORAGE_KEY = 'solaia_timer_feedback';

export const isTimerFeedbackEnabled = () => {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    return v === null ? true : v === '1';
  } catch {
    return true;
  }
};

export const setTimerFeedbackEnabled = (enabled) => {
  try {
    localStorage.setItem(STORAGE_KEY, enabled ? '1' : '0');
  } catch {
    // stockage indisponible : on ignore silencieusement
  }
};

// Clochette douce (deux notes de type carillon), sans aucun fichier audio
export const playSoftChime = () => {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const now = ctx.currentTime;
    // mi5 puis si5, attaque douce et longue extinction
    [[659.25, 0], [987.77, 0.35]].forEach(([freq, delay]) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, now + delay);
      gain.gain.exponentialRampToValueAtTime(0.22, now + delay + 0.06);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + delay + 1.4);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + delay);
      osc.stop(now + delay + 1.5);
    });
    // Libère le contexte après la clochette
    setTimeout(() => { try { ctx.close(); } catch {} }, 2200);
  } catch {
    // audio indisponible : on ignore silencieusement
  }
};

// Vibration douce de fin de minuteur (mobile)
export const vibrateTimerEnd = () => {
  try {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([70, 60, 70]);
    }
  } catch {
    // vibration indisponible : on ignore silencieusement
  }
};
