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
import { topicPages, buildTopic, buildTopicIndex } from './src/templates/topics.js';
import { TOPICS, topicPath } from './src/data/topics.js';
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
buildTopicIndex(); TOPICS.forEach(buildTopic);

const ALL = [...pages(), ...staticPages(), ...topicPages()];

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

/* ── sitemap (색인 파일 + 섹션별 분할) ────────────────────
 *  · 한 파일에 몰아넣지 않고 섹션별로 나누면 검색엔진 도구에서
 *    어느 묶음이 색인되고 어느 묶음이 막혔는지 바로 보입니다.
 *  · lastmod 는 SITE.updated 기준 — 콘텐츠를 실제로 고친 날에만 바꾸세요.
 *    매 배포마다 오늘 날짜로 찍으면 신뢰도가 떨어집니다. */
const prio = path => {
  if (path === '/') return '1.0';
  if (/^\/(seoul|gyeonggi|incheon)\/$/.test(path)) return '0.9';
  if (path === '/topic/' || path === '/areas/') return '0.9';
  if (path.startsWith('/topic/')) return '0.8';
  if (path.startsWith('/guide/')) return '0.7';
  const depth = path.split('/').filter(Boolean).length;
  if (depth === 2) return '0.8';          // 행정구
  if (depth === 3) return '0.75';         // 행정동
  if (depth === 4) return '0.6';          // 로드샵
  return '0.5';
};
const freq = path => {
  if (path === '/' || /^\/(seoul|gyeonggi|incheon)\/$/.test(path)) return 'daily';
  const depth = path.split('/').filter(Boolean).length;
  return depth >= 4 ? 'monthly' : 'weekly';
};

const indexable = ALL.filter(p => !p.path.endsWith('.html'));
const urlTag = p =>
  `  <url><loc>${abs(p.path)}</loc><lastmod>${SITE.updated}</lastmod><changefreq>${freq(p.path)}</changefreq><priority>${prio(p.path)}</priority></url>`;

const SECTIONS = [];
const addSection = (name, list) => {
  if (!list.length) return;
  SECTIONS.push({ name, count: list.length });
  return write(`/${name}`, `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${list.map(urlTag).join('\n')}
</urlset>\n`);
};

const isTopic = p => p.path === '/topic/' || p.path.startsWith('/topic/');
const isGuide = p => p.path.startsWith('/guide/') || ['/areas/', '/policy/', '/search/'].includes(p.path);
const depthOf = p => p.path.split('/').filter(Boolean).length;
const regionOf = p => p.path.split('/').filter(Boolean)[0];

await addSection('sitemap-core.xml', indexable.filter(p => p.path === '/' || /^\/(seoul|gyeonggi|incheon)\/$/.test(p.path) || isTopic(p) || isGuide(p)));
await addSection('sitemap-districts.xml', indexable.filter(p => depthOf(p) === 2 && ['seoul', 'gyeonggi', 'incheon'].includes(regionOf(p))));
for (const r of ['seoul', 'gyeonggi', 'incheon']) {
  await addSection(`sitemap-dong-${r}.xml`, indexable.filter(p => depthOf(p) === 3 && regionOf(p) === r));
}
const shopPages = indexable.filter(p => depthOf(p) === 4);
const CHUNK = 900;
for (let i = 0; i < shopPages.length; i += CHUNK) {
  await addSection(`sitemap-shop-${Math.floor(i / CHUNK) + 1}.xml`, shopPages.slice(i, i + CHUNK));
}

await write('/sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${SECTIONS.map(x => `  <sitemap><loc>${abs('/' + x.name)}</loc><lastmod>${SITE.updated}</lastmod></sitemap>`).join('\n')}
</sitemapindex>\n`);

/* ── robots.txt ────────────────────────────────────────── */
await write('/robots.txt', `# ${SITE.brand}
# 검색로봇 전체 허용 — Crawl-delay 는 두지 않습니다.
# (네이버 Yeti 에 Crawl-delay 를 주면 수집 속도가 오히려 느려집니다)

User-agent: *
Allow: /

User-agent: Yeti
Allow: /

User-agent: NaverBot
Allow: /

User-agent: Googlebot
Allow: /

User-agent: Googlebot-Image
Allow: /

User-agent: Daum
Allow: /

User-agent: Daumoa
Allow: /

User-agent: bingbot
Allow: /

Sitemap: ${abs('/sitemap.xml')}
${SECTIONS.map(x => `Sitemap: ${abs('/' + x.name)}`).join('\n')}
`);

/* ── RSS (네이버 서치어드바이저 피드 제출용) ──────────────
 *  네이버는 사이트맵과 RSS 를 함께 제출했을 때 수집이 빠릅니다.
 *  주제 허브 + 광역/행정구 + 행정동을 섞어 사이트 구조가 드러나게 구성합니다. */
const rssItem = (title, loc, description) => `    <item>
      <title>${esc(title)}</title>
      <link>${loc}</link>
      <guid isPermaLink="true">${loc}</guid>
      <description>${esc(description)}</description>
      <pubDate>${new Date(SITE.updated).toUTCString()}</pubDate>
    </item>`;

const feed = [
  ...TOPICS.map(t => rssItem(
    `${t.name} 마사지 — ${t.tagline.split(' — ')[0]}`, abs(topicPath(t)),
    `${t.lead} 60분 120,000원 · 90분 150,000원 · 120분 180,000원, 출장 마사지·홈타이 접수 ${SITE.tel}.`)),
  ...ALL_DISTRICTS.map(dd => rssItem(
    `${dd.region.name} ${dd.name} 마사지 — 행정동 ${dd.dongs.length}곳 로드샵 안내`, abs(districtPath(dd)),
    `${dd.zone} ${dd.hubs.join(' · ')} 기준으로 코스·요금·운영시간과 출장 마사지·홈타이를 정리했습니다.`)),
  ...ALL_DONGS.slice(0, 120).map(g => rssItem(
    `${g.district.short || g.district.name} ${g.name} 마사지 — ${g.station} 생활권`, abs(dongPath(g)),
    `${g.trait} 기준 랜드마크 ${g.mark}. 코스·요금·운영시간과 출장 마사지·홈타이 안내.`))
];

await write('/rss.xml', `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom"><channel>
    <title>${esc(SITE.brand)} — 지역·주제 업데이트</title>
    <link>${abs('/')}</link>
    <atom:link href="${abs('/rss.xml')}" rel="self" type="application/rss+xml"/>
    <description>${esc(SITE.tagline)} · 행정구 ${STATS.districts}곳 · 행정동 ${STATS.dongs}곳 마사지 로드샵 정보</description>
    <language>ko</language>
    <lastBuildDate>${new Date(SITE.updated).toUTCString()}</lastBuildDate>
${feed.join('\n')}
</channel></rss>\n`);

/* ── IndexNow 키 파일 ──────────────────────────────────── */
await write(`/${SITE.indexNowKey}.txt`, SITE.indexNowKey + '\n');

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
  주제 허브        ${topicPages().length}
  안내/기타        ${staticPages().length}
  ────────────────────────────
  총 HTML          ${ALL.length} 페이지 (${(bytes / 1048576).toFixed(1)} MB)
  sitemap          ${indexable.length} URL / ${SECTIONS.length}개 파일
  RSS              ${feed.length} 항목
  IndexNow 키      /${SITE.indexNowKey}.txt
  출력             ${OUT}/
  canonical 기준   ${SITE.origin}
`);
