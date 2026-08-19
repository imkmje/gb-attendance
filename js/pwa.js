// ════════════════════════════════════════
//  pwa.js — 앱 설치 안내(PWA)
//  (app.js에서 분리됨)
// ════════════════════════════════════════

/* ════════════════════════════════
   앱 설치 안내 (PWA)
════════════════════════════════ */
let _deferredInstallPrompt = null;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  _deferredInstallPrompt = e;
});
window.addEventListener('appinstalled', () => { _deferredInstallPrompt = null; _applyInstallBtnVisibility(); });

function _isStandaloneApp() {
  return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
}

// 앱으로 설치되어 실행 중(standalone)일 때만 새로고침 버튼 표시
// — 일반 브라우저 탭에는 이미 주소창 새로고침/당겨서 새로고침이 있어서 안 보여줌
function _applyRefreshBtnVisibility() {
  const show = _isStandaloneApp();
  document.querySelectorAll('.js-refresh-btn').forEach(btn => {
    btn.style.display = show ? 'flex' : 'none';
  });
}

// standalone 모드(홈 화면에 설치된 앱)에서는 iOS/Android 브라우저가 제공하는
// "당겨서 새로고침" 제스처가 아예 없어져서, 직접 흉내 낸 버전을 붙여준다.
// 열려있는 시트/모달 위에서 스크롤할 때는 절대 반응하지 않도록 가드를 둔다.
function _initPullToRefresh() {
  if (!_isStandaloneApp()) return;
  const THRESHOLD = 68;
  let startY = null, dragging = false, armed = false;

  const indicator = document.createElement('div');
  indicator.id = 'ptrIndicator';
  indicator.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--blue)" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M23 4v6h-6"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>`;
  indicator.style.cssText = 'position:fixed;top:10px;left:50%;transform:translateX(-50%) translateY(-40px) scale(0.6);opacity:0;z-index:2500;width:34px;height:34px;border-radius:50%;background:var(--surface);box-shadow:var(--sh-md);display:flex;align-items:center;justify-content:center;transition:transform .18s var(--ease),opacity .18s var(--ease);pointer-events:none;';
  document.body.appendChild(indicator);

  const reset = () => {
    indicator.style.opacity = '0';
    indicator.style.transform = 'translateX(-50%) translateY(-40px) scale(0.6)';
  };
  const isBlocked = () =>
    document.querySelector('.custom-sheet-backdrop.show') ||
    document.querySelector('.modal.show') ||
    document.querySelector('.swal2-container');

  document.addEventListener('touchstart', (e) => {
    if (isBlocked() || window.scrollY > 0) { dragging = false; return; }
    startY = e.touches[0].clientY;
    dragging = true; armed = false;
  }, { passive: true });

  document.addEventListener('touchmove', (e) => {
    if (!dragging || startY === null) return;
    if (isBlocked() || window.scrollY > 0) { dragging = false; reset(); return; }
    const dy = e.touches[0].clientY - startY;
    if (dy <= 0) { reset(); return; }
    const progress = Math.min(dy / THRESHOLD, 1);
    armed = progress >= 1;
    indicator.style.transition = 'none';
    indicator.style.opacity = String(progress);
    indicator.style.transform = `translateX(-50%) translateY(${-40 + progress * 56}px) scale(${0.6 + progress * 0.4}) rotate(${progress * 280}deg)`;
  }, { passive: true });

  const finish = () => {
    indicator.style.transition = 'transform .18s var(--ease),opacity .18s var(--ease)';
    if (dragging && armed) {
      indicator.style.transform = 'translateX(-50%) translateY(16px) scale(1)';
      location.reload();
    } else {
      reset();
    }
    dragging = false; startY = null; armed = false;
  };
  document.addEventListener('touchend', finish, { passive: true });
  document.addEventListener('touchcancel', finish, { passive: true });
}

// 이미 앱으로 설치되어 실행 중이면 설치 안내 아이콘은 숨김
function _applyInstallBtnVisibility() {
  const show = !_isStandaloneApp();
  document.querySelectorAll('.js-install-btn').forEach(btn => {
    btn.style.display = show ? 'flex' : 'none';
  });
}

function openInstallGuideSheet() {
  const ua = navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(ua) && !window.MSStream;
  const isAndroid = /Android/.test(ua);

  const backdrop = document.createElement('div');
  backdrop.className = 'custom-sheet-backdrop';
  backdrop.style.zIndex = '3000';
  const sheet = document.createElement('div');
  sheet.className = 'custom-sheet';
  sheet.style.cssText = 'padding-bottom:40px;';

  let bodyHtml;
  if (_isStandaloneApp()) {
    bodyHtml = `<div style="text-align:center;padding:12px 0 4px;">
      <div style="font-size:32px;margin-bottom:10px;">✅</div>
      <div style="font-size:14px;font-weight:700;color:var(--ink);">이미 앱으로 설치되어 있어요</div>
    </div>`;
  } else if (_deferredInstallPrompt) {
    bodyHtml = `
      <div style="font-size:13px;color:var(--ink-2);line-height:1.7;margin-bottom:18px;">
        아래 버튼을 누르면 바로 설치할 수 있어요. 설치하면 브라우저 주소창 없이
        앱처럼 홈 화면·바탕화면에서 바로 실행할 수 있습니다.
      </div>
      <button id="_installNowBtn" style="width:100%;padding:14px;border:none;border-radius:var(--radius);background:var(--blue);color:#fff;font-family:var(--font);font-size:14px;font-weight:700;cursor:pointer;box-shadow:var(--sh-blue);">지금 설치하기</button>`;
  } else if (isIOS) {
    bodyHtml = `
      <div style="display:flex;flex-direction:column;gap:12px;">
        ${_installStep('1', '하단(또는 상단) 공유 버튼을 탭하세요', '⬆️')}
        ${_installStep('2', `메뉴에서 <b>"홈 화면에 추가"</b>를 선택하세요`, '➕')}
        ${_installStep('3', `우측 상단 <b>"추가"</b>를 탭하면 완료!`, '✅')}
      </div>`;
  } else if (isAndroid) {
    bodyHtml = `
      <div style="display:flex;flex-direction:column;gap:12px;">
        ${_installStep('1', '우측 상단 브라우저 메뉴(⋮)를 여세요', '⋮')}
        ${_installStep('2', `<b>"앱 설치"</b> 또는 <b>"홈 화면에 추가"</b>를 선택하세요`, '📲')}
      </div>`;
  } else {
    bodyHtml = `
      <div style="display:flex;flex-direction:column;gap:12px;">
        ${_installStep('1', '주소창 우측의 설치 아이콘을 클릭하세요', '⊕')}
        ${_installStep('2', `없다면 브라우저 메뉴에서 <b>"앱 설치"</b>를 찾아보세요`, '💻')}
      </div>`;
  }

  sheet.innerHTML = `
    <div class="custom-sheet-handle"></div>
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:18px;">
      <div style="width:42px;height:42px;border-radius:var(--radius-sm);background:var(--blue-dim);display:flex;align-items:center;justify-content:center;box-shadow:var(--sh-sm);flex-shrink:0;">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--blue)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="2" width="12" height="20" rx="2"/><path d="M12 8v6"/><path d="M9.5 11.5 12 14l2.5-2.5"/></svg>
      </div>
      <div style="flex:1;">
        <div style="font-size:16px;font-weight:800;color:var(--ink);letter-spacing:-0.4px;">앱으로 설치</div>
        <div style="font-size:11px;color:var(--ink-3);margin-top:1px;">홈 화면·바탕화면에서 바로 실행</div>
      </div>
      <button id="_installClose" aria-label="닫기" style="width:30px;height:30px;border-radius:50%;border:none;background:var(--bg-deep);color:var(--ink-3);cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:var(--sh-xs);flex-shrink:0;">
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>
    ${bodyHtml}`;

  backdrop.appendChild(sheet);
  document.body.appendChild(backdrop);
  requestAnimationFrame(() => requestAnimationFrame(() => backdrop.classList.add('show')));
  const close = () => { backdrop.classList.remove('show'); setTimeout(() => backdrop.remove(), 420); };
  backdrop.addEventListener('click', e => { if (e.target === backdrop) close(); });
  sheet.querySelector('#_installClose').addEventListener('click', close);

  const installBtn = sheet.querySelector('#_installNowBtn');
  if (installBtn) {
    installBtn.addEventListener('click', async () => {
      if (!_deferredInstallPrompt) return;
      installBtn.disabled = true; installBtn.textContent = '설치 중...';
      _deferredInstallPrompt.prompt();
      const { outcome } = await _deferredInstallPrompt.userChoice;
      _deferredInstallPrompt = null;
      if (outcome === 'accepted') { showSuccessToast('설치 완료!'); close(); }
      else { installBtn.disabled = false; installBtn.textContent = '지금 설치하기'; }
    });
  }
}

function _installStep(num, text, emoji) {
  return `<div style="display:flex;align-items:center;gap:12px;background:var(--bg-deep);border-radius:var(--radius-sm);padding:12px 14px;">
    <div style="width:30px;height:30px;border-radius:50%;background:var(--surface);box-shadow:var(--sh-sm);display:flex;align-items:center;justify-content:center;font-size:14px;flex-shrink:0;">${emoji}</div>
    <div style="font-size:13px;color:var(--ink-2);line-height:1.5;flex:1;">${text}</div>
  </div>`;
}

