const APP_SHELL_PREFIX = 'iki-bowl-shell-';
const AUDIO_CACHE_PREFIX = 'iki-bowl-audio-';
const AUDIO_CACHE_VERSION = 'v1';
const DEFAULT_SHELL_VERSION = 'dev';

const APP_SHELL_VERSION = getShellVersion();
const APP_SHELL_CACHE = `${APP_SHELL_PREFIX}${APP_SHELL_VERSION}`;
const AUDIO_CACHE = `${AUDIO_CACHE_PREFIX}${AUDIO_CACHE_VERSION}`;

const APP_SHELL_ASSETS = [
  '',
  'index.html',
  'manifest.webmanifest',
  'favicon.ico',
  'favicon-16x16.png',
  'favicon-32x32.png',
  'apple-touch-icon.png',
  'icons/icon-192.png',
  'icons/icon-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(APP_SHELL_CACHE).then((cache) => {
      const urls = APP_SHELL_ASSETS.map((path) => new URL(path, self.registration.scope).toString());
      return cache.addAll(urls);
    }),
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter(
            (key) =>
              (key.startsWith(APP_SHELL_PREFIX) && key !== APP_SHELL_CACHE) ||
              (key.startsWith(AUDIO_CACHE_PREFIX) && key !== AUDIO_CACHE),
          )
          .map((key) => caches.delete(key)),
      ),
    ),
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') {
    return;
  }

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) {
    return;
  }

  if (url.pathname.includes('/audio/')) {
    if (request.headers.has('range')) {
      event.respondWith(handleAudioRangeRequest(request, url.toString()));
      return;
    }
    event.respondWith(cacheFirst(request, AUDIO_CACHE));
    return;
  }

  if (request.mode === 'navigate') {
    event.respondWith(navigateNetworkFirst());
    return;
  }

  event.respondWith(cacheFirst(request, APP_SHELL_CACHE));
});

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) {
    return cached;
  }

  try {
    const response = await fetch(request);
    if (response.ok && response.status !== 206) {
      await cache.put(request, response.clone());
    }
    return response;
  } catch {
    const fallback = await cache.match(request);
    if (fallback) {
      return fallback;
    }
    return new Response('Offline', { status: 503, statusText: 'Offline' });
  }
}

async function handleAudioRangeRequest(request, canonicalUrl) {
  const cache = await caches.open(AUDIO_CACHE);
  const cached = await cache.match(canonicalUrl);

  if (cached) {
    return cached;
  }

  try {
    const response = await fetch(request);
    if (response.ok && response.status !== 206) {
      await cache.put(canonicalUrl, response.clone());
    } else if (response.ok && response.status === 206) {
      void primeAudioCache(canonicalUrl);
    }
    return response;
  } catch {
    if (cached) {
      return cached;
    }
    return new Response('Offline', { status: 503, statusText: 'Offline' });
  }
}

async function primeAudioCache(canonicalUrl) {
  const cache = await caches.open(AUDIO_CACHE);
  const existing = await cache.match(canonicalUrl);
  if (existing) {
    return;
  }

  try {
    const response = await fetch(new Request(canonicalUrl, { method: 'GET' }));
    if (response.ok && response.status !== 206) {
      await cache.put(canonicalUrl, response.clone());
    }
  } catch {
    // Best-effort cache warming only.
  }
}

function getShellVersion() {
  try {
    const registrationUrl = new URL(self.location.href);
    return registrationUrl.searchParams.get('v') || DEFAULT_SHELL_VERSION;
  } catch {
    return DEFAULT_SHELL_VERSION;
  }
}

async function navigateNetworkFirst() {
  const cache = await caches.open(APP_SHELL_CACHE);
  const indexUrl = new URL('index.html', self.registration.scope).toString();

  try {
    const response = await fetch(new Request(indexUrl, { cache: 'no-cache' }));
    if (response.ok) {
      await cache.put(indexUrl, response.clone());
      return response;
    }

    const fallback = await cache.match(indexUrl);
    if (fallback) {
      return fallback;
    }
    return response;
  } catch {
    const fallback = await cache.match(indexUrl);
    if (fallback) {
      return fallback;
    }
    return new Response('Offline', { status: 503, statusText: 'Offline' });
  }
}
