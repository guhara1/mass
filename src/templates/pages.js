import { SITE, PHONE_HREF } from '../data/site.js';
import { REGIONS, ALL_DISTRICTS, ALL_DONGS, districtPath, dongPath, STATS } from '../data/regions.js';
import { ALL_SHOPS, shopsByDistrict, shopsByDong } from '../data/shops.js';
import { makeCtx, buildAreaContent } from '../content/build.js';
import { rng, variantPicker } from '../lib/rng.js';
import { jo } from '../lib/kor.js';
import {
  esc, abs, clampDesc, orgNode, siteNode, breadcrumbNode, webPageNode,
  faqNode, itemListNode, shopNode
} from '../lib/seo.js';
import { layout, callBar, fab, ICON } from './layout.js';
import {
  breadcrumb, hero, heroH1, answerBox, areaTile, shopCard, proseBlock,
  faqBlock, section, stats, note, courseTable, dl, won
} from './parts.js';

const PAGES = [];
const add = (path, html) => PAGES.push({ path, html });
export const pages = () => PAGES;

const shopsOfDistrict = dd => shopsByDistrict.get(`${dd.region.slug}/${dd.slug}`) || [];
const shopsOfDong = g => shopsByDong.get(`${g.region.slug}/${g.district.slug}/${g.slug}`) || [];

/* 샘플 데이터 고지 — 전 페이지 공통 문구 (신뢰도 신호) */
const SAMPLE_NOTE = note(
  `<b>안내</b> <span>표시된 업소는 실입점 전 <strong>샘플 정보</strong>입니다. 상호·요금·운영시간은 예시이며, 실제 예약 가능 여부는 ${esc(SITE.tel)} 상담에서 확정됩니다.</span>`
);

/* ────────────────────────────────────────────────────────
 *  1) 홈
 * ──────────────────────────────────────────────────────── */
