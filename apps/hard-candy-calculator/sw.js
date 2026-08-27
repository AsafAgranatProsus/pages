const CACHE_NAME = 'hard-candy-calc-v5';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon.svg'
];

self.addEventListener('install', function(event){
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache){
      // bypass the browser's HTTP cache during precache — otherwise a stale
      // cached response can get baked into the new SW cache even after
      // bumping CACHE_NAME, defeating the whole point of versioning it.
      return Promise.all(
        ASSETS.map(function(url){
          return fetch(url, { cache: 'no-store' }).then(function(response){
            return cache.put(url, response);
          });
        })
      );
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', function(event){
  event.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(
        keys.filter(function(key){ return key !== CACHE_NAME; })
            .map(function(key){ return caches.delete(key); })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', function(event){
  event.respondWith(
    caches.match(event.request).then(function(cached){
      if (cached) return cached;
      return fetch(event.request, { cache: 'no-store' }).then(function(response){
        if (response && response.status === 200 && event.request.method === 'GET'){
          const clone = response.clone();
          caches.open(CACHE_NAME).then(function(cache){ cache.put(event.request, clone); });
        }
        return response;
      }).catch(function(){
        return caches.match('./index.html');
      });
    })
  );
});
