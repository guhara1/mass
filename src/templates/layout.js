import { SITE, PHONE_HREF } from '../data/site.js';
import { logoSvg } from '../lib/svg.js';
import { esc, head } from '../lib/seo.js';
import { REGIONS } from '../data/regions.js';

const ICON = {
  phone: '<svg class="ic" width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5.6 3h3l1.6 4-2 1.4a12.5 12.5 0 0 0 5.4 5.4L15 11.8l4 1.6v3a2 2 0 0 1-2.2 2A16.5 16.5 0 0 1 3.6 5.2A2 2 0 0 1 5.6 3Z" fill="currentColor"/></svg>',
  sun: '<svg class="ic-sun" width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="4.2" fill="currentColor"/><g stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M12 2.6v2.2M12 19.2v2.2M2.6 12h2.2M19.2 12h2.2M5.4 5.4l1.6 1.6M17 17l1.6 1.6M18.6 5.4 17 7M7 17l-1.6 1.6"/></g></svg>',
  moon: '<svg class="ic-moon" width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M20 14.4A8.6 8.6 0 0 1 9.6 4a8.8 8.8 0 1 0 10.4 10.4Z" fill="currentColor"/></svg>',
  menu: '<svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true"><g stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></g></svg>'
};

/* ── 상단 헤더 ─────────────────────────────────────────── */
function header(active) {
  const links = SITE.nav.map(n =>
    `<li><a href="${n.href}"${active && active.startsWith(n.href) && n.href !== '/' ? ' aria-current="page"' : ''}>${esc(n.label)}</a></li>`
  ).join('');
  return `<header class="hd">
  <div class="wrap hd__bar">
    <a class="hd__logo" href="/" aria-label="${esc(SITE.brand)} 홈">${logoSvg(SITE.brand, SITE.brandEn)}</a>
    <nav class="hd__nav" aria-label="지역 및 안내 메뉴"><ul>${links}</ul></nav>
    <div class="hd__act">
      <button class="icobtn" data-nav-toggle aria-expanded="false" aria-controls="mnav" aria-label="메뉴 열기">${ICON.menu}</button>
      <button class="icobtn" data-theme-toggle aria-label="다크 모드로 전환">${ICON.sun}${ICON.moon}</button>
      <a class="hd__tel" href="${PHONE_HREF}" data-loc="header" aria-label="${esc(SITE.telLabel)} ${esc(SITE.tel)}">
        ${ICON.phone}<span class="lbl">출장마사지</span><span class="sm">전화</span><span class="n">${esc(SITE.tel)}</span>
      </a>
    </div>
  </div>
  <nav id="mnav" hidden aria-label="모바일 메뉴" style="border-top:1px solid var(--line);background:var(--surface)">
    <ul class="wrap" style="display:grid;gap:2px;padding-block:10px">
      ${SITE.nav.map(n => `<li><a href="${n.href}" style="display:flex;min-height:48px;align-items:center;font-weight:700;padding-inline:4px">${esc(n.label)}</a></li>`).join('')}
    </ul>
  </nav>
</header>`;
}

/* ── 푸터 ──────────────────────────────────────────────── */
function footer() {
  const regionLinks = REGIONS.map(r => `<li><a href="/${r.slug}/">${esc(r.full)} 전체</a></li>`).join('');
  return `<footer class="ft">
  <div class="wrap">
    <div class="ft__grid">
      <div>
        <div class="ft__logo">${logoSvg(SITE.brand, SITE.brandEn)}</div>
        <p class="ft__desc">${esc(SITE.tagline)}. 서울·경기·인천의 행정구와 행정동 단위로 코스·요금·운영시간을 정리하고, 출장 마사지와 홈타이 예약을 한 번호로 연결합니다.</p>
        <p class="ft__desc" style="margin-top:10px"><strong>${esc(SITE.operator.name)}</strong> · ${esc(SITE.operator.role)}<br>등록 기준: ${esc(SITE.operator.policy)}</p>
      </div>
      <div>
        <h3>지역</h3>
        <ul>${regionLinks}<li><a href="/areas/">행정구 전체 목록</a></li></ul>
      </div>
      <div>
        <h3>안내</h3>
        <ul>
          <li><a href="/guide/course/">코스·요금 안내</a></li>
          <li><a href="/guide/how-to/">이용 방법</a></li>
          <li><a href="/guide/visit/">출장 마사지·홈타이</a></li>
          <li><a href="/guide/faq/">자주 묻는 질문</a></li>
          <li><a href="/policy/">운영 및 정보 정책</a></li>
        </ul>
      </div>
    </div>
    <div class="ft__legal">
      <span><strong>예약·상담</strong> <a href="${PHONE_HREF}" data-loc="footer" style="font-weight:800;color:var(--terra)">${esc(SITE.tel)}</a> · ${esc(SITE.telSubLabel)}</span>
      <span>본 사이트는 지역별 마사지 로드샵 정보를 정리해 제공하는 안내 매체입니다. 현재 노출되는 업소 정보는 실입점 전 <strong>샘플 데이터</strong>이며, 실제 운영 여부와 요금은 전화 상담에서 확정됩니다.</span>
      <span>19세 미만 이용 불가 · 불법 영업 및 성매매 알선과 무관하며, 해당 문의는 응대하지 않습니다.</span>
      <span>최근 정보 확인일 ${esc(SITE.updated)} · © ${new Date(SITE.updated).getFullYear()} ${esc(SITE.brand)}</span>
    </div>
  </div>
</footer>`;
}

/* ── 모바일 고정 전화 바 (로드샵 상세) ─────────────────── */
export function callBar(shop) {
  return `<div class="callbar" role="region" aria-label="전화 예약">
  <div class="callbar__in">
    <a class="callbar__tel" href="${PHONE_HREF}" data-loc="callbar-shop" aria-label="출장마사지 전화연결 ${esc(SITE.tel)}">
      ${ICON.phone}
      <span class="tx"><span class="l1">출장마사지 전화연결</span><span class="l2">${esc(SITE.tel)}</span></span>
    </a>
    <a class="callbar__alt" href="#courses">코스·요금</a>
  </div>
</div>`;
}

/* ── 모바일 플로팅 버튼 (그 외 페이지) ─────────────────── */
export function fab() {
  return `<a class="fab" href="${PHONE_HREF}" data-loc="fab" aria-label="출장마사지 전화연결 ${esc(SITE.tel)}">${ICON.phone}출장마사지 전화</a>`;
}

/* ── 레이아웃 ──────────────────────────────────────────── */
export function layout({ seo, body, active, bottom = '' }) {
  return `<!doctype html>
<html lang="ko">
<head>
${head(seo)}
</head>
<body>
<a class="skip" href="#main">본문으로 바로가기</a>
${header(active)}
<main id="main">
${body}
</main>
${footer()}
${bottom}
<script src="/assets/app.js" defer></script>
</body>
</html>`;
}

export { ICON };