export function buildHome() {
  const path = '/';
  const featured = rng('home:featured').sample(ALL_SHOPS, 6);
  const title = `${SITE.brand} | 서울·경기·인천 마사지 로드샵 지역 안내`;
  const desc = clampDesc(`서울 ${REGIONS[0].districts.length}개 자치구, 경기 ${REGIONS[1].districts.length}개 행정구·시, 인천 ${REGIONS[2].districts.length}개 구·군의 행정동 ${STATS.dongs}곳 전체를 기준으로 마사지 로드샵 코스·요금·운영시간을 정리했습니다. 출장 마사지와 홈타이는 ${SITE.tel} 로 접수합니다.`);

  const regionCards = REGIONS.map(r => `<a class="card" href="/${r.slug}/" style="text-decoration:none">
    <div class="card__body" style="gap:8px">
      <span class="chip chip--pine">${esc(r.unit)} ${r.districts.length}곳</span>
      <span class="card__t" style="font-size:1.3rem">${esc(r.full)}</span>
      <p class="card__desc" style="-webkit-line-clamp:4">${esc(r.summary)}</p>
      <div class="card__foot"><span class="muted">행정동 ${r.districts.reduce((a, d) => a + d.dongs.length, 0)}곳</span><span style="font-weight:800;color:var(--pine)">지역 보기 →</span></div>
    </div>
  </a>`).join('');

  const body = `${hero({
    seed: 'home', scheme: 'pine', eyebrow: `${SITE.brandEn} · SEOUL / GYEONGGI / INCHEON`,
    title: SITE.claim, sub: SITE.tagline,
    lead: `행정구에서 바로 고르지 말고 행정동까지 들어가 보세요. 같은 구 안에서도 상권 성격에 따라 운영 시간과 응대 방식이 다릅니다. ${STATS.districts}개 행정구 · ${STATS.dongs}개 행정동 단위로 코스와 요금을 비교할 수 있게 정리했습니다.`,
    chips: [{ t: `행정구 ${STATS.districts}곳`, cls: 'chip--pine' }, { t: `행정동 ${STATS.dongs}곳`, cls: 'chip--gold' }, { t: '출장 마사지 · 홈타이', cls: 'chip--terra' }]
  })}

${section({ id: 'areas', title: '지역부터 선택하기', body: `<div class="grid grid--shop">${regionCards}</div>` })}

${section({
    title: '이렇게 쓰면 빠릅니다',
    body: `<div class="grid grid--2">
    ${[['1. 행정구 선택', '서울·경기·인천 중 지역을 고르고 행정구로 들어갑니다. 구 페이지에는 권역 성격과 교통 축이 정리돼 있습니다.'],
      ['2. 행정동 비교', '행정구 안의 행정동이 모두 들어 있습니다. 상권 성격이 다르니 이동 시간이 비슷하면 성격으로 고르세요.'],
      ['3. 코스·요금 확인', '업소 페이지에서 코스별 시간과 요금, 시설, 이용 대상을 확인합니다.'],
      ['4. 전화 한 통', `${SITE.tel} 로 지역과 희망 시간을 말하면 방문형과 출장 마사지·홈타이 모두 한 번에 접수됩니다.`]]
      .map(([t, d]) => `<div class="tile" style="align-items:flex-start;padding:18px"><span><span class="tile__t">${esc(t)}</span><p class="muted" style="margin-top:6px;font-size:.92rem;line-height:1.75">${esc(d)}</p></span></div>`).join('')}
  </div>
  <div class="mt">${stats([{ v: `${STATS.districts}`, l: '행정구·시' }, { v: `${STATS.dongs}`, l: '행정동 전체' }, { v: `${ALL_SHOPS.length}`, l: '정리된 로드샵' }])}</div>`
  })}

${section({ title: '최근 정리된 로드샵', more: '/areas/', moreLabel: '행정구 전체', body: `<div class="grid grid--shop">${featured.map(s => shopCard(s)).join('')}</div><div class="mt">${SAMPLE_NOTE}</div>` })}

${section({
    title: '출장 마사지와 홈타이는 어떻게 다른가',
    body: `<div class="grid grid--2">
    <div class="stack">
      <p>두 표현은 현장에서 거의 같은 의미로 쓰이지만, 결을 나누면 이렇게 정리됩니다. <strong>출장 마사지</strong>는 관리사가 고객이 지정한 장소로 이동해 진행하는 방식 전체를 가리킵니다. 숙소, 사무실, 가정 모두 포함됩니다.</p>
      <p><strong>홈타이</strong>는 그중에서도 가정 방문을 전제로 한 표현입니다. 매트를 깔 수 있는 바닥 공간과 수건만 준비되면 진행되고, 매트와 오일은 관리사가 지참합니다.</p>
      <p>어느 쪽이든 접수 번호는 같습니다. 주소지와 희망 시간을 함께 알려주면 이동 시간을 포함한 도착 예정 시각을 바로 안내받습니다.</p>
      <a class="btn btn--call" href="${PHONE_HREF}" data-loc="home-visit">${ICON.phone}출장마사지 전화연결</a>
    </div>
    ${dl([
      ['진행 장소', '숙소 · 사무실 · 가정 (출장) / 가정 중심 (홈타이)'],
      ['준비물', '바닥 공간과 수건 — 매트·오일은 관리사 지참'],
      ['예약 리드타임', '지역 내 30분 안팎, 인접 지역은 그 이상'],
      ['소요 시간', '코스 시간 + 준비·정리 15분'],
      ['결제', '현장 후불이 일반적 (선입금 요구는 권장하지 않음)'],
      ['접수', `<a href="${PHONE_HREF}" data-loc="home-dl" style="font-weight:800;color:var(--terra)">${esc(SITE.tel)}</a> · ${esc(SITE.telSubLabel)}`]
    ])}
  </div>`
  })}`;

  add(path, layout({
    active: '/', bottom: fab(),
    seo: {
      path, title, desc, ogType: 'website',
      keywords: '마사지, 출장 마사지, 홈타이, 서울 마사지, 경기 마사지, 인천 마사지, 로드샵, 스웨디시, 타이마사지',
      geo: { region: 'KR-11', pos: [37.5665, 126.9780] }, placename: '서울특별시',
      graph: [orgNode(), siteNode(),
        breadcrumbNode([{ label: '홈', href: '/' }], path),
        webPageNode({ path, title, desc, geo: [37.5665, 126.9780], placename: '서울·경기·인천' }),
        itemListNode({ path, name: '지역 목록', items: REGIONS.map(r => ({ name: r.full, path: `/${r.slug}/` })) })]
    },
    body
  }));
}

