// 청·백운반 출석부 — 최소 서비스워커
// 목적: 앱 셸(HTML/CSS/JS 등 같은 origin 정적 파일)만 stale-while-revalidate로 캐싱해
//       재방문 시 즉시 뜨고 오프라인에서도 화면은 열리게 한다.
// Supabase API·외부 CDN(Bootstrap, SweetAlert 등)은 절대 캐싱하지 않는다 —
// 출결 데이터가 오래된 채로 보이면 안 되기 때문.
const CACHE_NAME = 'gb-attendance-shell-v1';

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if (url.origin !== self.location.origin) return; // Supabase/CDN 등 타 origin은 그대로 네트워크로

  e.respondWith(
    caches.match(e.request).then(cached => {
      const network = fetch(e.request).then(res => {
        if (res && res.ok) {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
        }
        return res;
      }).catch(() => cached);
      return cached || network;
    })
  );
});
