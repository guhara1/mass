/* ===========================================================
 *  dist/ 전수 감사
 *   1) 행정구·행정동 본문 1,500자 이상
 *   2) 로드샵 디스크립션에 "출장 마사지" + "홈타이" 포함
 *   3) title / description / canonical 전부 고유
 *   4) 내부 링크 깨짐 없음
 *   5) 전화 버튼(05082024749) · 로드샵 모바일 고정바 문구
 *   6) JSON-LD 파싱 + FAQPage 존재
 *   7) 근접 중복(유사도) 검사 — 스팸 패널티 예방
 * =========================================================== */
import { readdir, readFile, stat } from 'node:fs/promises';
import { join, relative } from 'node:path';

const OUT = 'dist';
const files = [];
async function walk(d) {
  for (const e of await readdir(d, { withFileTypes: true })) {
    const p = join(d, e.name);
    if (e.isDirectory()) await walk(p);
    else if (e.name.endsWith('.html')) files.push(p);
  }
}
await walk(OUT);

const pathOf = f => '/' + relative(OUT, f).replace(/index\.html$/, '').replace(/\\/g, '/');
const text = html => html
  .replace(/<script[\s\S]*?<\/script>/gi, ' ')
  .replace(/<style[\s\S]*?<\/style>/gi, ' ')
  .replace(/<svg[\s\S]*?<\/svg>/gi, ' ')
  .replace(/<[^>]+>/g, ' ')
  .replace(/&[a-z#0-9]+;/gi, ' ')
  .replace(/\s+/g, ' ').trim();
const attr = (html, re) => (html.match(re) || [, ''])[1];

const docs = [];
for (const f of files) {
  const html = await readFile(f, 'utf8');
  docs.push({ f, path: pathOf(f), html, size: Buffer.byteLength(html) });
}

const err = [], warn = [];
const E = m => err.push(m), W = m => warn.push(m);

/* 페이지 종류 판정 */
const kindOf = p => {
  if (p === '/') return 'home';
  if (p === '/404.html') return '404';
  if (p === '/topic/') return 'topic-index';
  if (p.startsWith('/topic/')) return 'topic';
  if (/^\/(seoul|gyeonggi|incheon)\/$/.test(p)) return 'region';
  const seg = p.split('/').filter(Boolean);
  if (/^(seoul|gyeonggi|incheon)$/.test(seg[0])) {
    if (seg.length === 2) return 'district';
    if (seg.length === 3) return 'dong';
    if (seg.length === 4) return 'shop';
  }
  return 'static';
};

const titles = new Map(), descs = new Map(), canons = new Map();
const known = new Set(docs.map(d => d.path));
const areaTexts = [];
const shopTexts = [];
const schemaStat = new Map();
const linkOut = new Map();
let minOut = Infinity;
let minChars = Infinity, shopOk = 0, telOk = 0;

for (const d of docs) {
  const k = kindOf(d.path);
  const title = attr(d.html, /<title>([^<]*)<\/title>/);
  const desc = attr(d.html, /<meta name="description" content="([^"]*)"/);
  const canon = attr(d.html, /<link rel="canonical" href="([^"]*)"/);

  /* 3) 고유성 */
  if (!title) E(`${d.path} title 없음`);
  if (!desc) E(`${d.path} description 없음`);
  if (!canon) E(`${d.path} canonical 없음`);
  if (d.path !== '/404.html') {
    if (titles.has(title)) E(`title 중복: ${d.path} ↔ ${titles.get(title)}`); else titles.set(title, d.path);
    if (descs.has(desc)) E(`description 중복: ${d.path} ↔ ${descs.get(desc)}`); else descs.set(desc, d.path);
    if (canons.has(canon)) E(`canonical 중복: ${d.path}`); else canons.set(canon, d.path);
    if (!canon.endsWith(d.path)) E(`canonical 불일치: ${d.path} → ${canon}`);
  }
  if (desc && (desc.length < 60 || desc.length > 165)) W(`description 길이 ${desc.length}자: ${d.path}`);

  /* h1 1개 */
  const h1 = (d.html.match(/<h1[\s>]/g) || []).length;
  if (h1 !== 1) E(`${d.path} h1 ${h1}개`);

  /* 5) 전화번호 */
  if (/href="tel:05082024749"/.test(d.html)) telOk++; else E(`${d.path} 전화 링크 없음`);

  /* 사진 미사용(텍스트 SVG 전용) */
  if (/<img[\s>]/.test(d.html)) E(`${d.path} <img> 사용 — 텍스트 SVG 전용 규칙 위반`);

  /* 6) JSON-LD — 페이지 종류별 필수 타입 검증 */
  const lds = [...d.html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
  if (!lds.length) E(`${d.path} JSON-LD 없음`);
  const NEED = {
    home:       ['Organization', 'WebSite', 'BreadcrumbList', 'CollectionPage', 'Place', 'Service', 'ReserveAction', 'ItemList', 'FAQPage'],
    region:     ['Organization', 'WebSite', 'BreadcrumbList', 'CollectionPage', 'Place', 'Service', 'ReserveAction', 'ItemList', 'FAQPage'],
    district:   ['Organization', 'WebSite', 'BreadcrumbList', 'CollectionPage', 'Place', 'Service', 'ReserveAction', 'ItemList', 'FAQPage'],
    dong:       ['Organization', 'WebSite', 'BreadcrumbList', 'CollectionPage', 'Place', 'Service', 'ReserveAction', 'ItemList', 'FAQPage'],
    shop:       ['Organization', 'WebSite', 'BreadcrumbList', 'ItemPage', 'Place', 'HealthAndBeautyBusiness', 'ReserveAction', 'FAQPage'],
    topic:      ['Organization', 'WebSite', 'BreadcrumbList', 'CollectionPage', 'Service', 'ReserveAction', 'ItemList', 'FAQPage'],
    'topic-index': ['Organization', 'WebSite', 'BreadcrumbList', 'CollectionPage', 'ItemList', 'ReserveAction'],
    static:     ['Organization', 'WebSite', 'BreadcrumbList', 'ReserveAction'],
    '404':      ['Organization', 'WebSite']
  };
  let types = [];
  for (const m of lds) {
    try {
      const g = JSON.parse(m[1].replace(/\\u003c/g, '<'));
      types.push(...(g['@graph'] || [g]).flatMap(n => [].concat(n['@type'])));
    } catch (e) { E(`${d.path} JSON-LD 파싱 실패: ${e.message}`); }
  }
  for (const need of (NEED[k] || [])) {
    if (!types.includes(need)) E(`${d.path} 스키마 ${need} 누락 (있는 것: ${[...new Set(types)].join(',')})`);
  }
  schemaStat.set(k, Math.max(schemaStat.get(k) || 0, new Set(types).size));

  /* 6-b) 내부링크 밀도 — 고립 페이지 방지 */
  const outLinks = new Set([...d.html.matchAll(/href="(\/[^"#?]*)"/g)].map(m => m[1])
    .filter(u => !/\.(css|js|json|svg|xml|txt)$/.test(u) && u !== d.path));
  linkOut.set(d.path, outLinks);
  if (k !== '404' && outLinks.size < 20) E(`${d.path} 내부링크 ${outLinks.size}개 — 20개 미만`);
  minOut = Math.min(minOut, k === '404' ? minOut : outLinks.size);

  /* 1) 본문 1,500자 */
  if (k === 'district' || k === 'dong') {
    const t = text(d.html);
    const main = t.length;
    if (main < 1500) E(`${d.path} 본문 ${main}자 (1,500자 미달)`);
    minChars = Math.min(minChars, main);
    areaTexts.push({ path: d.path, t });
  }

  /* 2) 로드샵 디스크립션 키워드 + 모바일 고정 전화바 */
  if (k === 'shop') {
    shopTexts.push({ path: d.path, t: text(d.html) });
    const okKw = desc.includes('출장 마사지') && desc.includes('홈타이');
    if (!okKw) E(`${d.path} 디스크립션 키워드 누락 (출장 마사지/홈타이)`);
    if (!/class="callbar"/.test(d.html)) E(`${d.path} 모바일 고정 전화바 없음`);
    if (!/출장마사지 전화연결/.test(d.html)) E(`${d.path} 고정바 "출장마사지" 문구 없음`);
    if (okKw) shopOk++;
  }

  /* 4) 내부 링크 */
  for (const m of d.html.matchAll(/href="(\/[^"#?]*)"/g)) {
    const href = m[1];
    if (/\.(css|js|json|svg|xml|txt)$/.test(href)) continue;
    if (!known.has(href)) E(`${d.path} 깨진 링크 → ${href}`);
  }
}

/* 7) 근접 중복 검사 — 12-gram Jaccard */
function shingles(t) {
  const s = new Set();
  const clean = t.replace(/[^가-힣a-zA-Z0-9]/g, '');
  for (let i = 0; i + 12 <= clean.length; i += 3) s.add(clean.slice(i, i + 12));
  return s;
}
function worstPair(list, sampleTarget, label) {
  const sh = list.map(a => ({ path: a.path, s: shingles(a.t) }));
  const pairs = sh.length * (sh.length - 1) / 2;
  const step = Math.max(1, Math.floor(pairs / sampleTarget));
  let worst = { v: 0 }, c = 0, sum = 0, n = 0;
  for (let i = 0; i < sh.length; i++) {
    for (let j = i + 1; j < sh.length; j++) {
      if (c++ % step) continue;
      const A = sh[i].s, B = sh[j].s;
      let inter = 0;
      for (const x of A) if (B.has(x)) inter++;
      const v = inter / (A.size + B.size - inter);
      sum += v; n++;
      if (v > worst.v) worst = { v, a: sh[i].path, b: sh[j].path };
    }
  }
  worst.avg = n ? sum / n : 0;
  worst.label = label;
  return worst;
}

const worst = worstPair(areaTexts, 1500, '지역');
const worstShop = worstPair(shopTexts, 1500, '로드샵');
for (const w of [worst, worstShop]) {
  if (w.v > 0.55) E(`${w.label} 페이지 유사도 과다 ${(w.v * 100).toFixed(1)}%: ${w.a} ↔ ${w.b}`);
  else if (w.v > 0.42) W(`${w.label} 페이지 최대 유사도 ${(w.v * 100).toFixed(1)}%: ${w.a} ↔ ${w.b}`);
}

/* 8) 고립 페이지(인바운드 0) 검사 */
const inbound = new Map(docs.map(d => [d.path, 0]));
for (const [, outs] of linkOut) for (const u of outs) if (inbound.has(u)) inbound.set(u, inbound.get(u) + 1);
const orphans = [...inbound.entries()].filter(([p, n]) => n === 0 && p !== '/' && p !== '/404.html');
for (const [p] of orphans.slice(0, 10)) E(`고립 페이지(인바운드 링크 0): ${p}`);
if (orphans.length > 10) E(`고립 페이지 외 ${orphans.length - 10}건 더`);
const inboundVals = [...inbound.values()];
const minIn = Math.min(...inboundVals.filter((_, i) => [...inbound.keys()][i] !== '/404.html'));

/* 9) sitemap 커버리지 */
import { readFileSync, existsSync } from 'node:fs';
let smCount = 0, smMissing = 0;
if (existsSync(`${OUT}/sitemap.xml`)) {
  const idx = readFileSync(`${OUT}/sitemap.xml`, 'utf8');
  const files = [...idx.matchAll(/<loc>[^<]*\/([^/<]+\.xml)<\/loc>/g)].map(m => m[1]);
  const inSitemap = new Set();
  for (const f of files) {
    const x = readFileSync(`${OUT}/${f}`, 'utf8');
    for (const m of x.matchAll(/<loc>([^<]+)<\/loc>/g)) inSitemap.add(new URL(m[1]).pathname);
  }
  smCount = inSitemap.size;
  for (const d of docs) {
    if (d.path.endsWith('.html')) continue;
    if (!inSitemap.has(d.path)) { smMissing++; if (smMissing <= 5) E(`sitemap 누락: ${d.path}`); }
  }
} else E('sitemap.xml 없음');

/* ── 리포트 ───────────────────────────────────────────── */
const avg = docs.reduce((a, d) => a + d.size, 0) / docs.length / 1024;
console.log(`
감사 결과
────────────────────────────────────────
  페이지            ${docs.length}
  고유 title        ${titles.size}
  고유 description  ${descs.size}
  전화 링크 포함    ${telOk}/${docs.length}
  로드샵 키워드 OK  ${shopOk}
  지역 본문 최소    ${minChars === Infinity ? '-' : minChars + '자'}
  지역 유사도       최대 ${(worst.v * 100).toFixed(1)}% / 평균 ${(worst.avg * 100).toFixed(1)}%
  로드샵 유사도     최대 ${(worstShop.v * 100).toFixed(1)}% / 평균 ${(worstShop.avg * 100).toFixed(1)}%
  내부링크          최소 ${minOut}개 / 모든 페이지 인바운드 최소 ${minIn}개
  스키마 타입 수    ${[...schemaStat.entries()].map(([k, v]) => `${k} ${v}`).join(' · ')}
  sitemap 수록      ${smCount}건 (누락 ${smMissing})
  평균 페이지 용량  ${avg.toFixed(0)} KB
────────────────────────────────────────
  오류 ${err.length}건 / 경고 ${warn.length}건
`);
err.slice(0, 30).forEach(e => console.log('  ✗', e));
if (err.length > 30) console.log(`  … 외 ${err.length - 30}건`);
warn.slice(0, 12).forEach(e => console.log('  !', e));
if (warn.length > 12) console.log(`  … 경고 외 ${warn.length - 12}건`);
process.exit(err.length ? 1 : 0);