/* ────────────────────────────────────────────────────────
 *  2) 광역 지역 (서울 / 경기 / 인천)
 * ──────────────────────────────────────────────────────── */
export function buildRegion(r) {
  const path = `/${r.slug}/`;
  const dongTotal = r.districts.reduce((a, d) => a + d.dongs.length, 0);
  const shopTotal = r.districts.reduce((a, d) => a + shopsOfDistrict(d).length, 0);
  const title = `${r.name} 마사지 로드샵 — ${r.unit} ${r.districts.length}곳 지역별 안내 | ${SITE.brand}`;
  const desc = clampDesc(`${r.full} ${r.unit} ${r.districts.length}곳과 행정동 ${dongTotal}곳 전체의 마사지 로드샵 ${shopTotal}건을 정리했습니다. 코스·요금·운영시간 비교와 출장 마사지·홈타이 예약은 ${SITE.tel}.`);
  const crumbs = [{ label: '홈', href: '/' }, { label: r.full, href: path }];

  const groups = r.slug === 'gyeonggi'
    ? [['행정구가 설치된 시', r.districts.filter(d => d.city)], ['시 단위', r.districts.filter(d => !d.city)]]
    : [[`${r.unit} 전체`, r.districts]];

  const listHtml = groups.map(([label, ds]) => `<h3 style="margin:22px 0 12px;font-size:1.02rem;color:var(--ink-2)">${esc(label)} <span class="muted">(${ds.length})</span></h3>
  <div class="grid grid--area">${ds.map(d => areaTile({
      href: districtPath(d), title: d.name, seed: d.slug,
      sub: `${d.dongs.map(x => x.name.replace(/(동|읍|면)$/, '')).join(' · ')}`
    })).join('')}</div>`).join('');

  const body = `<div class="wrap">${breadcrumb(crumbs)}</div>
${heroH1({
    seed: path, eyebrow: `${r.slug.toUpperCase()} · ${r.unit.toUpperCase()}`,
    title: `${r.name} 마사지`, sub: r.headline,
    lead: r.summary,
    chips: [{ t: `${r.unit} ${r.districts.length}곳`, cls: 'chip--pine' }, { t: `행정동 ${dongTotal}곳`, cls: 'chip--gold' }, { t: `로드샵 ${shopTotal}곳`, cls: 'chip--terra' }],
    extra: `<div class="hero__cta"><a class="btn btn--call" href="${PHONE_HREF}" data-loc="region-hero">${ICON.phone}출장마사지 ${esc(SITE.tel)}</a><a class="btn btn--ghost" href="#list">${esc(r.unit)} 목록</a></div>`
  })}
${section({ id: 'list', title: `${r.name} ${r.unit} 선택`, body: listHtml })}
${section({
    title: `${r.name} 지역 로드샵 미리보기`,
    body: `<div class="grid grid--shop">${rng('region:' + r.slug).sample(r.districts.flatMap(d => shopsOfDistrict(d)), 6).map(s => shopCard(s)).join('')}</div>
  <div class="mt">${SAMPLE_NOTE}</div>`
  })}`;

  add(path, layout({
    active: path, bottom: fab(),
    seo: {
      path, title, desc,
      keywords: `${r.name} 마사지, ${r.name} 출장 마사지, ${r.name} 홈타이, ${r.full} 로드샵`,
      geo: { region: r.geoRegion, pos: r.geo }, placename: r.full,
      graph: [orgNode(), siteNode(), breadcrumbNode(crumbs, path),
        webPageNode({ path, title, desc, geo: r.geo, placename: r.full }),
        itemListNode({ path, name: `${r.full} ${r.unit} 목록`, items: r.districts.map(d => ({ name: d.name, path: districtPath(d) })) })]
    },
    body
  }));
}

