// Analytics respectueuse de la vie privée (Umami Cloud — sans cookies, sans données personnelles).
// Inactif tant que VITE_UMAMI_WEBSITE_ID n'est pas défini (Vercel → Environment Variables).
// Mise en route : créer un compte gratuit sur https://cloud.umami.is, ajouter le site,
// copier le "Website ID" dans Vercel. Aucune bannière de consentement requise.

let ready = false;

export function initAnalytics() {
  try {
    const id = import.meta.env.VITE_UMAMI_WEBSITE_ID;
    if (!id || ready) return;
    ready = true;
    const s = document.createElement('script');
    s.defer = true;
    s.src = 'https://cloud.umami.is/script.js';
    s.setAttribute('data-website-id', id);
    document.head.appendChild(s);
  } catch (e) { /* analytics jamais bloquante */ }
}

// Un "événement" par écran visité (l'app est une SPA : pas de rechargement de page).
export function trackScreen(name) {
  try {
    if (window.umami) window.umami.track(name);
  } catch (e) { /* silencieux */ }
}
