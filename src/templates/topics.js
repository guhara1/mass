import { SITE, PHONE_HREF } from '../data/site.js';
import { REGIONS, ALL_DISTRICTS, districtPath, dongPath, STATS } from '../data/regions.js';
import { ALL_SHOPS, COURSE_PRICE } from '../data/shops.js';
import { TOPICS, topicPath } from '../data/topics.js';
import { rng } from '../lib/rng.js';
import { jo } from '../lib/kor.js';
import {
  esc, abs, clampDesc, orgNode, siteNode, breadcrumbNode, webPageNode,
  faqNode, itemListNode, serviceNode, reserveAction
} from '../lib/seo.js';
import { layout, fab, ICON } from './layout.js';
import { breadcrumb, heroH1, answerBox, shopCard, section, faqBlock, note, won } from './parts.js';
import { linkHub, regionGroup, guideGroup, situationGroup, dongLink, popularDongs } from './links.js';

const PAGES = [];
const add = (path, html) => PAGES.push({ path, html });
export const topicPages = () => PAGES;

/* 주제에 해당하는 로드샵 */
export const shopsOfTopic = t => t.kind ? ALL_SHOPS.filter(s => s.kind === t.kind) : ALL_SHOPS.filter(t.match);

const SAMPLE_NOTE = note(
  `<b>안내</b> <span>표시된 업소는 실입점 전 <strong>샘플 정보</strong>입니다. 상호·운영시간은 예시이며, 실제 예약 가능 여부는 ${esc(SITE.tel)} 상담에서 확정됩니다.</span>`
);

/* ────────────────────────────────────────────────────────
 *  주제 상세
 * ──────────────────────────────────────────────────────── */
