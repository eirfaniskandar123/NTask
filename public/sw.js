const CACHE = "ntask-v1";

self.addEventListener("install", (e) => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(["/", "/login"]))
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(clients.claim());
});

// Network-first: serve live content, fall back to cache when offline
self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  if (!e.request.url.startsWith("http")) return; // skip chrome-extension:// etc.
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        const clone = res.clone();
        caches.open(CACHE).then((c) => c.put(e.request, clone));
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});