/* 지역별 설명 변형 (디스크립션 중복 방지) */
const DDESC = [
  c => `${c.fullArea} 마사지 로드샵 ${c.shopCount}곳 정리. ${c.kinds.slice(0, 3).join('·')} 코스와 ${c.priceMin.toLocaleString('ko-KR')}~${c.priceMax.toLocaleString('ko-KR')}원 요금대, ${c.openSpan} 운영. 출장 마사지·홈타이 접수 ${SITE.tel}.`,
  c => `${c.area} 로드샵 비교 — ${c.station} 생활권 기준 ${c.shopCount}곳의 코스·요금·운영시간. ${c.kinds.slice(0, 2).join(', ')} 중심이며 출장 마사지와 홈타이도 같은 번호로 예약됩니다.`,
  c => `${c.area}에서 마사지를 찾을 때 보는 기준을 정리했습니다. ${c.shopCount}곳의 ${c.priceMin.toLocaleString('ko-KR')}원부터 시작하는 코스, ${c.openSpan} 운영, 출장 마사지·홈타이 안내.`,
  c => `${c.area} 마사지 안내. ${c.kinds.slice(0, 3).join(', ')} 업종 ${c.shopCount}곳, 요금대 ${c.priceMin.toLocaleString('ko-KR')}~${c.priceMax.toLocaleString('ko-KR')}원. 홈타이·출장 마사지는 ${SITE.tel} 로 접수합니다.`,
  c => `${c.station} 주변 ${c.area} 로드샵 ${c.shopCount}곳의 코스 시간과 요금, 시설, 이용 대상을 한 장에 모았습니다. 출장 마사지·홈타이 가능 범위도 함께 확인하세요.`
];

/* ────────────────────────────────────────────────────────
 *  3) 행정구
 * ──────────────────────────────────────────────────────── */
