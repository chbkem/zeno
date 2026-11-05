/*
 * Zeno service worker.
 *
 * Strategy:
 *  - App shell (navigations): network-first, fall back to the cached page, then
 *    to a tiny offline notice. Keeps data fresh while still opening offline.
 *  - Static assets (JS/CSS/fonts/images): cache-first with a background refresh.
 *  - Everything else (Firebase, Gemini, server functions): untouched.
 *
 * Bump CACHE_VERSION whenever the precache list changes.
 */
const CACHE_VERSION = "zeno-v1";
const OFFLINE_URL = "/offline.html";

const PRECACHE_URLS = [
  "/",
  OFFLINE_URL,
  "/manifest.webmanifest",
  "/favicon.svg",
  "/favicon.ico",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/icon-maskable-512.png",
  "/icons/apple-touch-icon.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_VERSION)
      // One bad URL must not fail the whole install.
      .then((cache) => Promise.allSettled(PRECACHE_URLS.map((url) => cache.add(url))))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE_VERSION).map((key) => caches.delete(key))),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") self.skipWaiting();
});

const CACHEABLE_FILE = /\.(?:css|js|mjs|png|jpe?g|svg|webp|avif|ico|woff2?|ttf)$/i;

function isCacheableAsset(url) {
  return url.pathname.startsWith("/assets/") || CACHEABLE_FILE.test(url.pathname);
}

async function cachePut(request, response) {
  if (!response || !response.ok || response.type === "opaque") return;
  const cache = await caches.open(CACHE_VERSION);
  await cache.put(request, response);
}

async function handleNavigation(request) {
  try {
    const response = await fetch(request);
    if (response.ok) await cachePut(request, response.clone());
    return response;
  } catch {
    return (
      (await caches.match(request)) ??
      (await caches.match("/")) ??
      (await caches.match(OFFLINE_URL)) ??
      new Response("You are offline.", {
        status: 503,
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      })
    );
  }
}

async function handleAsset(request) {
  const cached = await caches.match(request);
  const network = fetch(request)
    .then(async (response) => {
      await cachePut(request, response.clone());
      return response;
    })
    .catch(() => cached);

  return cached ?? network;
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  // Server functions are dynamic and must never be served from cache.
  if (url.pathname.startsWith("/_serverFn")) return;

  if (request.mode === "navigate") {
    event.respondWith(handleNavigation(request));
    return;
  }

  if (isCacheableAsset(url)) {
    event.respondWith(handleAsset(request));
  }
});
