const CACHE = 'happycj-__BUILD__';
const FILES = ['./','./index.html','./styles.css','./app.js','./engine.js','./tutorials.js','./icon.svg','./manifest.webmanifest','./data/cj.json'];
self.addEventListener('install', event => event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(FILES)).then(()=>self.skipWaiting())));
self.addEventListener('activate', event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('happycj-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch', event=>{
  if(event.request.method!=='GET'||new URL(event.request.url).origin!==self.location.origin)return;
  const path=new URL(event.request.url).pathname;
  // Keep hosting/auth endpoints and downloads outside the offline cache.
  if(!FILES.some(file=>new URL(file,self.registration.scope).pathname===path))return;
  event.respondWith(fetch(event.request).then(response=>{
    if(response.ok){const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(event.request,copy));}
    return response;
  }).catch(()=>caches.match(event.request)));
});