export function buildDistrict(dd) {
  const path = districtPath(dd);
  const r = dd.region;
  const shops = shopsOfDistrict(dd);
  const ctx = makeCtx({ region: r, district: dd, shops });
  const content = buildAreaContent({ seed: path, ctx });
  const v = variantPicker('ddesc:' + path);
  /* 행정구 페이지는 미리보기만 — 전체 목록은 행정동 페이지가 담당(페이지 용량·중복 관리) */
  const preview = rng('dpre:' + path).sample(shops, 9);

  const dongHead = dd.dongs.slice(0, 3).map(x => x.name.replace(/(동|읍|면)$/, '')).join('·');
  const title = `${dd.name} 마사지 — ${dongHead} 등 ${dd.dongs.length}개 동 로드샵 | ${SITE.brand}`;
  const desc = clampDesc(v(DDESC, 'd')(ctx));
  const crumbs = [{ label: '홈', href: '/' }, { label: r.full, href: `/${r.slug}/` }, { label: dd.name, href: path }];

  const dongCards = dd.dongs.map(g => {
    const gs = shopsOfDong(g);
    return `<a class="card" href="${dongPath(g)}">
      <div class="card__body" style="gap:7px">
        <span class="chip chip--pine">${esc(g.station)}</span>
        <span class="card__t">${esc(g.name)}</span>
        <p class="card__desc" style="-webkit-line-clamp:3">${esc(g.trait)}. 기준 랜드마크는 ${esc(g.mark)}입니다.</p>
        <div class="card__foot"><span class="muted">로드샵 ${gs.length}곳</span><span style="font-weight:800;color:var(--pine)">행정동 보기 →</span></div>
      </div>
    </a>`;
  }).join('');

  const nearStrip = dd.near.length ? `<div class="strip mt">${dd.near.map(n => {
    const t = ALL_DISTRICTS.find(x => x.name === n || x.name.endsWith(' ' + n) || `${x.region.name} ${x.short}` === n || x.short === n);
    return t ? `<a class="chip" href="${districtPath(t)}">${esc(n)} →</a>` : `<span class="chip">${esc(n)}</span>`;
  }).join('')}</div>` : '';

  const body = `<div class="wrap">${breadcrumb(crumbs)}</div>
${heroH1({
    seed: path, eyebrow: `${r.name.toUpperCase()} · ${dd.slug.toUpperCase()}`,
    title: `${dd.name} 마사지`, sub: `행정동 ${dd.dongs.length}곳 · 로드샵 ${shops.length}곳`,
    lead: dd.zone + '입니다. ' + (dd.hubs.length ? `${jo(dd.hubs.join(' · '), '을')} 기준점으로 삼으면 이동 동선이 단순해집니다.` : ''),
    chips: [{ t: dd.night, cls: 'chip--terra' }, ...dd.lines.slice(0, 3).map(l => ({ t: l, cls: 'chip--pine' }))],
    extra: `<div class="hero__cta"><a class="btn btn--call" href="${PHONE_HREF}" data-loc="district-hero">${ICON.phone}출장마사지 ${esc(SITE.tel)}</a><a class="btn btn--ghost" href="#dongs">행정동 선택</a></div>
    <div class="mt">${answerBox(content.answer)}</div>`
  })}

${section({ id: 'dongs', title: `${dd.name} 행정동 ${dd.dongs.length}곳`, body: `<div class="grid grid--shop">${dongCards}</div>${nearStrip ? `<h3 style="margin:26px 0 8px;font-size:1rem;color:var(--ink-2)">인접 지역</h3>${nearStrip}` : ''}` })}

${section({
    title: `${dd.name} 로드샵 미리보기`,
    more: dd.dongs.length ? dongPath(dd.dongs[0]) : null, moreLabel: '행정동별로 보기',
    body: `<div class="grid grid--shop">${preview.map(s => shopCard(s)).join('')}</div>
  ${shops.length > preview.length ? `<p class="muted mt">${dd.name} 전체 ${shops.length}곳 가운데 ${preview.length}곳만 표시했습니다. 나머지는 위의 행정동 페이지에서 확인하세요.</p>` : ''}
  <div class="mt">${SAMPLE_NOTE}</div>`
  })}

${section({ title: `${dd.name} 지역 가이드`, body: proseBlock(content) })}

${faqBlock(content.faq, `${dd.name} 마사지 자주 묻는 질문`)}`;

  add(path, layout({
    active: `/${r.slug}/`, bottom: fab(),
    seo: {
      path, title, desc,
      keywords: `${dd.name} 마사지, ${dd.name} 출장 마사지, ${dd.name} 홈타이, ${dd.dongs.slice(0, 6).map(x => x.name + ' 마사지').join(', ')}`,
      geo: { region: r.geoRegion, pos: dd.geo }, placename: `${r.full} ${dd.name}`,
      graph: [orgNode(), siteNode(), breadcrumbNode(crumbs, path),
        webPageNode({ path, title, desc, geo: dd.geo, placename: `${r.full} ${dd.name}` }),
        itemListNode({ path, name: `${dd.name} 행정동`, items: dd.dongs.map(g => ({ name: g.name, path: dongPath(g) })) }),
        faqNode(content.faq, path)]
    },
    body
  }));
}

/* ────────────────────────────────────────────────────────
 *  4) 행정동
 * ──────────────────────────────────────────────────────── */
