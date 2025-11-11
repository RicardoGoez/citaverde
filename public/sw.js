// Service Worker para PWA - CitaVerde
const CACHE_NAME = 'citaverde-v2'; // Incrementar versión al hacer cambios importantes
const STATIC_CACHE_NAME = 'citaverde-static-v2';
const IMAGE_CACHE_NAME = 'citaverde-images-v2';
const API_CACHE_NAME = 'citaverde-api-v2';

// Recursos estáticos críticos
const STATIC_ASSETS = [
  '/',
  '/login',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png'
];

// Instalación del Service Worker
self.addEventListener('install', (event) => {
  console.log('[SW] Instalando Service Worker...');
  
  event.waitUntil(
    Promise.all([
      caches.open(STATIC_CACHE_NAME).then((cache) => {
        console.log('[SW] Cacheando recursos estáticos');
        return cache.addAll(STATIC_ASSETS);
      }),
      // Skip waiting para activar inmediatamente
      self.skipWaiting()
    ]).then(() => {
      console.log('[SW] Service Worker instalado correctamente');
    }).catch((error) => {
      console.error('[SW] Error en instalación:', error);
    })
  );
});

// Activación del Service Worker
self.addEventListener('activate', (event) => {
  console.log('[SW] Activando Service Worker...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // Eliminar caches antiguos
          if (cacheName !== CACHE_NAME && 
              cacheName !== STATIC_CACHE_NAME && 
              cacheName !== IMAGE_CACHE_NAME && 
              cacheName !== API_CACHE_NAME) {
            console.log('[SW] Eliminando cache antigua:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      // Tomar control de todas las páginas inmediatamente
      return self.clients.claim();
    }).then(() => {
      console.log('[SW] Service Worker activado');
    })
  );
});

// Estrategias de caché inteligentes
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Solo procesar solicitudes del mismo origen
  if (url.origin !== location.origin && !url.href.includes('supabase')) {
    return;
  }

  // No cachear solicitudes no-GET (excepto Supabase)
  if (request.method !== 'GET' && !url.href.includes('supabase')) {
    return;
  }

  // Recursos estáticos: Cache First
  if (request.destination === 'image' || url.pathname.includes('.png') || url.pathname.includes('.jpg') || url.pathname.includes('.svg')) {
    event.respondWith(cacheFirst(request, IMAGE_CACHE_NAME));
    return;
  }

  // API de Supabase: Network First con caché
  if (url.href.includes('supabase')) {
    event.respondWith(networkFirstWithCache(request, API_CACHE_NAME, 300)); // 5 min
    return;
  }

  // Páginas HTML y otros recursos: Network First
  if (request.destination === 'document' || request.headers.get('accept').includes('text/html')) {
    event.respondWith(networkFirstWithCache(request, STATIC_CACHE_NAME, 3600)); // 1 hora
    return;
  }

  // Otros recursos: Network First genérico
  event.respondWith(networkFirst(request));
});

// Estrategia: Cache First (para imágenes y assets estáticos)
function cacheFirst(request, cacheName) {
  return caches.match(request).then((cachedResponse) => {
    if (cachedResponse) {
      return cachedResponse;
    }

    return fetch(request).then((response) => {
      // No cachear si no es exitoso
      if (!response || response.status !== 200) {
        return response;
      }

      // Clone para cachear
      const responseToCache = response.clone();
      caches.open(cacheName).then((cache) => {
        cache.put(request, responseToCache);
      });

      return response;
    }).catch(() => {
      // Fallback offline
      if (request.destination === 'image') {
        return new Response(
          '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><rect fill="#ddd" width="200" height="200"/><text fill="#999" x="50%" y="50%" text-anchor="middle" dy=".3em">Sin conexión</text></svg>',
          { headers: { 'Content-Type': 'image/svg+xml' } }
        );
      }
    });
  });
}

// Estrategia: Network First con caché
function networkFirstWithCache(request, cacheName, maxAge = 300) {
  return fetch(request).then((response) => {
    // Cachear respuestas exitosas
    if (response && response.status === 200) {
      const responseToCache = response.clone();
      caches.open(cacheName).then((cache) => {
        cache.put(request, responseToCache);
      });
    }
    return response;
  }).catch(() => {
    // Fallback a caché si no hay red
    return caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      // Página offline genérica
      if (request.destination === 'document') {
        return new Response(
          '<!DOCTYPE html><html><head><meta charset="utf-8"><title>Sin conexión - CitaVerde</title><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{font-family:system-ui;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;background:#f5f5f5;color:#333}h1{text-align:center}p{text-align:center;color:#666}</style></head><body><div><h1>📱 CitaVerde</h1><p>No hay conexión a Internet</p><p>Por favor, verifica tu conexión e intenta nuevamente</p></div></body></html>',
          { headers: { 'Content-Type': 'text/html' } }
        );
      }
    });
  });
}

// Estrategia: Network First (sin caché)
function networkFirst(request) {
  return fetch(request).catch(() => {
    return caches.match(request);
  });
}

// Manejo de mensajes desde la app
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => caches.delete(cacheName))
        );
      })
    );
  }
});

// Background Sync para operaciones offline
self.addEventListener('sync', (event) => {
  console.log('[SW] Background Sync:', event.tag);
  
  if (event.tag === 'sync-citas') {
    event.waitUntil(syncCitas());
  }
  
  if (event.tag === 'sync-turnos') {
    event.waitUntil(syncTurnos());
  }
});

// Sincronizar citas offline
async function syncCitas() {
  try {
    // Recuperar citas pendientes del IndexedDB o cache
    console.log('[SW] Sincronizando citas offline...');
    // Implementar lógica de sincronización
  } catch (error) {
    console.error('[SW] Error sincronizando citas:', error);
  }
}

// Sincronizar turnos offline
async function syncTurnos() {
  try {
    // Recuperar turnos pendientes del IndexedDB o cache
    console.log('[SW] Sincronizando turnos offline...');
    // Implementar lógica de sincronización
  } catch (error) {
    console.error('[SW] Error sincronizando turnos:', error);
  }
}

// Push notifications
self.addEventListener('push', (event) => {
  console.log('[SW] Push event recibido:', event);
  
  const options = {
    body: event.data ? event.data.text() : 'Nueva notificación de CitaVerde',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    vibrate: [200, 100, 200],
    tag: 'citaverde-notification',
    requireInteraction: false,
    actions: [
      {
        action: 'open',
        title: 'Abrir CitaVerde',
        icon: '/icon-192.png'
      },
      {
        action: 'close',
        title: 'Cerrar',
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('CitaVerde', options)
  );
});

// Click en notificación
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notificación clickeada:', event);
  
  event.notification.close();
  
  if (event.action === 'open' || event.action === '') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Manejo de activación de ventanas
self.addEventListener('notificationclose', (event) => {
  console.log('[SW] Notificación cerrada:', event);
});

