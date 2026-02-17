const CACHE_NAME = 'conversor-v6';
const ASSETS_TO_CACHE = [
    '/',
    '/index.html',
    '/styles.css',
    '/app.js',
    '/manifest.json',
    '/icons/icon-72x72.png',
    '/icons/icon-96x96.png',
    '/icons/icon-128x128.png',
    '/icons/icon-144x144.png',
    '/icons/icon-152x152.png',
    '/icons/icon-192x192.png',
    '/icons/icon-384x384.png',
    '/icons/icon-512x512.png'
];

// Instalación del Service Worker
self.addEventListener('install', (event) => {
    console.log('Service Worker: Instalando...');
    
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Service Worker: Cacheando archivos');
                return cache.addAll(ASSETS_TO_CACHE);
            })
            .then(() => self.skipWaiting())
            .catch((error) => {
                console.error('Error al cachear archivos:', error);
            })
    );
});

// Activación del Service Worker
self.addEventListener('activate', (event) => {
    console.log('Service Worker: Activando...');
    
    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cache) => {
                        if (cache !== CACHE_NAME) {
                            console.log('Service Worker: Eliminando caché antigua:', cache);
                            return caches.delete(cache);
                        }
                    })
                );
            })
            .then(() => self.clients.claim())
    );
});

// Interceptar peticiones
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // NO interceptar APIs externas - dejar que el navegador las maneje directamente
    if (url.origin !== location.origin) {
        return; // No hacer nada, dejar que fetch normal funcione
    }

    // Estrategia Cache First solo para recursos locales
    event.respondWith(cacheFirst(request));
});

// Estrategia Cache First
async function cacheFirst(request) {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(request);
    
    if (cached) {
        return cached;
    }

    try {
        const response = await fetch(request);
        
        // Cachear la nueva respuesta
        if (response.status === 200) {
            cache.put(request, response.clone());
        }
        
        return response;
    } catch (error) {
        console.error('Error en fetch:', error);
        
        // Si falla todo, devolver página offline básica
        if (request.destination === 'document') {
            return cache.match('/index.html');
        }
        
        throw error;
    }
}

// Sincronización en segundo plano (opcional)
self.addEventListener('sync', (event) => {
    if (event.tag === 'sync-rates') {
        event.waitUntil(syncExchangeRates());
    }
});

async function syncExchangeRates() {
    try {
        // Intentar actualizar las tasas de cambio
        const clients = await self.clients.matchAll();
        clients.forEach(client => {
            client.postMessage({
                type: 'SYNC_RATES',
                message: 'Actualizando tasas de cambio...'
            });
        });
    } catch (error) {
        console.error('Error en sincronización:', error);
    }
}

// Manejo de mensajes desde el cliente
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});
