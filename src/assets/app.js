/* 테마 토글 + 모바일 내비 — 의존성 없는 경량 스크립트 */
(function () {
  var root = document.documentElement, KEY = 'hue-theme';
  try { var saved = localStorage.getItem(KEY); if (saved) root.setAttribute('data-theme', saved); } catch (e) {}

  function current() {
    return root.getAttribute('data-theme') ||
      (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  }
  function sync(btn) {
    var dark = current() === 'dark';
    btn.setAttribute('aria-label', dark ? '라이트 모드로 전환' : '다크 모드로 전환');
    btn.setAttribute('aria-pressed', String(dark));
    btn.querySelector('.ic-sun').hidden = !dark;
    btn.querySelector('.ic-moon').hidden = dark;
  }
  document.addEventListener('DOMContentLoaded', function () {
    var btn = document.querySelector('[data-theme-toggle]');
    if (btn) {
      sync(btn);
      btn.addEventListener('click', function () {
        var next = current() === 'dark' ? 'light' : 'dark';
        root.setAttribute('data-theme', next);
        try { localStorage.setItem(KEY, next); } catch (e) {}
        sync(btn);
      });
    }
    var tg = document.querySelector('[data-nav-toggle]');
    var nav = document.getElementById('mnav');
    if (tg && nav) {
      tg.addEventListener('click', function () {
        var open = nav.hasAttribute('hidden');
        if (open) { nav.removeAttribute('hidden'); } else { nav.setAttribute('hidden', ''); }
        tg.setAttribute('aria-expanded', String(open));
      });
    }
    /* 전화 버튼 클릭 추적 훅 (GA/네이버 애널리틱스 연결 지점) */
    document.addEventListener('click', function (e) {
      var a = e.target.closest && e.target.closest('a[href^="tel:"]');
      if (a && window.dataLayer) window.dataLayer.push({ event: 'tel_click', location: a.dataset.loc || 'unknown' });
    }, { passive: true });
  });
})();
