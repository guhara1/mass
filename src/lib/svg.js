/* ===========================================================
 *  텍스트 기반 SVG 아트 생성기
 *  - 사진을 전혀 쓰지 않고, 업소명/지역명 타이포 + 기하 패턴으로
 *    카드 썸네일과 히어로 박스를 만든다.
 *  - 모든 색 조합은 본문 대비 4.5:1 이상을 만족하는 쌍으로만 구성.
 *  - seed 기반이라 같은 업소는 항상 같은 그림이 나온다.
 * =========================================================== */
import { rng } from './rng.js';

/* 색 조합: [배경1, 배경2, 본문, 보조선, 강조] */
export const SCHEMES = [
  { id: 'pine',    bg: ['#07382F', '#0B6B5B'], fg: '#F2FBF7', sub: '#9FDCCB', ac: '#FFC27A', dark: true },
  { id: 'clay',    bg: ['#F6EADF', '#EBD6C3'], fg: '#3A2317', sub: '#8A6B55', ac: '#C2561F', dark: false },
  { id: 'ink',     bg: ['#14181C', '#262D34'], fg: '#F4F1EC', sub: '#9AA4AE', ac: '#7FD1C0', dark: true },
  { id: 'sand',    bg: ['#FBF6EC', '#F0E6D2'], fg: '#2E2A20', sub: '#8B7F67', ac: '#A9802F', dark: false },
  { id: 'plum',    bg: ['#2C1B2E', '#4A2B47'], fg: '#FBF2F7', sub: '#C9A6C4', ac: '#F3B07A', dark: true },
  { id: 'mist',    bg: ['#EFF4F3', '#DCE8E6'], fg: '#17262A', sub: '#5F7A7D', ac: '#0B6B5B', dark: false },
  { id: 'olive',   bg: ['#23291A', '#3C4A2A'], fg: '#F4F7EC', sub: '#B6C79B', ac: '#EDB95A', dark: true },
  { id: 'rose',    bg: ['#FBF0EE', '#F2DCD8'], fg: '#3A1F1C', sub: '#916560', ac: '#B2432F', dark: false },
  { id: 'indigo',  bg: ['#141C32', '#26355C'], fg: '#F0F3FB', sub: '#9FAED6', ac: '#F0B36B', dark: true },
  { id: 'linen',   bg: ['#F7F5F0', '#E7E2D7'], fg: '#262420', sub: '#7D776A', ac: '#5A6B2F', dark: false },
  { id: 'teal',    bg: ['#0C2A33', '#17525F'], fg: '#EFFAFB', sub: '#95C8D2', ac: '#FFB77A', dark: true },
  { id: 'amber',   bg: ['#FDF3E4', '#F6E3C4'], fg: '#33260F', sub: '#8A7446', ac: '#B2541B', dark: false }
];

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/* ── 패턴 레이어 ─────────────────────────────────────────── */
function pattern(kind, r, w, h, c) {
  const S = [];
  const op = c.dark ? 0.5 : 0.62;
  switch (kind) {
    case 'arcs': {
      const cx = r.bool() ? w * 0.82 : w * 0.18, cy = h * 0.78;
      for (let i = 1; i <= 6; i++) {
        S.push(`<circle cx="${cx}" cy="${cy}" r="${i * (h / 6.2)}" fill="none" stroke="${c.sub}" stroke-opacity="${(op - i * 0.055).toFixed(2)}" stroke-width="${(1.6 - i * 0.12).toFixed(2)}"/>`);
      }
      break;
    }
    case 'waves': {
      for (let i = 0; i < 5; i++) {
        const y = h * (0.42 + i * 0.13);
        S.push(`<path d="M0 ${y.toFixed(1)} C ${w * 0.27} ${(y - h * 0.09).toFixed(1)}, ${w * 0.6} ${(y + h * 0.1).toFixed(1)}, ${w} ${(y - h * 0.03).toFixed(1)}" fill="none" stroke="${c.sub}" stroke-opacity="${(op - i * 0.08).toFixed(2)}" stroke-width="1.5"/>`);
      }
      break;
    }
    case 'rays': {
      const cx = w * 0.5, cy = h * 1.18;
      for (let i = 0; i <= 14; i++) {
        const a = (-Math.PI * 0.86) + (i / 14) * (Math.PI * 0.72);
        S.push(`<line x1="${cx.toFixed(1)}" y1="${cy.toFixed(1)}" x2="${(cx + Math.cos(a) * h * 1.9).toFixed(1)}" y2="${(cy + Math.sin(a) * h * 1.9).toFixed(1)}" stroke="${c.sub}" stroke-opacity="${(op * 0.45).toFixed(2)}" stroke-width="1"/>`);
      }
      break;
    }
    case 'grid': {
      S.push(`<defs><pattern id="pg${c.uid}" width="14" height="14" patternUnits="userSpaceOnUse"><circle cx="1.6" cy="1.6" r="1.25" fill="${c.sub}" fill-opacity="${(op * 0.7).toFixed(2)}"/></pattern></defs><rect width="${w}" height="${h}" fill="url(#pg${c.uid})"/>`);
      break;
    }
    case 'mesh': {
      for (let i = -2; i < 12; i++) {
        const x = i * (w / 9);
        S.push(`<line x1="${x.toFixed(1)}" y1="0" x2="${(x + h * 0.8).toFixed(1)}" y2="${h}" stroke="${c.sub}" stroke-opacity="${(op * 0.35).toFixed(2)}" stroke-width="1"/>`);
      }
      break;
    }
    case 'blocks': {
      const n = r.int(4, 6);
      for (let i = 0; i < n; i++) {
        const bw = r.int(26, 76), bh = r.int(10, 26);
        S.push(`<rect x="${r.int(0, w - bw)}" y="${r.int(Math.round(h * 0.52), h - bh)}" width="${bw}" height="${bh}" rx="3" fill="${c.sub}" fill-opacity="${(0.1 + r.float() * 0.2).toFixed(2)}"/>`);
      }
      break;
    }
    case 'ring': {
      S.push(`<circle cx="${(w * 0.74).toFixed(0)}" cy="${(h * 0.34).toFixed(0)}" r="${(h * 0.44).toFixed(0)}" fill="none" stroke="${c.ac}" stroke-opacity="0.35" stroke-width="2"/>`);
      S.push(`<circle cx="${(w * 0.74).toFixed(0)}" cy="${(h * 0.34).toFixed(0)}" r="${(h * 0.26).toFixed(0)}" fill="${c.ac}" fill-opacity="0.1"/>`);
      break;
    }
    default: { /* terrain */
      for (let i = 0; i < 4; i++) {
        const y = h * (0.56 + i * 0.12);
        S.push(`<path d="M0 ${h} L0 ${y.toFixed(1)} Q ${(w * (0.2 + i * 0.12)).toFixed(1)} ${(y - h * 0.16).toFixed(1)} ${(w * 0.55).toFixed(1)} ${(y + h * 0.02).toFixed(1)} T ${w} ${(y - h * 0.04).toFixed(1)} L ${w} ${h} Z" fill="${c.sub}" fill-opacity="${(0.09 + i * 0.03).toFixed(2)}"/>`);
      }
    }
  }
  return S.join('');
}

