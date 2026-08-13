/* えいかいわのもり Service Worker
   方針: アプリ本体(index.html)はネット優先=更新がすぐ届く。アイコン類はキャッシュ優先。
   ※音声認識はネット接続が必要な端末が多い(TTSはオフラインでも動く) */
const CACHE = "eikaiwa-v1";
const ASSETS = ["./", "manifest.webmanifest", "icon-180.png", "icon-192.png", "icon-512.png"];

self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => Promise.allSettled(ASSETS.map(a => c.add(a)))) /* アイコン未設置でも失敗しない */
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  if (req.mode === "navigate") {
    e.respondWith(
      fetch(req)
        .then(res => {
          const cp = res.clone();
          caches.open(CACHE).then(c => c.put("./", cp));
          return res;
        })
        .catch(() => caches.match("./"))
    );
    return;
  }
  e.respondWith(
    caches.match(req).then(hit =>
      hit ||
      fetch(req).then(res => {
        const cp = res.clone();
        caches.open(CACHE).then(c => c.put(req, cp));
        return res;
      })
    )
  );
});
