import { SITE, PHONE_HREF } from '../data/site.js';
import { esc } from '../lib/seo.js';
import { shopArt, heroArt, areaMark } from '../lib/svg.js';
import { ICON } from './layout.js';

const won = v => Number(v).toLocaleString('ko-KR');

/* ── 브레드크럼 ────────────────────────────────────────── */
export const breadcrumb = crumbs => `<nav class="bc" aria-label="현재 위치">
  <ol>${crumbs.map((c, i) => `<li>${c.href && i < crumbs.length - 1
    ? `<a href="${c.href}">${esc(c.label)}</a>`
    : `<span aria-current="page">${esc(c.label)}</span>`}</li>`).join('')}</ol>
</nav>`;

/* ── 히어로 (텍스트 SVG) ──────────────────────────────────
 * 데스크톱/모바일 두 벌을 내보내고 CSS 로 전환한다.
 * 뷰박스를 화면 폭에 맞춰 따로 두어야 한글 타이포가 적정 크기로 보인다.
 * h1 이 히어로 박스를 감싸므로 제목이 화면에서 중복되지 않는다. */
const HERO_D = { eyebrow: 14, title1: 48, title2: 40, sub: 16 };
const HERO_M = { eyebrow: 14, title1: 40, title2: 32, sub: 16 };

function heroBox({ seed, eyebrow, title, sub, scheme }) {
  return `<h1 class="hero__box">
    ${heroArt({ seed, eyebrow, title, sub, w: 900, h: 255, scheme, cls: 'hero-art hero-art--d', wrapAt: 15, fs: HERO_D, decorative: true })}
    ${heroArt({ seed, eyebrow, title, sub, w: 400, h: 300, scheme, cls: 'hero-art hero-art--m', wrapAt: 9, fs: HERO_M, decorative: true })}
    <span class="sr">${esc(title)}</span>
  </h1>`;
}

export function hero({ seed, eyebrow, title, sub, lead, chips = [], scheme, extra = '', cta = true }) {
  return `<section class="hero">
  <div class="wrap">
    ${heroBox({ seed, eyebrow, title, sub, scheme })}
    ${chips.length ? `<div class="hero__meta chips">${chips.map(c => `<span class="chip ${c.cls || ''}">${esc(c.t)}</span>`).join('')}</div>` : ''}
    ${lead ? `<p class="hero__lead">${esc(lead)}</p>` : ''}
    ${cta ? `<div class="hero__cta">
      <a class="btn btn--call" href="${PHONE_HREF}" data-loc="hero">${ICON.phone}출장마사지 ${esc(SITE.tel)}</a>
      <a class="btn btn--ghost" href="#areas">지역 선택</a>
    </div>` : ''}
    ${extra}
  </div>
</section>`;
}

/* 지역/안내 페이지용 — hero() 와 동일 구조 (호환 유지) */
export function heroH1({ seed, eyebrow, title, sub, lead, chips = [], extra = '', scheme }) {
  return `<section class="hero">
  <div class="wrap">
    ${heroBox({ seed, eyebrow, title, sub, scheme })}
    ${chips.length ? `<div class="hero__meta chips">${chips.map(c => `<span class="chip ${c.cls || ''}">${esc(c.t)}</span>`).join('')}</div>` : ''}
    ${lead ? `<p class="hero__lead">${esc(lead)}</p>` : ''}
    ${extra}
  </div>
</section>`;
}

/* ── 답변 요약 (AEO) ──────────────────────────────────── */
export const answerBox = (text, label = '한눈에 보기') => `<div class="answer">
  <span class="answer__k">${esc(label)}</span>
  <p>${esc(text)}</p>
</div>`;

/* ── 지역 타일 ────────────────────────────────────────── */
export const areaTile = ({ href, title, sub, seed }) => `<a class="tile" href="${href}">
  ${areaMark(title, seed || title)}
  <span><span class="tile__t">${esc(title)}</span><span class="tile__s">${esc(sub)}</span></span>
</a>`;