const KINDS = ['arcs', 'waves', 'rays', 'grid', 'mesh', 'blocks', 'ring', 'terrain'];

/* 긴 업소명은 두 줄로 쪼갠다 (한글 기준 글자 수) */
function wrap(text, per) {
  const t = String(text).trim();
  if ([...t].length <= per) return [t];
  const words = t.split(/\s+/);
  if (words.length > 1) {
    let a = '', b = '';
    for (const w of words) ((a ? [...a].length : 0) + [...w].length <= per && !b) ? (a += (a ? ' ' : '') + w) : (b += (b ? ' ' : '') + w);
    return b ? [a, b] : [a];
  }
  const arr = [...t];
  return [arr.slice(0, per).join(''), arr.slice(per).join('')];
}

/* ── 업소 카드/상세 썸네일 ──────────────────────────────── */
export function shopArt(shop, { w = 400, h = 260, rounded = 14, role = 'card' } = {}) {
  const r = rng('art:' + shop.id);
  const c = { ...r.pick(SCHEMES), uid: (shop.id || 's').replace(/[^a-z0-9]/gi, '') };
  const kind = r.pick(KINDS);
  const gid = 'g' + c.uid;
  const lines = wrap(shop.name, role === 'hero' ? 11 : 9);
  const big = lines.length > 1 ? (role === 'hero' ? 42 : 30) : (role === 'hero' ? 52 : 37);
  const baseY = h * (lines.length > 1 ? 0.40 : 0.46);

  const txt = lines.map((ln, i) =>
    `<text x="26" y="${(baseY + i * big * 1.1).toFixed(1)}" fill="${c.fg}" font-size="${big}" font-weight="800" letter-spacing="-0.02em">${esc(ln)}</text>`
  ).join('');

  return `<svg class="art art--${kind}" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-label="${esc(shop.name)} ${esc(shop.areaLabel || '')} 이미지" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
<defs><linearGradient id="${gid}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${c.bg[0]}"/><stop offset="1" stop-color="${c.bg[1]}"/></linearGradient></defs>
<rect width="${w}" height="${h}" rx="${rounded}" fill="url(#${gid})"/>
<g clip-path="inset(0 round ${rounded}px)">${pattern(kind, r, w, h, c)}</g>
<rect x="26" y="${(baseY - big - 18).toFixed(1)}" width="34" height="4" rx="2" fill="${c.ac}"/>
${txt}
<text x="26" y="${(h - 54).toFixed(1)}" fill="${c.sub}" font-size="14" font-weight="600" letter-spacing="0.02em">${esc(shop.areaLabel || '')}</text>
<text x="26" y="${(h - 30).toFixed(1)}" fill="${c.ac}" font-size="13" font-weight="700">${esc(shop.kind || '')} · ${esc(shop.open || '')}</text>
<text x="${w - 26}" y="34" text-anchor="end" fill="${c.sub}" font-size="11" font-weight="700" letter-spacing="0.14em">${esc((shop.code || '').toUpperCase())}</text>
</svg>`;
}

