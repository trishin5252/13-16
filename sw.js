// ===== КОНФИГУРАЦИЯ КЭША =====
const CACHE_NAME = 'notes-cache-v2'; // Увеличили версию!
const ASSETS = [
    '/',
    '/index.html',
    '/app.js',
    '/style.css',
    '/manifest.json',
    '/icons/icon-192x192.png',
    '/icons/icon-512x512.png'
];

// ===== УСТАНОВКА (INSTALL) =====
self.addEventListener('install', (event) => {
    console.log('Service Worker: Установка...');
    
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Кэширование ресурсов...');
                return cache.addAll(ASSETS);
            })
            .then(() => {
                console.log('Все ресурсы закэшированы');
                return self.skipWaiting();
            })
            .catch((error) => {
                console.error('Ошибка кэширования:', error);
            })
    );
});

// ===== АКТИВАЦИЯ (ACTIVATE) =====
self.addEventListener('activate', (event) => {
    console.log('Service Worker: Активация...');
    
    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames
                        .filter((name) => name !== CACHE_NAME)
                        .map((name) => {
                            console.log('Удаление старого кэша:', name);
                            return caches.delete(name);
                        })
                );
            })
            .then(() => {
                console.log('Service Worker активирован');
                return self.clients.claim();
            })
    );
});

// ===== ПЕРЕХВАТ ЗАПРОСОВ (FETCH) =====
self.addEventListener('fetch', (event) => {
    if (event.request.method !== 'GET') {
        return;
    }
    
    event.respondWith(
        caches.match(event.request)
            .then((cachedResponse) => {
                if (cachedResponse) {
                    console.log('Из кэша:', event.request.url);
                    return cachedResponse;
                }
                
                console.log('Из сети:', event.request.url);
                return fetch(event.request)
                    .then((networkResponse) => {
                        if (networkResponse && networkResponse.status === 200) {
                            const responseClone = networkResponse.clone();
                            caches.open(CACHE_NAME)
                                .then((cache) => {
                                    cache.put(event.request, responseClone);
                                });
                        }
                        return networkResponse;
                    })
                    .catch((error) => {
                        console.error('Ошибка сети:', error);
                        return caches.match('/index.html');
                    });
            })
    );
});

// ===== ОБРАБОТКА СООБЩЕНИЙ =====
self.addEventListener('message', (event) => {
    console.log('Сообщение от страницы:', event.data);
    
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});