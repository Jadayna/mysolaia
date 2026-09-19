// Rappels de routine — notifications locales douces, matin & soir.
// Fonctionne quand l'app est ouverte (ou en arrière-plan sur mobile) ; ne
// notifie jamais si la routine du jour est déjà faite.

const KEY = 'solaia_reminders';

export const DEFAULT_REMINDERS = {
  enabled: false,
  morning: '08:00',
  evening: '21:00',
};

export function getReminderSettings() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? { ...DEFAULT_REMINDERS, ...JSON.parse(raw) } : { ...DEFAULT_REMINDERS };
  } catch {
    return { ...DEFAULT_REMINDERS };
  }
}

export function saveReminderSettings(s) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ ...DEFAULT_REMINDERS, ...s }));
  } catch {}
}

export function notificationPermission() {
  if (typeof Notification === 'undefined') return 'unsupported';
  return Notification.permission; // 'granted' | 'denied' | 'default'
}

export async function requestNotificationPermission() {
  if (typeof Notification === 'undefined') return 'unsupported';
  try {
    return await Notification.requestPermission();
  } catch {
    return 'denied';
  }
}

// Clé "routine faite" posée par RoutineScreen à la fin d'une routine.
export function routineDoneKey(phase) {
  const d = new Date();
  const day = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  return `solaia_done_${day}_${phase}`;
}

export function markRoutineDone(phase) {
  try {
    localStorage.setItem(routineDoneKey(phase), '1');
  } catch {}
}

export function isRoutineDone(phase) {
  try {
    return localStorage.getItem(routineDoneKey(phase)) === '1';
  } catch {
    return false;
  }
}

function nextFireTime(hhmm) {
  const [h, m] = hhmm.split(':').map(Number);
  const now = new Date();
  const t = new Date(now);
  t.setHours(h, m, 0, 0);
  if (t <= now) t.setDate(t.getDate() + 1);
  return t;
}

const MESSAGES = {
  fr: {
    morning: ['☀️ Ta peau t’attend', 'Ta routine du matin est prête — 3 minutes pour toi ✨'],
    evening: ['🌙 Doux rappel du soir', 'Ta routine du soir t’attend — ta peau te remerciera demain ✨'],
  },
  en: {
    morning: ['☀️ Your skin is waiting', 'Your morning routine is ready — 3 minutes for you ✨'],
    evening: ['🌙 Gentle evening reminder', 'Your evening routine is waiting — your skin will thank you tomorrow ✨'],
  },
};

let timers = [];

export function clearScheduledReminders() {
  timers.forEach(clearTimeout);
  timers = [];
}

// Planifie les deux rappels (un seul tir chacun, puis on replanifie).
export function scheduleReminders(lang = 'fr') {
  clearScheduledReminders();
  const s = getReminderSettings();
  if (!s.enabled) return;
  if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;

  const msgs = MESSAGES[lang === 'en' ? 'en' : 'fr'];
  const jobs = [
    { time: s.morning, phase: 'matin', title: msgs.morning[0], body: msgs.morning[1] },
    { time: s.evening, phase: 'soir', title: msgs.evening[0], body: msgs.evening[1] },
  ];

  jobs.forEach((job) => {
    const fireAt = nextFireTime(job.time);
    const delay = fireAt.getTime() - Date.now();
    // Sécurité : pas de délai absurde (> 25 jours)
    if (delay <= 0 || delay > 25 * 24 * 3600 * 1000) return;
    const id = setTimeout(() => {
      try {
        // On ne dérange jamais si la routine est déjà faite
        if (!isRoutineDone(job.phase)) {
          new Notification(job.title, { body: job.body, tag: `solaia-${job.phase}` });
        }
      } catch {}
      // Replanifie le lendemain
      scheduleReminders(lang);
    }, delay);
    timers.push(id);
  });
}
