/* ===========================================================
 *  내부링크 허브 — 롱테일 주제 × 지역 교차 연결
 *  · 단순 나열이 아니라 "같은 상권 성격 / 같은 노선 / 인접 지역"처럼
 *    실제 관련성이 있는 기준으로 묶어 링크한다.
 *  · 앵커 텍스트는 목적지가 실제로 다루는 내용과 일치시킨다
 *    (과장 앵커는 스팸 신호가 되므로 쓰지 않는다)
 * =========================================================== */
import { REGIONS, ALL_DISTRICTS, ALL_DONGS, districtPath, dongPath } from '../data/regions.js';
import { shopsByDong } from '../data/shops.js';
import { TOPICS, topicPath } from '../data/topics.js';
import { rng } from '../lib/rng.js';
import { esc } from '../lib/seo.js';

/* ── 인덱스 ────────────────────────────────────────────── */
const byType = new Map();      // 상권 유형 → 동 목록
const byLine = new Map();      // 지하철 노선 → 동 목록
for (const g of ALL_DONGS) {
  if (!byType.has(g.type)) byType.set(g.type, []);
  byType.get(g.type).push(g);
  for (const line of g.district.lines) {
    if (!byLine.has(line)) byLine.set(line, []);
    byLine.get(line).push(g);
  }
}
const districtByName = new Map();
for (const dd of ALL_DISTRICTS) {
  districtByName.set(dd.name, dd);
  districtByName.set(`${dd.region.name} ${dd.short}`, dd);
  if (dd.short !== dd.name) districtByName.set(dd.short, dd);
}

export const TYPE_LABEL = {
  office: '오피스 밀집', retail: '번화가·상업', resi: '일반 주거', resiHigh: '대단지 아파트',
  resiLow: '저층 주거', univ: '대학가', market: '전통시장', redev: '재개발·정비',
  newtown: '신도시·신축', park: '공원·녹지', industry: '산업단지 배후', tourist: '관광·숙박',
  transit: '환승 결절점', admin: '행정·공공', river: '하천·강변', rural: '전원·면 단위', school: '학군'
};

/* 같은 상권 성격의 다른 행정구 동 */
export function similarDongs(g, n = 8) {
  const pool = (byType.get(g.type) || []).filter(x => x.district.slug !== g.district.slug);
  return rng('sim:' + dongPath(g)).sample(pool, n);
}

/* 같은 지하철 노선을 공유하는 다른 행정구 동 */
export function lineDongs(g, n = 8) {
  const line = g.district.lines.find(l => (byLine.get(l) || []).length > 3);
  if (!line) return { line: null, list: [] };
  const pool = (byLine.get(line) || []).filter(x => x.district.slug !== g.district.slug);
  return { line, list: rng('line:' + dongPath(g)).sample(pool, n) };
}

/* 많이 찾는 행정동 — 상업·오피스·환승 성격 위주로 가중 샘플 */
const HOT = new Set(['retail', 'office', 'transit', 'tourist', 'univ']);
export function popularDongs(n = 12, region = null) {
  const pool = ALL_DONGS.filter(g => HOT.has(g.type) && (!region || g.region.slug === region.slug));
  return rng('pop:' + (region ? region.slug : 'all')).sample(pool, n);
}

/* 인접 행정구 객체로 해석 */
export function nearDistricts(dd) {
  return dd.near.map(nm => districtByName.get(nm) || districtByName.get(nm.replace(/^(서울|경기|인천)\s*/, '')))
    .filter(Boolean);
}

/* 업종 주제 — 해당 지역에 실제 존재하는 업종을 앞으로 */
export function topicsForArea(kindsPresent = []) {
  const kindTopics = TOPICS.filter(t => t.group === '업종');
  const order = new Map(kindsPresent.map((k, i) => [k, i]));
  return kindTopics.slice().sort((a, b) =>
    (order.has(a.kind) ? order.get(a.kind) : 99) - (order.has(b.kind) ? order.get(b.kind) : 99));
}
export const situationTopics = () => TOPICS.filter(t => t.group === '상황');

/* ── UI ────────────────────────────────────────────────── */
const linkItem = l => `<li><a href="${l.href}">${esc(l.label)}${l.sub ? `<span>${esc(l.sub)}</span>` : ''}</a></li>`;

/* groups: [{ title, note?, links: [{label, href, sub?}] }] */
export function linkHub({ title, intro, groups, id = 'links' }) {
  const cols = groups.filter(g => g.links.length).map(g => `<div class="lh__col">
    <h3 class="lh__t">${esc(g.title)}</h3>
    ${g.note ? `<p class="lh__note">${esc(g.note)}</p>` : ''}
    <ul class="lh__list">${g.links.map(linkItem).join('')}</ul>
  </div>`).join('');
  if (!cols) return '';
  return `<section class="sec lh" id="${id}" aria-labelledby="${id}-h">
  <div class="wrap">
    <div class="sec__hd"><h2 id="${id}-h">${esc(title)}</h2></div>
    ${intro ? `<p class="lh__intro">${esc(intro)}</p>` : ''}
    <div class="lh__grid">${cols}</div>
  </div>
</section>`;
}

/* 자주 쓰는 링크 묶음 생성기 */
export const topicGroup = (kinds, label = '업종별로 찾기') => ({
  title: label,
  links: topicsForArea(kinds).map(t => ({ label: t.name, href: topicPath(t), sub: t.tagline.split(' — ')[0] }))
});
export const situationGroup = (label = '상황별로 찾기') => ({
  title: label,
  links: [
    ...situationTopics().map(t => ({ label: t.name, href: topicPath(t), sub: t.tagline.split(' — ')[0] })),
    { label: '출장 마사지·홈타이', href: '/guide/visit/', sub: '준비물과 소요 시간' }
  ]
});
export const guideGroup = () => ({
  title: '이용 안내',
  links: [
    { label: '코스·요금 기준', href: '/guide/course/', sub: '60·90·120분 전 업소 동일' },
    { label: '예약 방법', href: '/guide/how-to/', sub: '전화 한 통으로' },
    { label: '출장 마사지·홈타이', href: '/guide/visit/', sub: '숙소·가정 방문' },
    { label: '자주 묻는 질문', href: '/guide/faq/', sub: '요금·결제·취소' },
    { label: '주제 전체 보기', href: '/topic/', sub: '업종 9 · 상황 3' },
    { label: '지역 전체 목록', href: '/areas/', sub: '행정구 70 · 행정동 675' }
  ]
});
export const regionGroup = (exclude = null) => ({
  title: '다른 지역',
  links: REGIONS.filter(r => !exclude || r.slug !== exclude.slug)
    .map(r => ({ label: `${r.full} 마사지`, href: `/${r.slug}/`, sub: `${r.unit} ${r.districts.length}곳` }))
    .concat([{ label: '행정구·행정동 전체', href: '/areas/', sub: '전 지역 색인' }])
});

export const dongLink = g => ({ label: `${g.district.short || g.district.name} ${g.name}`, href: dongPath(g), sub: g.station });
export const districtLink = dd => ({ label: `${dd.name} 마사지`, href: districtPath(dd), sub: `행정동 ${dd.dongs.length}곳` });
export const shopCount = g => (shopsByDong.get(`${g.region.slug}/${g.district.slug}/${g.slug}`) || []).length;
