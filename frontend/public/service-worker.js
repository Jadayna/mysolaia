/* MySolaia service worker — offline-first for the app shell and loaded routines. */
const CACHE = "ordre-v1";
const CORE = ["/", "/index.html", "/manifest.json"];

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(CORE).catch(() => {})));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Ne gérer QUE les requêtes http et https (évite les erreurs avec les extensions chrome://)
  if (url.protocol !== "http:" && url.protocol !== "https:") return;

  // Laisser passer directement les requêtes POST / PUT / DELETE (comme la création de compte)
  if (req.method !== "GET") return;

  // Gestion des requêtes API
  if (url.pathname.includes("/api/")) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          if (res.status === 200) {
            const clone = res.clone();
            caches.open(CACHE).then((c) => c.put(req, clone));
          }
          return res;
        })
        .catch(() => caches.match(req))
    );
    return;
  }

  // Gestion des fichiers statiques (images, CSS, JS)
  event.respondWith(
    caches.match(req).then((cached) => {
      return (
        cached ||
        fetch(req).then((res) => {
          const clone = res.clone();
          caches.open(CACHE).then((c) => c.put(req, clone));
          return res;
        })
      );
    }).catch(() => caches.match("/index.html"))
  );
});
