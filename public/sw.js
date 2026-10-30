const CACHE_NAME = "embedc-shell-v1";
const OFFLINE_URL = "/offline.html";

const CORE_ASSETS = [
  "/",
  "/offline.html",
  "/ide-offline.html",
  "/offline-ide",
  "/offline-ide/shiro.html",
  "/standalone",
  "/playground",
  "/manifest.webmanifest",
  "/icon.svg",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      Promise.allSettled(CORE_ASSETS.map((url) => cache.add(url))).then(() => self.skipWaiting())
    )
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(
        names
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  const IDE_HOSTS = ["shiro.computer", "tcc.44670.org", "www.shiro.computer"];
  const isIdeHost = IDE_HOSTS.includes(url.hostname);

  // 브라우저 C IDE 호스트는 오프라인 캐시를 시도합니다.
  if (isIdeHost) {
    event.respondWith(
      caches.match(req).then((cached) => {
        const networkFetch = fetch(req, { mode: "no-cors" })
          .then((res) => {
            const copy = res.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
            return res;
          })
          .catch(() => cached || new Response("", { status: 503 }));
        return cached || networkFetch;
      })
    );
    return;
  }

  if (url.origin !== self.location.origin) return;

  // API 요청: 네트워크 우선
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(
      fetch(req).catch(() =>
        caches.match(req).then((cached) => cached || new Response(JSON.stringify({ error: "offline" }), { status: 503, headers: { "Content-Type": "application/json" } }))
      )
    );
    return;
  }

  // 정적 자산/페이지: cache-first with network refresh
  event.respondWith(
    caches.match(req).then((cached) => {
      const networkFetch = fetch(req)
        .then((res) => {
          if (res && res.status === 200) {
            const copy = res.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
          }
          return res;
        })
        .catch(() => {
          if (req.mode === "navigate") return caches.match(OFFLINE_URL);
          return cached;
        });
      return cached || networkFetch;
    })
  );
});