// Service Worker - 時間管理網站離線支援
// Cache-First 策略用於資源

const CACHE_NAME = 'timer-app-v1';
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/src/css/style.css',
    '/src/css/responsive.css',
    '/src/js/app.js',
    '/src/js/storage.js',
    '/src/js/timer.js',
    '/src/js/alarm.js',
    '/src/js/audio.js',
    '/src/js/speech.js',
    '/src/js/chat.js',
    '/manifest.json',
    '/assets/sounds/alarm1.mp3',
    '/assets/sounds/alarm2.mp3'
];

// 安裝事件 - 快取靜態資源
self.addEventListener('install', (event) => {
    console.log('Service Worker 安裝中...');
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('快取資源中...');
            return cache.addAll(STATIC_ASSETS).catch(err => {
                console.log('某些資源無法快取，但繼續：', err);
                // 不要因為單一資源失敗而導致整個安裝失敗
                return cache.addAll(STATIC_ASSETS.filter(url => 
                    !url.includes('alarm') // 音檔可能不存在
                ));
            });
        })
    );
    self.skipWaiting();
});

// 啟動事件 - 清理舊快取
self.addEventListener('activate', (event) => {
    console.log('Service Worker 啟動中...');
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('刪除舊快取:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

// Fetch 事件 - Cache-First 策略
self.addEventListener('fetch', (event) => {
    const { request } = event;

    // 跳過非 GET 請求
    if (request.method !== 'GET') {
        return;
    }

    // Cache-First 策略：先從快取查找，失敗時查詢網路
    event.respondWith(
        caches.match(request)
            .then((response) => {
                if (response) {
                    console.log('從快取提供:', request.url);
                    return response;
                }

                return fetch(request)
                    .then((response) => {
                        // 檢查是否有效的回應
                        if (!response || response.status !== 200 || response.type !== 'basic') {
                            return response;
                        }

                        // 快取新資源
                        const responseToCache = response.clone();
                        caches.open(CACHE_NAME).then((cache) => {
                            cache.put(request, responseToCache);
                        });

                        return response;
                    })
                    .catch(() => {
                        // 離線時使用快取的後備資源
                        console.log('無法取得資源，嘗試快取:', request.url);
                        return caches.match('/index.html');
                    });
            })
    );
});

// 背景同步（未來功能）
self.addEventListener('sync', (event) => {
    console.log('背景同步事件:', event.tag);
    // 用於未來的同步功能
});

console.log('Service Worker 已載入');
