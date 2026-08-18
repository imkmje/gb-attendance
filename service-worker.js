// 청·백운반 출석부 — 최소 서비스워커
// 목적: 오프라인에서도 앱 셸(HTML/CSS/JS 등 같은 origin 정적 파일)이 열리게 한다.
// Supabase API·외부 CDN(Bootstrap, SweetAlert 등)은 절대 캐싱하지 않는다 —
// 출결 데이터가 오래된 채로 보이면 안 되기 때문.
//
// ⚠ network-first 전략 사용 (stale-while-revalidate 아님):
// 온라인이면 항상 네트워크에서 최신 파일을 받아온다 — 이 앱은 자주 배포되는데,
// "캐시부터 즉시 보여주고 백그라운드로만 갱신"하면 새 배포 후에도 몇 번의
// 재방문 동안 이전 버전의 화면/로직이 계속 보이는 문제가 있었음(실제로
// 결석 사유가 사라지는 버그를 고쳐 배포했는데도 예전 코드가 계속 보였음).
// 네트워크가 안 될 때만 캐시로 폴백해서 오프라인 최소 동작만 보장한다.
const CACHE_NAME = 'gb-attendance-shell-v2';

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
    fetch(e.request).then(res => {
      if (res && res.ok) {
        const clone = res.clone();
        caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
      }
      return res;
    }).catch(() => caches.match(e.request))
  );
});
