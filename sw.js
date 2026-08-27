const CACHE_NAME = "sklad-cache-v95";
const ASSETS = [
  "./index.html",
  "./style.css",
  "./app.js",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    // cache: "reload" — тянем файлы МИМО обычного HTTP-кэша браузера.
    // GitHub Pages отдаёт их с max-age=600, и без этого свежая версия могла
    // до 10 минут не доезжать: браузер отдавал бы копию из своего кэша.
    // Заодно этот запрос обновляет и сам HTTP-кэш, поэтому после
    // перезагрузки страницы новые файлы подхватятся сразу.
    caches.open(CACHE_NAME).then((cache) =>
      cache.addAll(ASSETS.map((url) => new Request(url, { cache: "reload" })))
    )
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// Стратегия: сначала сеть (чтобы подтягивать свежую версию при обновлении
// файла на GitHub), при отсутствии сети — отдаём из кеша.
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
