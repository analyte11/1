const CACHE_NAME = 'lulu-weight-loss-v1';
const URLS_TO_CACHE = ['index.html', 'manifest.json', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/icon-180.png'];

// 安装：缓存核心资源
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      console.log('[SW] 缓存核心资源');
      return cache.addAll(URLS_TO_CACHE).catch(function(err) {
        console.log('[SW] 缓存部分失败(离线可用会受限):', err);
      });
    })
  );
  self.skipWaiting();
});

// 激活：清理旧缓存
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(name) {
          if (name !== CACHE_NAME) {
            console.log('[SW] 删除旧缓存:', name);
            return caches.delete(name);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// 拦截请求：网络优先+缓存兜底
self.addEventListener('fetch', function(event) {
  event.respondWith(
    fetch(event.request).then(function(response) {
      // 成功请求缓存副本
      if (response && response.status === 200 && event.request.method === 'GET') {
        var responseClone = response.clone();
        caches.open(CACHE_NAME).then(function(cache) {
          cache.put(event.request, responseClone);
        });
      }
      return response;
    }).catch(function() {
      // 离线时使用缓存
      return caches.match(event.request).then(function(cached) {
        if (cached) return cached;
        // 如果是导航请求(index.html)，返回缓存的首页
        if (event.request.mode === 'navigate') {
          return caches.match('index.html');
        }
        return new Response('离线模式', { status: 503 });
      });
    })
  );
});