export function buildTopic(t) {
  const path = topicPath(t);
  const shops = shopsOfTopic(t);

  /* 행정구별 분포 */
  const byDistrict = new Map();
  for (const s of shops) {
    const k = `${s.region.slug}/${s.district.slug}`;
    byDistrict.set(k, (byDistrict.get(k) || 0) + 1);
  }
  const ranked = [...byDistrict.entries()]
    .map(([k, n]) => ({ dd: ALL_DISTRICTS.find(d => `${d.region.slug}/${d.slug}` === k), n }))
    .filter(x => x.dd).sort((a, b) => b.n - a.n || a.dd.name.localeCompare(b.dd.name, 'ko'));
  const top = ranked.slice(0, 12);
  const maxN = top.length ? top[0].n : 1;

  /* 지역별 집계 */
  const byRegion = REGIONS.map(r => ({ r, n: shops.filter(s => s.region.slug === r.slug).length }));

  const title = `${t.name} — ${t.tagline.split(' — ')[0]} | ${SITE.brand}`;
  const desc = clampDesc(`${t.lead} 서울·경기·인천 ${ranked.length}개 행정구 ${shops.length}곳 기준. 60분 ${won(COURSE_PRICE[0].price)}원·90분 ${won(COURSE_PRICE[1].price)}원·120분 ${won(COURSE_PRICE[2].price)}원이며 출장 마사지와 홈타이는 ${SITE.tel}.`);
  const crumbs = [{ label: '홈', href: '/' }, { label: '주제별 찾기', href: '/topic/' }, { label: t.name, href: path }];

  const answer = `${jo(t.name, '는')} ${t.tagline.replace(/^[^—]*—\s*/, '')}. 서울·경기·인천 ${ranked.length}개 행정구에서 ${shops.length}곳이 운영되며, 요금은 60분 ${won(COURSE_PRICE[0].price)}원 · 90분 ${won(COURSE_PRICE[1].price)}원 · 120분 ${won(COURSE_PRICE[2].price)}원으로 업종과 무관하게 동일합니다. 출장 마사지와 홈타이는 ${SITE.tel} 로 함께 접수합니다.`;

  const bodyHtml = t.body.map(([h, ps]) => `<h2>${esc(h)}</h2>\n${ps.map(p => `<p>${esc(p)}</p>`).join('\n')}`).join('\n');

  const distHtml = `<div class="dist-bar">${top.map(x =>
    `<a href="${districtPath(x.dd)}" style="--w:${Math.round(x.n / maxN * 100)}%"><span>${esc(x.dd.region.name)} ${esc(x.dd.name)}</span><b>${x.n}곳</b></a>`
  ).join('')}</div>`;

  const sampleShops = rng('topic:' + t.slug).sample(shops, 9);
  const relDongs = rng('topicdong:' + t.slug).sample(shops.map(s => s.dong), 12);
  const seenDong = new Set();
  const dongLinks = relDongs.filter(g => { const k = dongPath(g); if (seenDong.has(k)) return false; seenDong.add(k); return true; });

  const body = `<div class="wrap">${breadcrumb(crumbs)}</div>
${heroH1({
    seed: path, eyebrow: `TOPIC · ${t.slug.toUpperCase()}`,
    title: t.name, sub: t.tagline,
    lead: t.lead,
    chips: [{ t: t.group, cls: 'chip--pine' }, { t: `${ranked.length}개 행정구`, cls: 'chip--gold' }, { t: `${shops.length}곳`, cls: 'chip--terra' }],
    extra: `<div class="hero__cta"><a class="btn btn--call" href="${PHONE_HREF}" data-loc="topic-hero">${ICON.phone}출장마사지 ${esc(SITE.tel)}</a><a class="btn btn--ghost" href="#areas">지역별 보기</a></div>
    <div class="mt">${answerBox(answer)}</div>`
  })}

${section({ title: `${t.name} 안내`, body: `<div class="prose">${bodyHtml}</div>` })}

${section({
    id: 'areas', title: `${jo(t.name, '가')} 많은 지역`,
    more: '/areas/', moreLabel: '지역 전체',
    body: `<p class="muted" style="margin-bottom:14px">서울 ${byRegion[0].n}곳 · 경기 ${byRegion[1].n}곳 · 인천 ${byRegion[2].n}곳 기준으로, 행정구별 분포 상위 ${top.length}곳입니다.</p>${distHtml}`
  })}

${section({
    title: `${t.name} 로드샵`,
    body: `<div class="grid grid--shop">${sampleShops.map(s => shopCard(s)).join('')}</div>
  <p class="muted mt">전체 ${shops.length}곳 가운데 ${sampleShops.length}곳을 보여드립니다. 지역을 좁히면 더 정확한 비교가 됩니다.</p>
  <div class="mt">${SAMPLE_NOTE}</div>`
  })}

${faqBlock(t.faq, `${t.name} 자주 묻는 질문`)}

${linkHub({
    id: 'topic-links', title: '이어서 보기',
    intro: `${jo(t.name, '를')} 찾는 분들이 함께 보는 지역과 주제입니다.`,
    groups: [
      { title: `${t.name} 운영 지역`, note: '행정동 단위로 좁혀 보기', links: dongLinks.slice(0, 8).map(dongLink) },
      { title: '다른 주제', links: TOPICS.filter(x => x.slug !== t.slug).slice(0, 8).map(x => ({ label: x.name, href: topicPath(x), sub: x.group })) },
      regionGroup(),
      guideGroup()
    ]
  })}`;

  add(path, layout({
    active: '/topic/', bottom: fab(),
    seo: {
      path, title, desc, keywords: `${t.keywords}, 출장 마사지, 홈타이`,
      geo: { region: 'KR-11', pos: [37.5665, 126.9780] }, placename: '서울·경기·인천',
      graph: [orgNode(), siteNode(), breadcrumbNode(crumbs, path),
        webPageNode({ path, title, desc, type: 'CollectionPage', mainEntity: abs(path) + '#list' }),
        serviceNode({
          id: abs(path) + '#service', name: t.name, desc: t.lead,
          type: t.kind || '마사지', areaName: '서울특별시·경기도·인천광역시',
          courses: COURSE_PRICE
        }),
        reserveAction({ id: abs(path) + '#reserve', name: `${t.name} 전화 예약` }),
        itemListNode({ path, name: `${t.name} 운영 지역`, items: top.map(x => ({ name: `${x.dd.region.name} ${x.dd.name}`, path: districtPath(x.dd) })) }),
        faqNode(t.faq, path)]
    },
    body
  }));
}