/* ── 페이지 히어로 박스 ─────────────────────────────────── */
export function heroArt({ seed, eyebrow = '', title = '', sub = '', w = 900, h = 255,
  scheme = null, cls = 'hero-art', wrapAt = 13, fs = null, decorative = false }) {
  const r = rng('hero:' + seed);
  const darks = SCHEMES.filter(s => s.dark);
  const c = { ...(scheme ? (SCHEMES.find(s => s.id === scheme) || darks[0]) : r.pick(darks)),
              uid: 'h' + Math.abs([...String(seed)].reduce((a, x) => (a * 31 + x.charCodeAt(0)) % 999983, 7)) };
  const kind = r.pick(KINDS);
  const gid = 'hg' + c.uid + (cls.includes('--m') ? 'm' : 'd');
  const lines = wrap(title, wrapAt);
  const F = fs || { eyebrow: 14, title1: 48, title2: 40, sub: 16 };
  const big = lines.length > 1 ? F.title2 : F.title1;
  const y0 = h * (lines.length > 1 ? 0.44 : 0.52);
  const pad = Math.round(w * 0.045);

  return `<svg class="${cls}" viewBox="0 0 ${w} ${h}" ${decorative ? 'aria-hidden="true" role="presentation"' : `role="img" aria-label="${esc(title)}"`} preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
<defs><linearGradient id="${gid}" x1="0.1" y1="0" x2="0.9" y2="1"><stop offset="0" stop-color="${c.bg[0]}"/><stop offset="1" stop-color="${c.bg[1]}"/></linearGradient></defs>
<rect width="${w}" height="${h}" fill="url(#${gid})"/>
${pattern(kind, r, w, h, c)}
<text x="${pad}" y="${(y0 - big - F.eyebrow * 1.1).toFixed(1)}" fill="${c.ac}" font-size="${F.eyebrow}" font-weight="800" letter-spacing="0.16em">${esc(eyebrow)}</text>
${lines.map((ln, i) => `<text x="${pad}" y="${(y0 + i * big * 1.08).toFixed(1)}" fill="${c.fg}" font-size="${big}" font-weight="850" letter-spacing="-0.03em">${esc(ln)}</text>`).join('')}
<text x="${pad}" y="${(h - F.sub * 1.9).toFixed(1)}" fill="${c.sub}" font-size="${F.sub}" font-weight="500">${esc(sub)}</text>
<rect x="${pad}" y="${(h - F.sub * 1.2).toFixed(1)}" width="${Math.round(w * 0.08)}" height="4" rx="2" fill="${c.ac}"/>
</svg>`;
}

/* ── 브랜드 로고 (텍스트 SVG) ───────────────────────────
 * 상호 글자 수에 맞춰 뷰박스 폭을 계산하므로 상호를 바꿔도 잘리지 않는다. */
export function logoSvg(brand, brandEn) {
  const chars = [...String(brand)];
  const textW = chars.reduce((a, ch) => a + (/[\s]/.test(ch) ? 7 : /[가-힣]/.test(ch) ? 20.6 : 12), 0);
  const w = Math.max(150, Math.round(46 + textW + 8));
  return `<svg class="logo" viewBox="0 0 ${w} 40" role="img" aria-label="${esc(brand)}" xmlns="http://www.w3.org/2000/svg">
<path d="M4 29 C 4 13, 15 7, 22 7 C 29 7, 33 12, 33 18 C 33 26, 25 33, 15 33" fill="none" stroke="currentColor" stroke-width="3.4" stroke-linecap="round" opacity="0.9"/>
<circle cx="29.5" cy="29.5" r="3.6" fill="currentColor"/>
<text x="46" y="25" fill="currentColor" font-size="21" font-weight="850" letter-spacing="-0.02em">${esc(brand)}</text>
<text x="46" y="36" fill="currentColor" font-size="8.5" font-weight="700" letter-spacing="0.26em" opacity="0.62">${esc(brandEn)}</text>
</svg>`;
}

/* ── 지역 타일용 소형 마크 ─────────────────────────────── */
export function areaMark(label, seed) {
  const r = rng('mark:' + seed);
  const c = r.pick(SCHEMES);
  const uid = 'am' + Math.abs(Array.from(String(seed)).reduce((a, x) => a * 31 + x.charCodeAt(0), 7) % 99999);
  return `<svg class="area-mark" viewBox="0 0 64 64" role="presentation" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
<defs><linearGradient id="${uid}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${c.bg[0]}"/><stop offset="1" stop-color="${c.bg[1]}"/></linearGradient></defs>
<rect width="64" height="64" rx="16" fill="url(#${uid})"/>
<text x="32" y="40" text-anchor="middle" fill="${c.fg}" font-size="23" font-weight="850">${esc([...String(label)][0] || '·')}</text>
</svg>`;
}
