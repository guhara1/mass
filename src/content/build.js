/* ===========================================================
 *  지역 페이지 본문 조립기
 *  - 섹션 순서 / 제목 / 문장 조합을 시드 기반으로 뽑아
 *    행정구·행정동마다 서로 다른 1,500자 이상 본문을 만든다.
 * =========================================================== */
import { rng, variantPicker } from '../lib/rng.js';
import { SECTIONS, FAQ_POOL } from './pools.js';
import { SITE } from '../data/site.js';

const MIN_CHARS = 1500;

/* 운영시간 분포 → "11:00 ~ 익일 04:00" 형태의 대표 범위 */
function openSpanOf(shops) {
  if (!shops.length) return '11:00 ~ 익일 02:00';
  const starts = shops.map(s => (s.open.match(/^(\d{1,2}:\d{2})/) || [, '11:00'])[1]);
  const ends = shops.map(s => (s.open.match(/~\s*(.+)$/) || [, '24:00'])[1].trim());
  const earliest = starts.slice().sort()[0];
  const score = e => (/익일\s*0?5/.test(e) ? 5 : /익일\s*0?4/.test(e) ? 4 : /익일\s*0?3/.test(e) ? 3 : /익일\s*0?2/.test(e) ? 2 : /24시간/.test(e) ? 6 : 1);
  const latest = ends.slice().sort((a, b) => score(b) - score(a))[0];
  return `${earliest} ~ ${latest}`;
}

/* 업종 분포 상위 N */
function topKinds(shops, n = 4) {
  const m = new Map();
  for (const s of shops) m.set(s.kind, (m.get(s.kind) || 0) + 1);
  return [...m.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'ko')).slice(0, n).map(e => e[0]);
}

export function makeCtx({ region, district, dong, shops }) {
  const isDong = !!dong;
  const short = district.short || district.name;
  const area = isDong ? `${short} ${dong.name}` : district.name;
  const prices = shops.flatMap(s => s.courses.map(c => c.price));
  return {
    isDong,
    area,
    fullArea: isDong ? `${region.full} ${district.name} ${dong.name}` : `${region.full} ${district.name}`,
    regionName: region.name,
    regionFull: region.full,
    districtName: district.name,
    districtShort: short,
    dongName: dong ? dong.name : '',
    dongCount: district.dongs.length,
    station: dong ? dong.station : (district.hubs[0] || ''),
    mark: dong ? dong.mark : (district.marks[0] || ''),
    trait: dong ? dong.trait : '',
    zone: district.zone,
    zoneShort: String(district.zone || ''),   /* '...권역' 형태를 그대로 사용 (조사 결합이 자연스럽다) */
    lines: district.lines,
    hubs: district.hubs,
    marks: district.marks,
    near: district.near,
    night: district.night,
    road: district.road,
    roadShort: String(district.road || '').replace(/\.$/, ''),
    shopCount: shops.length,
    kinds: topKinds(shops),
    priceMin: prices.length ? Math.min(...prices) : 60000,
    priceMax: prices.length ? Math.max(...prices) : 160000,
    openSpan: openSpanOf(shops),
    tel: SITE.tel
  };
}

const textLen = s => String(s).replace(/\s+/g, ' ').trim().length;

export function buildAreaContent({ seed, ctx }) {
  const r = rng('content:' + seed);
  const pick = variantPicker('contentv:' + seed);

  /* 섹션 순서: overview 먼저, first 마지막, 나머지는 섞는다 */
  const head = SECTIONS.find(s => s.id === 'overview');
  const tail = SECTIONS.find(s => s.id === 'first');
  const mid = r.shuffle(SECTIONS.filter(s => s.id !== 'overview' && s.id !== 'first'));
  const order = [head, ...mid, tail];

  /* 섹션별 문장 선택 — 기본 4문장, 부족하면 라운드로빈으로 증량 */
  const chosen = order.map(sec => {
    const idxOrder = rng('sec:' + seed + sec.id).shuffle(sec.lines.map((_, i) => i));
    return { sec, idxOrder, take: 4 };
  });

  const render = () => chosen.map(({ sec, idxOrder, take }) => {
    const title = pick(sec.titles, 'title:' + sec.id)(ctx);
    const sents = idxOrder.slice(0, take).map(i => sec.lines[i](ctx));
    const paras = [];
    for (let i = 0; i < sents.length; i += 2) paras.push(sents.slice(i, i + 2).join(' '));
    return { id: sec.id, title, paras, text: sents.join(' ') };
  });

  let out = render();
  let guard = 0;
  while (out.reduce((a, s) => a + textLen(s.text) + textLen(s.title), 0) < MIN_CHARS + 60 && guard < 40) {
    const c = chosen[guard % chosen.length];
    if (c.take < c.idxOrder.length) c.take += 1;
    out = render();
    guard++;
  }

  /* FAQ — 12개 중 5개 */
  const faqIdx = rng('faq:' + seed).shuffle(FAQ_POOL.map((_, i) => i)).slice(0, 5);
  const faq = faqIdx.map(i => FAQ_POOL[i](ctx));

  const chars = out.reduce((a, s) => a + textLen(s.text) + textLen(s.title), 0);

  /* AEO: 답변 요약(즉답) 블록 */
  const answer = `${ctx.area}에서는 ${ctx.kinds.slice(0, 3).join(', ')} 등 ${ctx.shopCount}곳의 코스·요금·운영시간을 비교할 수 있습니다. 요금대는 ${ctx.priceMin.toLocaleString('ko-KR')}~${ctx.priceMax.toLocaleString('ko-KR')}원, 운영은 ${ctx.openSpan} 범위이며, 출장 마사지와 홈타이는 ${ctx.tel} 로 함께 접수됩니다.`;

  return { sections: out, faq, chars, answer };
}
