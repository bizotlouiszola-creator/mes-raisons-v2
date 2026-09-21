const CACHE_NAME = "mes-raisons-v2";

const FILES_TO_CACHE = [
  "./",
  "./index.html",
  "./manifest.json"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(FILES_TO_CACHE);
    })
  );

  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      );
    })
  );

  self.clients.claim();
});

self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      return cachedResponse || fetch(event.request);
    })
  );
});

/* =====================================================
   RAPPEL QUOTIDIEN (best effort)
   Sur Chrome / Android, si l'app est installée et assez
   utilisée, le système peut réveiller le service worker
   une fois par jour via periodicSync pour déclencher la
   notification même app fermée. Ce n'est pas garanti à
   10h pile : c'est le système qui choisit le moment.
   La logique côté page (index.html) reste le mécanisme
   principal, fiable dès que l'app est ouverte après 10h.
   ===================================================== */

self.addEventListener("periodicsync", event => {
  if (event.tag === "daily-reason") {
    event.waitUntil(
      self.registration.showNotification("Une raison t'attend", {
        body: "Ta raison du jour est prête à être lue.",
        tag: "daily-reason"
      })
    );
  }
});

self.addEventListener("notificationclick", event => {
  event.notification.close();

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(clients => {
      for (const client of clients) {
        if ("focus" in client) return client.focus();
      }

      if (self.clients.openWindow) {
        return self.clients.openWindow("./index.html");
      }
    })
  );
});