/* ── 업소 카드 ────────────────────────────────────────── */
export function shopCard(s, { showArea = true } = {}) {
  return `<article class="card">
  <div class="card__art">
    ${shopArt(s, { w: 400, h: 260 })}
    <span class="card__badge">${esc(s.kind)}</span>
  </div>
  <div class="card__body">
    <a class="card__t" href="${s.path}">${esc(s.name)}</a>
    ${showArea ? `<span class="card__area">${esc(s.areaLabel)} · ${esc(s.station)}</span>` : `<span class="card__area">${esc(s.style)} · ${esc(s.open)}</span>`}
    <p class="card__desc">${esc(s.desc)}</p>
    <div class="chips">${s.tags.slice(0, 3).map(t => `<span class="chip ${t === '출장 마사지' || t === '홈타이' ? 'chip--terra' : ''}">${esc(t)}</span>`).join('')}</div>
    <div class="card__foot">
      <span class="card__price">${won(s.minPrice)}원<small> 부터</small></span>
      <a class="card__call" href="${PHONE_HREF}" data-loc="card" aria-label="${esc(s.name)} 출장마사지 전화연결">${ICON.phone}출장마사지</a>
    </div>
  </div>
</article>`;
}

/* ── 본문 (지역 고유 콘텐츠) ──────────────────────────── */
export function proseBlock(content, { toc = true } = {}) {
  const ids = content.sections.map((s, i) => `s${i + 1}-${s.id}`);
  const tocHtml = toc ? `<nav class="toc" aria-label="이 페이지 목차">
    <b>목차</b>
    <ol>${content.sections.map((s, i) => `<li><a href="#${ids[i]}">${esc(s.title)}</a></li>`).join('')}</ol>
  </nav>` : '';
  const body = content.sections.map((s, i) => `<h2 id="${ids[i]}">${esc(s.title)}</h2>
${s.paras.map(p => `<p>${esc(p)}</p>`).join('\n')}`).join('\n');
  return `${tocHtml}<div class="prose mt">${body}</div>`;
}

/* ── FAQ (AEO) ────────────────────────────────────────── */
export const faqBlock = (faq, title = '자주 묻는 질문') => `<section class="sec" id="faq">
  <div class="wrap">
    <div class="sec__hd"><h2>${esc(title)}</h2></div>
    <div class="faq">
      ${faq.map((f, i) => `<details${i === 0 ? ' open' : ''}>
        <summary>${esc(f.q)}</summary>
        <div class="a">${esc(f.a)}</div>
      </details>`).join('')}
    </div>
  </div>
</section>`;

/* ── 섹션 래퍼 ────────────────────────────────────────── */
export const section = ({ id, title, more, body, moreLabel = '전체 보기' }) => `<section class="sec"${id ? ` id="${id}"` : ''}>
  <div class="wrap">
    ${title ? `<div class="sec__hd"><h2>${esc(title)}</h2>${more ? `<a class="sec__more" href="${more}">${esc(moreLabel)} →</a>` : ''}</div>` : ''}
    ${body}
  </div>
</section>`;

/* ── 통계 ─────────────────────────────────────────────── */
export const stats = items => `<div class="stats">${items.map(i => `<div><b>${esc(i.v)}</b><span>${esc(i.l)}</span></div>`).join('')}</div>`;

/* ── 고지 ─────────────────────────────────────────────── */
export const note = (html, cls = '') => `<div class="note ${cls}">${html}</div>`;

/* ── 코스 요금표 ──────────────────────────────────────── */
export const courseTable = s => `<div class="pricecard" id="courses">
  <div class="pricecard__hd"><span>코스 · 요금</span><small>${esc(s.kind)} 기준</small></div>
  <div class="tbl-wrap" style="border:0;border-radius:0">
    <table class="tbl">
      <caption class="sr">${esc(s.name)} 코스별 시간과 요금</caption>
      <thead><tr><th scope="col">코스</th><th scope="col">시간</th><th scope="col" style="text-align:right">요금</th></tr></thead>
      <tbody>${s.courses.map(c => `<tr><th scope="row" style="font-weight:700">${esc(c.name)}</th><td>${c.min}분</td><td class="num">${won(c.price)}원</td></tr>`).join('')}</tbody>
    </table>
  </div>
</div>`;

/* ── 정의 리스트 ──────────────────────────────────────── */
export const dl = rows => `<dl class="dl">${rows.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${v}</dd></div>`).join('')}</dl>`;

export { won };
