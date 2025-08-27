const CACHE_NAME = 'pin-pan-pum-cache-v1';
const GITHUB_ASSETS_BASE = 'https://media.githubusercontent.com/media/Kitt-Games/PIN-PAN-PUM-Assets/main/Audio';

const soundUrls = [
  `${GITHUB_ASSETS_BASE}/Impact/impact-fx-3.wav`,
  `${GITHUB_ASSETS_BASE}/Impact/impact-fx-4.wav`,
  `${GITHUB_ASSETS_BASE}/Impact/impact-fx-5.wav`,
  `${GITHUB_ASSETS_BASE}/Impact/impact-fx-1.wav`,
  `${GITHUB_ASSETS_BASE}/Impact/impact-fx-2.wav`,
  `${GITHUB_ASSETS_BASE}/Swoosh/swoosh-fx-1.wav`,
  `${GITHUB_ASSETS_BASE}/Explosion/explosion-fx-3.wav`,
  `${GITHUB_ASSETS_BASE}/Powerup/powerup-fx-4.wav`,
  `${GITHUB_ASSETS_BASE}/Explosion/explosion-fx-1.wav`,
  `${GITHUB_ASSETS_BASE}/Blip/blip-fx-1.wav`,
  `${GITHUB_ASSETS_BASE}/Blip/blip-fx-2.wav`,
  `${GITHUB_ASSETS_BASE}/UI/ui-fx-3.wav`,
  `${GITHUB_ASSETS_BASE}/Powerup/powerup-fx-1.wav`,
  `${GITHUB_ASSETS_BASE}/Jingle/jingle-fx-1.wav`,
  `${GITHUB_ASSETS_BASE}/Jingle/jingle-fx-2.wav`,
  `${GITHUB_ASSETS_BASE}/Impact/impact-fx-6.wav`,
  `${GITHUB_ASSETS_BASE}/Swoosh/swoosh-fx-2.wav`,
  `${GITHUB_ASSETS_BASE}/Powerup/powerup-fx-2.wav`,
  `${GITHUB_ASSETS_BASE}/Swoosh/swoosh-fx-4.wav`,
  `${GITHUB_ASSETS_BASE}/Jingle/jingle-fx-3.wav`,
  `${GITHUB_ASSETS_BASE}/UI/ui-fx-1.wav`,
  `${GITHUB_ASSETS_BASE}/UI/ui-fx-2.wav`,
  `${GITHUB_ASSETS_BASE}/UI/ui-fx-4.wav`,
];
const uniqueSoundUrls = [...new Set(soundUrls)];

// URLs that will be cached when the service worker is installed.
const URLS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/pwa-icons/icon-192x192.png',
  '/pwa-icons/icon-512x512.png',
  '/src/index.tsx',

  // Google Fonts CSS
  'https://fonts.googleapis.com/css2?family=Luckiest+Guy&family=Exo+2:wght@300;400;500;600;700;800;900&display=swap',

  // JS Libraries from importmap
  'https://aistudiocdn.com/@google/genai@^1.15.0',
  'https://aistudiocdn.com/react@^19.1.1',
  'https://aistudiocdn.com/react-dom@^19.1.1',
  
  ...uniqueSoundUrls
];

// Install event: opens a cache and adds the core app files to it.
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        // We use addAll, which is atomic. If any file fails, the whole install fails.
        return cache.addAll(URLS_TO_CACHE);
      })
  );
});

// Fetch event: serves assets from the cache first.
// This is a "Cache first, falling back to network" strategy.
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // If the request is in the cache, return the cached response.
        if (response) {
          return response;
        }
        // Otherwise, fetch the request from the network.
        return fetch(event.request);
      })
  );
});

// Activate event: cleans up old caches.
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            // If a cache is not in our whitelist, delete it.
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
