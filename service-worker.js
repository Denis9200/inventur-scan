const CACHE='dj-inventur-v5-step5b-camera-fallback';
const CORE=['./','./index.html','./styles.css','./app.js','./manifest.webmanifest','./dj-innovations-logo.jpg','./icon-192.png','./icon-512.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE)));self.skipWaiting()});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))));self.clients.claim()});
self.addEventListener('fetch',e=>{if(e.request.method!=='GET')return;e.respondWith(caches.match(e.request).then(c=>c||fetch(e.request).then(r=>{let cp=r.clone();caches.open(CACHE).then(cache=>cache.put(e.request,cp));return r}).catch(()=>caches.match('./index.html'))))});