/* ────────────────────────────────────────────────────────
 *  주제 색인
 * ──────────────────────────────────────────────────────── */
export function buildTopicIndex() {
  const path = '/topic/';
  const title = `주제별 찾기 — 업종 9종·상황 3종 | ${SITE.brand}`;
  const desc = clampDesc(`스웨디시·타이마사지·아로마테라피·딥티슈 등 업종 9종과 24시 운영·심야 예약·숙소 출장 등 상황 3종으로 정리했습니다. 서울·경기·인천 ${STATS.districts}개 행정구 ${ALL_SHOPS.length}곳 기준, 출장 마사지·홈타이 접수 ${SITE.tel}.`);
  const crumbs = [{ label: '홈', href: '/' }, { label: '주제별 찾기', href: path }];

  const card = t => {
    const n = shopsOfTopic(t).length;
    return `<a class="card" href="${topicPath(t)}">
      <div class="card__body" style="gap:8px">
        <span class="chip ${t.group === '업종' ? 'chip--pine' : 'chip--gold'}">${esc(t.group)}</span>
        <span class="card__t">${esc(t.name)}</span>
        <p class="card__desc" style="-webkit-line-clamp:3">${esc(t.lead)}</p>
        <div class="card__foot"><span class="muted">${n}곳</span><span style="font-weight:800;color:var(--pine)">자세히 →</span></div>
      </div>
    </a>`;
  };

  const body = `<div class="wrap">${breadcrumb(crumbs)}</div>
${heroH1({
    seed: path, eyebrow: 'TOPIC INDEX', title: '주제별 찾기', sub: '업종 9종 · 상황 3종',
    lead: '지역부터 고르는 방식이 익숙하지 않다면 목적부터 좁혀 보세요. 어떤 방식인지, 어떤 상황에 맞는지 정리해 두었고, 각 주제에서 다시 지역으로 들어갈 수 있습니다.',
    chips: [{ t: '업종 9종', cls: 'chip--pine' }, { t: '상황 3종', cls: 'chip--gold' }, { t: `${ALL_SHOPS.length}곳`, cls: 'chip--terra' }],
    extra: `<div class="mt">${answerBox(`업종은 스웨디시·타이마사지·아로마테라피·딥티슈·건식마사지·로미로미·스포츠마사지·발마사지·바디&두피 9종, 상황은 24시 운영·심야 예약·숙소 출장 3종으로 나눠 정리했습니다. 요금은 업종과 무관하게 60분 ${won(COURSE_PRICE[0].price)}원 · 90분 ${won(COURSE_PRICE[1].price)}원 · 120분 ${won(COURSE_PRICE[2].price)}원으로 동일합니다.`)}</div>`
  })}
${section({ title: '업종별', body: `<div class="grid grid--shop">${TOPICS.filter(t => t.group === '업종').map(card).join('')}</div>` })}
${section({ title: '상황별', body: `<div class="grid grid--shop">${TOPICS.filter(t => t.group === '상황').map(card).join('')}</div>` })}
${linkHub({
    id: 'topic-index-links', title: '지역으로 바로 가기',
    intro: '주제를 정했다면 지역을 좁힐 차례입니다.',
    groups: [
      regionGroup(),
      { title: '많이 찾는 행정동', links: popularDongs(8).map(dongLink) },
      situationGroup('상황별 안내'),
      guideGroup()
    ]
  })}`;

  add(path, layout({
    active: '/topic/', bottom: fab(),
    seo: {
      path, title, desc,
      keywords: '마사지 업종, 스웨디시, 타이마사지, 아로마테라피, 딥티슈, 24시 마사지, 심야 마사지, 출장 마사지, 홈타이',
      geo: { region: 'KR-11', pos: [37.5665, 126.9780] }, placename: '서울·경기·인천',
      graph: [orgNode(), siteNode(), breadcrumbNode(crumbs, path),
        webPageNode({ path, title, desc, type: 'CollectionPage', mainEntity: abs(path) + '#list' }),
        itemListNode({ path, name: '주제 목록', items: TOPICS.map(t => ({ name: t.name, path: topicPath(t) })) }),
        reserveAction({ id: abs(path) + '#reserve', name: '전화 예약' })]
    },
    body
  }));
}
