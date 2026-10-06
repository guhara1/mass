/* ===========================================================
 *  정적 사이트 빌드 — 의존성 0 (Node 내장 모듈만 사용)
 *  node build.mjs  →  dist/
 * =========================================================== */
import { mkdir, writeFile, rm, cp } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { performance } from 'node:perf_hooks';

import { SITE } from './src/data/site.js';
import { REGIONS, ALL_DISTRICTS, ALL_DONGS, districtPath, dongPath, STATS } from './src/data/regions.js';
import { ALL_SHOPS } from './src/data/shops.js';
import { pages, buildHome, buildRegion, buildDistrict, buildDong, buildShop } from './src/templates/pages.js';
import {
  staticPages, buildAreasIndex, buildCourseGuide, buildHowTo,
  buildVisitGuide, buildFaqPage, buildPolicy, buildSearch, build404
} from './src/templates/static.js';
import { abs, esc } from './src/lib/seo.js';

const OUT = 'dist';
const t0 = performance.now();

/* ── 페이지 생성 ───────────────────────────────────────── */
buildHome();
REGIONS.forEach(buildRegion);
ALL_DISTRICTS.forEach(buildDistrict);
ALL_DONGS.forEach(buildDong);
ALL_SHOPS.forEach(buildShop);
buildAreasIndex(); buildCourseGuide(); buildHowTo();
buildVisitGuide(); buildFaqPage(); buildPolicy(); buildSearch(); build404();

const ALL = [...pages(), ...staticPages()];

/* ── 중복 경로 점검 ────────────────────────────────────── */
const seen = new Map();
for (const p of ALL) {
  if (seen.has(p.path)) throw new Error(`중복 경로: ${p.path}`);
  seen.set(p.path, true);
}

/* ── 출력 ──────────────────────────────────────────────── */
await rm(OUT, { recursive: true, force: true });
await mkdir(OUT, { recursive: true });

const write = async (rel, body) => {
  const file = join(OUT, rel.replace(/^\//, ''));
  await mkdir(dirname(file), { recursive: true });
  await writeFile(file, body, 'utf8');
};

let bytes = 0;
for (const p of ALL) {
  const rel = p.path.endsWith('.html') ? p.path : `${p.path}index.html`;
  bytes += Buffer.byteLength(p.html);
  await write(rel, p.html);
}

/* ── sitemap.xml ───────────────────────────────────────── */
const prio = path => {
  if (path === '/') return '1.0';
  if (/^\/(seoul|gyeonggi|incheon)\/$/.test(path)) return '0.9';
  const depth = path.split('/').filter(Boolean).length;
  if (depth === 2) return '0.8';          // 행정구
  if (depth === 3) return '0.75';         // 행정동
  if (depth === 4) return '0.6';          // 로드샵
  return '0.5';
};
const urls = ALL.filter(p => !p.path.endsWith('.html')).map(p =>
  `  <url><loc>${abs(p.path)}</loc><lastmod>${SITE.updated}</lastmod><changefreq>weekly</changefreq><priority>${prio(p.path)}</priority></url>`
).join('\n');
await write('/sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>\n`);

/* ── robots.txt ────────────────────────────────────────── */
await write('/robots.txt', `User-agent: *
Allow: /
Disallow: /search/

# 검색엔진별 크롤러 (네이버 Yeti 포함)
User-agent: Yeti
Allow: /
Crawl-delay: 1

User-agent: Googlebot
Allow: /

User-agent: Daum
Allow: /

Sitemap: ${abs('/sitemap.xml')}
`);

/* ── rss.xml (네이버 서치어드바이저 피드 제출용) ────────── */
const feedItems = ALL_DONGS.slice(0, 50).map(g => {
  const u = abs(dongPath(g));
  return `    <item>
      <title>${esc(`${g.district.short || g.district.name} ${g.name} 마사지 — ${g.station} 생활권 로드샵 안내`)}</title>
      <link>${u}</link>
      <guid isPermaLink="true">${u}</guid>
      <description>${esc(`${g.trait}. 기준 랜드마크 ${g.mark}, 가까운 기준점 ${g.station}. 코스·요금·운영시간과 출장 마사지·홈타이 안내.`)}</description>
      <pubDate>${new Date(SITE.updated).toUTCString()}</pubDate>
    </item>`;
}).join('\n');
await write('/rss.xml', `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"><channel>
    <title>${esc(SITE.brand)} — 지역 업데이트</title>
    <link>${abs('/')}</link>
    <description>${esc(SITE.tagline)} · 행정구·행정동 단위 마사지 로드샵 정보</description>
    <language>ko</language>
    <lastBuildDate>${new Date(SITE.updated).toUTCString()}</lastBuildDate>
${feedItems}
</channel></rss>\n`);

/* ── search-index.json ─────────────────────────────────── */
const idx = [
  ...REGIONS.map(r => ({ k: `${r.name} ${r.full}`, t: r.full, s: `${r.unit} ${r.districts.length}곳`, u: `/${r.slug}/` })),
  ...ALL_DISTRICTS.map(dd => ({
    k: [dd.name, dd.short, dd.slug, ...dd.hubs, ...dd.marks].join(' '),
    t: `${dd.region.name} ${dd.name}`, s: dd.dongs.map(x => x.name).join(' · '), u: districtPath(dd)
  })),
  ...ALL_DONGS.map(g => ({
    k: [g.name, g.slug, g.station, g.mark, g.district.name, g.district.short].join(' '),
    t: `${g.district.short || g.district.name} ${g.name}`, s: `${g.station} · ${g.trait}`, u: dongPath(g)
  })),
  ...ALL_SHOPS.map(s => ({ k: [s.name, s.kind, s.areaLabel, s.station].join(' '), t: s.name, s: `${s.areaLabel} · ${s.kind}`, u: s.path }))
];
await write('/search-index.json', JSON.stringify(idx));

/* ── favicon (텍스트 SVG) ──────────────────────────────── */
await write('/favicon.svg', `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
<rect width="64" height="64" rx="15" fill="#0B6B5B"/>
<path d="M14 46 C14 24, 29 16, 37 16 C45 16, 50 22, 50 30 C50 41, 39 50, 26 50" fill="none" stroke="#FBF8F3" stroke-width="5.4" stroke-linecap="round"/>
<circle cx="46" cy="45" r="5.2" fill="#FF8A4F"/>
</svg>\n`);

/* ── 에셋 복사 ─────────────────────────────────────────── */
await mkdir(join(OUT, 'assets'), { recursive: true });
await cp('src/assets/styles.css', join(OUT, 'assets/styles.css'));
await cp('src/assets/app.js', join(OUT, 'assets/app.js'));

/* ── 리포트 ────────────────────────────────────────────── */
const ms = (performance.now() - t0).toFixed(0);
console.log(`
빌드 완료  (${ms}ms)
────────────────────────────────────────
  광역 지역        ${STATS.regions}
  행정구·시        ${STATS.districts}
  행정동           ${STATS.dongs}
  로드샵           ${ALL_SHOPS.length}
  안내/기타        ${staticPages().length}
  ────────────────────────────
  총 HTML          ${ALL.length} 페이지 (${(bytes / 1048576).toFixed(1)} MB)
  sitemap URL      ${ALL.filter(p => !p.path.endsWith('.html')).length}
  출력             ${OUT}/
  canonical 기준   ${SITE.origin}
`);
