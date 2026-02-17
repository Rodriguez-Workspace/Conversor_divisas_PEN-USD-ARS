/**
 * Service Worker
 * Gestiona el cache de recursos estáticos y estrategias de red
 * Versión: 9.0.0
 */

import { CACHE_CONFIG } from './js/config/constants.js';

// Instalación del Service Worker
self.addEventListener('install', (event) => {
  console.log('Service Worker: Instalando v9...');

  event.waitUntil(
    caches
      .open(CACHE_CONFIG.name)
      .then((cache) => {
        console.log('Service Worker: Cacheando archivos estáticos');
        return cache.addAll(CACHE_CONFIG.assets);
      })
      .then(() => self.skipWaiting())
      .catch((error) => {
        console.error('Service Worker: Error al cachear archivos', error);
      })
  );
});

// Activación del Service Worker
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activando v9...');

  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cache) => {
            if (cache !== CACHE_CONFIG.name) {
              console.log('Service Worker: Eliminando caché antigua:', cache);
              return caches.delete(cache);
            }
          })
        );
      })
      .then(() => self.clients.claim())
  );
});

// Interceptar peticiones de red
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignorar peticiones a chrome-extension y otros protocolos no HTTP
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // Estrategia basada en el origen
  if (url.origin !== location.origin) {
    // APIs externas: Network First con timeout
    event.respondWith(networkFirstWithTimeout(request, 5000));
  } else {
    // Recursos locales: Cache First
    event.respondWith(cacheFirst(request));
  }
});

/**
 * Estrategia Cache First
 * Ideal para recursos estáticos que no cambian frecuentemente
 */
async function cacheFirst(request) {
  try {
    const cache = await caches.open(CACHE_CONFIG.name);
    const cached = await cache.match(request);

    if (cached) {
      return cached;
    }

    // No está en caché, buscar en red
    const response = await fetch(request);

    // Cachear respuesta exitosa
    if (response.status === 200) {
      cache.put(request, response.clone());
    }

    return response;
  } catch (error) {
    console.error('Service Worker: Error en cacheFirst', error);

    // Fallback a caché si falla la red
    const cache = await caches.open(CACHE_CONFIG.name);
    return cache.match('/index.html');
  }
}

/**
 * Estrategia Network First con timeout
 * Para APIs: prioriza datos frescos pero usa caché si falla
 */
async function networkFirstWithTimeout(request, timeout = 5000) {
  try {
    // Intentar primero con la red con timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const response = await fetch(request, {
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    // Cachear respuesta exitosa de API
    if (response.status === 200) {
      const cache = await caches.open(CACHE_CONFIG.name);
      cache.put(request, response.clone());
    }

    return response;
  } catch (error) {
    console.warn('Service Worker: Red falló, intentando caché', error.message);

    // Fallback a caché
    const cache = await caches.open(CACHE_CONFIG.name);
    const cached = await cache.match(request);

    if (cached) {
      return cached;
    }

    // No hay caché disponible
    throw error;
  }
}

/**
 * Sincronización en segundo plano
 * Para actualizar tasas cuando hay conectividad
 */
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-rates') {
    event.waitUntil(notifyClientsToSync());
  }
});

async function notifyClientsToSync() {
  try {
    const clients = await self.clients.matchAll();
    clients.forEach((client) => {
      client.postMessage({
        type: 'SYNC_RATES',
        message: 'Conectividad restaurada. Actualizando tasas...',
      });
    });
  } catch (error) {
    console.error('Service Worker: Error en sincronización', error);
  }
}

/**
 * Manejo de mensajes desde la aplicación
 */
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(cacheNames.map((cache) => caches.delete(cache)));
      })
    );
  }
});

/**
 * Notificación de nueva versión disponible
 */
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({
      version: '9.0.0',
      cacheName: CACHE_CONFIG.name,
    });
  }
});
