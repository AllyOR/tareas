// To do doo: opens without a connection. Cache-first, refreshed in the background.
// Bump VERSION when this file's behavior changes; page edits update themselves.
const VERSION = "tododoo-v1";
const FILES = ["./", "./index.html", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png", "./apple-touch-icon.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET" || new URL(req.url).origin !== self.location.origin) return;
  e.respondWith(
    caches.open(VERSION).then(async (cache) => {
      const hit = await cache.match(req, { ignoreSearch: true });
      const fresh = fetch(req, { cache: "no-cache" })
        .then((res) => { if (res.ok) cache.put(req, res.clone()); return res; })
        .catch(() => null);
      if (hit) { e.waitUntil(fresh); return hit; }
      const res = await fresh;
      if (res) return res;
      return req.mode === "navigate" ? cache.match("./index.html") : Response.error();
    })
  );
});
