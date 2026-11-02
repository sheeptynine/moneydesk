// Money Desk offline helper.
// Caches only the app's own files (this page, manifest, icons) so the app opens without a connection.
// Backups are never cached here: they come from your device or straight from Google Drive.
// Network first: when online you always get the newest version of the app.
const CACHE = "moneydesk-v1";
const SHELL = ["./", "./manifest.webmanifest", "./icons/icon-192.png", "./icons/icon-512.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
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
  if (req.method !== "GET" || new URL(req.url).origin !== self.location.origin) return;   // Google, fonts etc. go straight to the network
  const nav = req.mode === "navigate";
  const key = nav ? "./" : req;
  e.respondWith(
    fetch(nav ? new Request(req.url, { cache: "no-cache" }) : req)
      .then(res => {
        if (res.ok){ const copy = res.clone(); caches.open(CACHE).then(c => c.put(key, copy)); }
        return res;
      })
      .catch(() => caches.match(key).then(hit => hit || caches.match("./")))
  );
});
