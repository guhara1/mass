/* ===========================================================
 *  IndexNow 제출 — 네이버 · 빙 · 얀덱스 · Seznam 에 한 번에 통보
 *
 *  네이버 서치어드바이저는 2023년 7월부터 IndexNow 를 지원합니다.
 *  api.indexnow.org 로 한 번 보내면 참여 검색엔진 전체로 전달됩니다.
 *  (구글은 IndexNow 를 지원하지 않습니다 — 구글은 sitemap.xml 로 처리)
 *
 *  사용법
 *    npm run indexnow              전체 URL 제출
 *    npm run indexnow -- --dry     실제 전송 없이 내용만 확인
 *    npm run indexnow -- --only=/topic/,/seoul/   접두사로 일부만
 *
 *  ※ 사이트가 실제로 배포된 뒤에 실행하세요. 아직 없는 URL 을 통보하면
 *     검증에 실패합니다.
 * =========================================================== */
import { SITE } from '../src/data/site.js';
import { REGIONS, ALL_DISTRICTS, ALL_DONGS, districtPath, dongPath } from '../src/data/regions.js';
import { ALL_SHOPS } from '../src/data/shops.js';
import { TOPICS, topicPath } from '../src/data/topics.js';
import { abs } from '../src/lib/seo.js';

const args = process.argv.slice(2);
const DRY = args.includes('--dry');
const only = (args.find(a => a.startsWith('--only=')) || '').replace('--only=', '').split(',').filter(Boolean);

const STATIC = ['/', '/areas/', '/topic/', '/guide/course/', '/guide/how-to/', '/guide/visit/', '/guide/faq/', '/policy/', '/search/'];
let paths = [
  ...STATIC,
  ...REGIONS.map(r => `/${r.slug}/`),
  ...TOPICS.map(topicPath),
  ...ALL_DISTRICTS.map(districtPath),
  ...ALL_DONGS.map(dongPath),
  ...ALL_SHOPS.map(s => s.path)
];
if (only.length) paths = paths.filter(p => only.some(pre => p.startsWith(pre)));

const host = new URL(SITE.origin).host;
const urlList = paths.map(abs);
const key = SITE.indexNowKey;
const keyLocation = abs(`/${key}.txt`);

console.log(`IndexNow 제출 준비
  호스트      ${host}
  키          ${key}
  키 위치     ${keyLocation}
  URL         ${urlList.length}건${only.length ? `  (필터: ${only.join(', ')})` : ''}
`);

if (urlList.length > 10000) {
  console.error('한 번에 보낼 수 있는 URL 은 10,000건까지입니다. --only 로 나눠 보내세요.');
  process.exit(1);
}

if (DRY) {
  console.log('--dry 모드 — 전송하지 않습니다. 앞 5건:');
  urlList.slice(0, 5).forEach(u => console.log('   ', u));
  process.exit(0);
}

/* 키 파일이 실제로 서비스되는지 먼저 확인 — 이게 404 면 제출이 모두 무시됩니다 */
try {
  const probe = await fetch(keyLocation, { redirect: 'follow' });
  const text = (await probe.text()).trim();
  if (!probe.ok || text !== key) {
    console.error(`키 파일 검증 실패 (${probe.status}). ${keyLocation} 가 "${key}" 를 그대로 돌려줘야 합니다.`);
    console.error('사이트를 먼저 배포한 뒤 다시 실행하세요.');
    process.exit(1);
  }
  console.log('키 파일 확인 완료\n');
} catch (e) {
  console.error(`키 파일에 접근할 수 없습니다: ${e.message}`);
  console.error('사이트가 배포되어 있고 SITE_URL 이 맞는지 확인하세요.');
  process.exit(1);
}

const res = await fetch('https://api.indexnow.org/indexnow', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json; charset=utf-8' },
  body: JSON.stringify({ host, key, keyLocation, urlList })
});

const body = await res.text().catch(() => '');
if (res.status === 200 || res.status === 202) {
  console.log(`제출 완료 (HTTP ${res.status}) — ${urlList.length}건
네이버·빙·얀덱스·Seznam 으로 전달됩니다. 구글은 IndexNow 를 지원하지 않으므로
서치콘솔에 sitemap.xml 을 제출하는 것으로 처리됩니다.`);
} else {
  console.error(`제출 실패 (HTTP ${res.status})`);
  console.error({ 400: '요청 형식 오류', 403: '키 검증 실패 — 키 파일을 확인하세요', 422: 'URL 이 호스트와 맞지 않음', 429: '요청이 너무 잦음' }[res.status] || body.slice(0, 200));
  process.exit(1);
}