export function buildDong(g) {
  const path = dongPath(g);
  const dd = g.district, r = g.region;
  const shops = shopsOfDong(g);
  const ctx = makeCtx({ region: r, district: dd, dong: g, shops });
  const content = buildAreaContent({ seed: path, ctx });
  const v = variantPicker('gdesc:' + path);

  const title = `${g.name} 마사지 — ${dd.short || dd.name} ${g.station} 로드샵 출장·홈타이 | ${SITE.brand}`;
  const desc = clampDesc(v(DDESC, 'g')(ctx));
  const crumbs = [{ label: '홈', href: '/' }, { label: r.full, href: `/${r.slug}/` }, { label: dd.name, href: districtPath(dd) }, { label: g.name, href: path }];

  const siblings = dd.dongs.filter(x => x.slug !== g.slug);

  const body = `<div class="wrap">${breadcrumb(crumbs)}</div>
${heroH1({
    seed: path, eyebrow: `${dd.slug.toUpperCase()} · ${g.slug.toUpperCase()}`,
    title: `${g.name} 마사지`, sub: `${dd.name} · ${g.station} 생활권`,
    lead: `${g.trait}. 기준 랜드마크는 ${g.mark}이고, 가장 가까운 기준점은 ${g.station}입니다. ${g.name} 기준으로 ${shops.length}곳의 코스·요금·운영시간을 정리했습니다.`,
    chips: [{ t: g.station, cls: 'chip--pine' }, { t: g.mark, cls: 'chip--gold' }, { t: '출장 마사지 · 홈타이', cls: 'chip--terra' }],
    extra: `<div class="hero__cta"><a class="btn btn--call" href="${PHONE_HREF}" data-loc="dong-hero">${ICON.phone}출장마사지 ${esc(SITE.tel)}</a><a class="btn btn--ghost" href="#shops">로드샵 보기</a></div>
    <div class="mt">${answerBox(content.answer)}</div>`
  })}

${section({ id: 'shops', title: `${g.name} 로드샵 ${shops.length}곳`, body: `<div class="grid grid--shop">${shops.map(s => shopCard(s, { showArea: false })).join('')}</div><div class="mt">${SAMPLE_NOTE}</div>` })}

${section({
    title: `${g.name} 한눈에 보기`,
    body: dl([
      ['행정구역', `${esc(r.full)} ${esc(dd.name)} ${esc(g.name)}`],
      ['기준점', esc(g.station)],
      ['랜드마크', esc(g.mark)],
      ['상권 성격', esc(g.trait)],
      ['교통 축', esc(dd.lines.join(' · '))],
      ['운영 시간대', esc(ctx.openSpan)],
      ['요금대', `${won(ctx.priceMin)}원 ~ ${won(ctx.priceMax)}원`],
      ['업종', esc(ctx.kinds.join(', '))],
      ['출장·홈타이', `가능 — <a href="${PHONE_HREF}" data-loc="dong-dl" style="font-weight:800;color:var(--terra)">${esc(SITE.tel)}</a>`]
    ])
  })}

${section({ title: `${g.name} 지역 가이드`, body: proseBlock(content) })}

${faqBlock(content.faq, `${g.name} 마사지 자주 묻는 질문`)}

${section({
    title: `${dd.name}의 다른 행정동`, more: districtPath(dd), moreLabel: `${dd.name} 전체`,
    body: `<div class="grid grid--area">${siblings.map(x => areaTile({ href: dongPath(x), title: x.name, seed: dd.slug + x.slug, sub: x.station })).join('')}</div>
    ${dd.near.length ? `<h3 style="margin:24px 0 8px;font-size:1rem;color:var(--ink-2)">인접 지역</h3><div class="strip">${dd.near.map(n => {
      const t = ALL_DISTRICTS.find(x => x.name === n || x.short === n || x.name.endsWith(' ' + n));
      return t ? `<a class="chip" href="${districtPath(t)}">${esc(n)} →</a>` : `<span class="chip">${esc(n)}</span>`;
    }).join('')}</div>` : ''}`
  })}`;

  add(path, layout({
    active: `/${r.slug}/`, bottom: fab(),
    seo: {
      path, title, desc,
      keywords: `${g.name} 마사지, ${g.name} 출장 마사지, ${g.name} 홈타이, ${dd.name} ${g.name}, ${g.station} 마사지`,
      geo: { region: r.geoRegion, pos: dd.geo }, placename: `${r.full} ${dd.name} ${g.name}`,
      graph: [orgNode(), siteNode(), breadcrumbNode(crumbs, path),
        webPageNode({ path, title, desc, geo: dd.geo, placename: `${r.full} ${dd.name} ${g.name}` }),
        itemListNode({ path, name: `${g.name} 로드샵`, items: shops.map(s => ({ name: s.name, path: s.path })) }),
        faqNode(content.faq, path)]
    },
    body
  }));
}

