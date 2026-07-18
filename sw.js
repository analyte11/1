const CACHE_NAME = 'lulu-weight-v1';
const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon-48.png',
  './icons/icon-72.png',
  './icons/icon-96.png',
  './icons/icon-144.png',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

// 安装时预缓存所有资源
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting())
  );
});

// 激活时清理旧缓存
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 网络请求拦截 - 缓存优先策略
self.addEventListener('fetch', event => {
  // API请求不缓存，走网络
  if (event.request.url.includes('api.deepseek.com')) {
    return;
  }
  
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // 缓存命中则返回缓存
        if (response) {
          return response;
        }
        // 否则请求网络，并缓存结果
        return fetch(event.request).then(
          response => {
            // 只缓存有效的响应
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });
            return response;
          }
        ).catch(() => {
          // 完全离线时可以返回缓存中的首页
          return caches.match('./index.html');
        });
      })
  );
});