/* ────────────────────────────────────────────────────────
 *  5) 로드샵 상세
 * ──────────────────────────────────────────────────────── */
export function buildShop(s) {
  const path = s.path;
  const dd = s.district, r = s.region, g = s.dong;
  const title = `${s.name} — ${s.areaLabel} ${s.kind} | ${SITE.brand}`;
  const desc = clampDesc(s.desc);   /* 출장 마사지 / 홈타이 키워드 포함 보장 */
  const crumbs = [
    { label: '홈', href: '/' }, { label: r.full, href: `/${r.slug}/` },
    { label: dd.name, href: districtPath(dd) }, { label: g.name, href: dongPath(g) },
    { label: s.name, href: path }
  ];
  const near = (shopsOfDong(g).filter(x => x.id !== s.id).concat(
    shopsOfDistrict(dd).filter(x => x.dong.slug !== g.slug)
  )).slice(0, 3);

  const faq = [
    { q: `${s.name} 출장 마사지도 가능한가요?`, a: `${s.visit ? `${s.style} 운영이라 출장 마사지와 홈타이 모두 접수됩니다.` : `매장 방문 중심 운영이지만, 출장 마사지와 홈타이는 ${esc(dd.name)} 기준으로 함께 연결해 드립니다.`} ${SITE.tel} 로 ${g.name} 주소지와 희망 시간을 알려주시면 도착 예정 시각을 안내받습니다.` },
    { q: `${s.name} 요금은 얼마인가요?`, a: `${s.courses.map(c => `${c.name} ${c.min}분 ${won(c.price)}원`).join(', ')} 구성입니다. 표기 금액은 매장 기준이며, 출장 마사지는 이동 거리에 따른 기준이 별도로 적용될 수 있습니다.` },
    { q: `운영 시간과 마지막 예약 시간은 언제인가요?`, a: `${s.open} 운영입니다. 코스 시간이 90분 이상이면 종료 시각에서 코스 시간을 뺀 시점이 사실상 마지막 예약 시간이므로, 늦은 시간에는 미리 접수하는 편이 안전합니다.` },
    { q: `${s.name} 위치는 어디인가요?`, a: `${r.full} ${dd.name} ${g.name}, ${g.station} 생활권입니다. ${g.mark} 방면에서 접근하면 동선이 짧습니다. 건물 입구와 층수는 전화로 안내받는 편이 빠릅니다.` },
    { q: `이용 대상과 예약 방식은 어떻게 되나요?`, a: `${s.guests} 기준이며 ${s.styleDesc}입니다. 동성 관리사 배정이 필요하면 예약 단계에서 요청하세요. 시설은 ${s.facilities.slice(0, 4).join(', ')} 등이 제공됩니다.` }
  ];

  const body = `<div class="wrap">${breadcrumb(crumbs)}</div>
<section class="sec" style="padding-top:12px">
  <div class="wrap">
    <div class="shop__top">
      <div class="shop__art">${shopArtWide(s)}</div>
      <div class="shop__head">
        <div class="chips" style="margin-bottom:12px">
          <span class="chip chip--pine">${esc(s.kind)}</span>
          <span class="chip chip--gold">${esc(s.style)}</span>
          <span class="chip chip--terra">출장 마사지 · 홈타이</span>
        </div>
        <h1>${esc(s.name)}</h1>
        <p class="shop__sub">${esc(s.areaLabel)} · ${esc(s.station)} 생활권 · ${esc(s.open)}</p>
        <div class="answer"><span class="answer__k">디스크립션</span><p>${esc(s.desc)}</p></div>
        <div class="shop__cta">
          <a class="btn btn--call btn--block" href="${PHONE_HREF}" data-loc="shop-top">${ICON.phone}출장마사지 ${esc(SITE.tel)}</a>
          <a class="btn btn--ghost btn--block" href="#courses">코스·요금 보기</a>
        </div>
        <p class="muted mt-sm">${esc(SITE.telSubLabel)} · 지역명과 희망 시간만 말하면 접수됩니다.</p>
      </div>
    </div>
  </div>
</section>

${section({ title: '코스 · 요금', body: `${courseTable(s)}
  <div class="mt">${note(`<b>참고</b> <span>표기 요금은 매장 방문 기준입니다. 출장 마사지와 홈타이는 이동 거리에 따라 도착 시간과 기준이 달라질 수 있으니 예약 시 주소지를 함께 알려주세요.</span>`, 'note--pine')}</div>` })}

${section({
    title: '업소 정보', body: dl([
      ['업종', esc(s.kind) + ' · ' + esc(s.kindTags.join(', '))],
      ['운영 방식', `${esc(s.style)} — ${esc(s.styleDesc)}`],
      ['운영 시간', esc(s.open)],
      ['이용 대상', esc(s.guests)],
      ['시설', esc(s.facilities.join(' · '))],
      ['위치', `${esc(r.full)} ${esc(dd.name)} ${esc(g.name)} · ${esc(s.station)}`],
      ['요금대', `${won(s.minPrice)}원 ~ ${won(s.maxPrice)}원`],
      ['출장 마사지', s.visit ? '가능 (매장 방문 병행)' : '지역 내 연결 가능'],
      ['홈타이', '가능 — 바닥 공간과 수건만 준비'],
      ['예약', `<a href="${PHONE_HREF}" data-loc="shop-dl" style="font-weight:800;color:var(--terra)">${esc(SITE.tel)}</a>`]
    ])
  })}

${section({
    title: '위치와 이용 안내',
    body: `<div class="prose">
    <p>${esc(s.intro)}</p>
    <p>${esc(s.place)}</p>
    <h2>이용 안내</h2>
    ${s.policy.map(p => `<p>${esc(p)}</p>`).join('')}
    <h2>받기 전 알아둘 점</h2>
    ${s.notes.map(p => `<p>${esc(p)}</p>`).join('')}
  </div>
  <div class="mt">${SAMPLE_NOTE}</div>`
  })}

${faqBlock(faq, `${s.name} 자주 묻는 질문`)}

${near.length ? section({
    title: `${g.name} · ${dd.name} 주변 로드샵`, more: dongPath(g), moreLabel: `${g.name} 전체`,
    body: `<div class="grid grid--shop">${near.map(x => shopCard(x)).join('')}</div>`
  }) : ''}`;

  add(path, layout({
    active: `/${r.slug}/`, bottom: callBar(s),
    seo: {
      path, title, desc, ogType: 'article',
      keywords: `${s.name}, ${s.areaLabel} 마사지, ${s.kind}, 출장 마사지, 홈타이, ${g.station} 마사지`,
      geo: { region: r.geoRegion, pos: dd.geo }, placename: `${r.full} ${dd.name} ${g.name}`,
      graph: [orgNode(), siteNode(), breadcrumbNode(crumbs, path),
        webPageNode({ path, title, desc, geo: dd.geo, placename: `${r.full} ${dd.name} ${g.name}` }),
        shopNode(s), faqNode(faq, path)]
    },
    body
  }));
}

/* 상세용 와이드 아트 */
import { shopArt } from '../lib/svg.js';
function shopArtWide(s) { return shopArt(s, { w: 760, rounded: 0, role: 'hero' }); }
