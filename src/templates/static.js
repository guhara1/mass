import { SITE, PHONE_HREF } from '../data/site.js';
import { REGIONS, ALL_DISTRICTS, districtPath, dongPath, STATS } from '../data/regions.js';
import { ALL_SHOPS } from '../data/shops.js';
import { jo } from '../lib/kor.js';
import { esc, clampDesc, orgNode, siteNode, breadcrumbNode, webPageNode, faqNode, itemListNode } from '../lib/seo.js';
import { layout, fab, ICON } from './layout.js';
import { breadcrumb, heroH1, answerBox, areaTile, section, faqBlock, note, dl, stats, won } from './parts.js';

const PAGES = [];
const add = (path, html) => PAGES.push({ path, html });
export const staticPages = () => PAGES;

const prose = html => `<div class="prose">${html}</div>`;
const H = (t) => `<h2>${esc(t)}</h2>`;
const P = (t) => `<p>${t}</p>`;

function shell({ path, title, desc, h1, eyebrow, sub, lead, chips, body, faq, keywords, crumbs }) {
  const cr = crumbs || [{ label: '홈', href: '/' }, { label: h1, href: path }];
  title = `${title} | ${SITE.brand}`;
  add(path, layout({
    active: path, bottom: fab(),
    seo: {
      path, title, desc, keywords,
      geo: { region: 'KR-11', pos: [37.5665, 126.9780] }, placename: '서울·경기·인천',
      graph: [orgNode(), siteNode(), breadcrumbNode(cr, path),
        webPageNode({ path, title, desc }),
        ...(faq ? [faqNode(faq, path)] : [])]
    },
    body: `<div class="wrap">${breadcrumb(cr)}</div>
${heroH1({ seed: path, eyebrow, title: h1, sub, lead, chips: chips || [],
      extra: `<div class="hero__cta"><a class="btn btn--call" href="${PHONE_HREF}" data-loc="guide-hero">${ICON.phone}출장마사지 ${esc(SITE.tel)}</a></div>` })}
${body}
${faq ? faqBlock(faq) : ''}`
  }));
}

/* ── 행정구 전체 목록 ──────────────────────────────────── */
export function buildAreasIndex() {
  const path = '/areas/';
  const title = `행정구·행정동 전체 목록 — 서울·경기·인천 마사지 지역 | ${SITE.brand}`;
  const desc = clampDesc(`서울 ${REGIONS[0].districts.length}개 자치구, 경기 ${REGIONS[1].districts.length}개 행정구·시, 인천 ${REGIONS[2].districts.length}개 구·군과 대표 행정동 ${STATS.dongs}곳 전체 목록. 지역을 눌러 코스·요금과 출장 마사지·홈타이 안내를 확인하세요.`);

  const body = REGIONS.map(r => section({
    id: r.slug, title: `${r.full} — ${r.unit} ${r.districts.length}곳`, more: `/${r.slug}/`,
    body: `<div class="stack">${r.districts.map(dd => `<div style="border:1px solid var(--line);border-radius:var(--radius-sm);background:var(--surface);padding:14px 16px">
      <a href="${districtPath(dd)}" style="font-weight:800;font-size:1.04rem">${esc(dd.name)}</a>
      <div class="strip mt-sm">${dd.dongs.map(g => `<a class="chip" href="${dongPath(g)}">${esc(g.name)}</a>`).join('')}</div>
    </div>`).join('')}</div>`
  })).join('');

  add(path, layout({
    active: '/areas/', bottom: fab(),
    seo: {
      path, title, desc, keywords: '서울 마사지 지역, 경기 마사지 지역, 인천 마사지 지역, 행정구, 행정동',
      geo: { region: 'KR-11', pos: [37.5665, 126.9780] }, placename: '서울·경기·인천',
      graph: [orgNode(), siteNode(),
        breadcrumbNode([{ label: '홈', href: '/' }, { label: '지역 전체', href: path }], path),
        webPageNode({ path, title, desc }),
        itemListNode({ path, name: '행정구 전체', items: ALL_DISTRICTS.map(dd => ({ name: `${dd.region.name} ${dd.name}`, path: districtPath(dd) })) })]
    },
    body: `<div class="wrap">${breadcrumb([{ label: '홈', href: '/' }, { label: '지역 전체', href: path }])}</div>
${heroH1({
      seed: path, eyebrow: 'AREA INDEX', title: '행정구 · 행정동 전체 목록',
      sub: `${STATS.districts}개 행정구 · ${STATS.dongs}개 행정동`,
      lead: '숫자로 나뉘는 행정동(1동·2동·3동)은 대표 1곳으로 묶어 표기했습니다. 행정구를 먼저 고르고, 상권 성격이 다른 대표 행정동을 비교해 보세요.',
      chips: [{ t: `행정구 ${STATS.districts}`, cls: 'chip--pine' }, { t: `행정동 ${STATS.dongs}`, cls: 'chip--gold' }, { t: `로드샵 ${ALL_SHOPS.length}`, cls: 'chip--terra' }],
      extra: `<div class="mt">${stats([{ v: String(REGIONS[0].districts.length), l: '서울 자치구' }, { v: String(REGIONS[1].districts.length), l: '경기 행정구·시' }, { v: String(REGIONS[2].districts.length), l: '인천 구·군' }])}</div>`
    })}
${body}`
  }));
}

/* ── 코스·요금 안내 ────────────────────────────────────── */
export function buildCourseGuide() {
  const path = '/guide/course/';
  const prices = ALL_SHOPS.flatMap(s => s.courses.map(c => c.price));
  const lo = Math.min(...prices), hi = Math.max(...prices);
  const mid = (ALL_SHOPS[0].courses.find(c => c.min === 90) || { price: 150000 }).price;
  const perMin = m => Math.round((ALL_SHOPS[0].courses.find(c => c.min === m) || { price: 0 }).price / m).toLocaleString('ko-KR');
  const faq = [
    { q: '처음이면 몇 분 코스가 좋나요?', a: `전신 90분(${won(mid)}원)을 기준으로 시작하는 것을 권합니다. 60분은 목·어깨처럼 부위를 좁혀야 체감이 좋고, 120분은 전신에 두피나 발 관리가 더해지는 구성이 많습니다. 한 번 받아 보면 다음 선택 기준이 분명해집니다.` },
    { q: '업소마다 요금이 다른가요?', a: `아닙니다. 60분 ${won(lo)}원, 90분 ${won(mid)}원, 120분 ${won(hi)}원으로 전 업소가 같은 요금표를 씁니다. 가격을 비교할 필요 없이 업종·운영 방식·위치·운영 시간만 보고 고르시면 됩니다.` },
    { q: '시간이 길수록 이득인가요?', a: `분당 단가로는 그렇습니다. 60분 ${perMin(60)}원, 90분 ${perMin(90)}원, 120분 ${perMin(120)}원으로 시간이 길수록 분당 단가가 내려갑니다. 다만 긴 코스는 예약 가능한 시간대가 줄어든다는 점은 함께 고려하세요.` },
    { q: '표기 요금 외에 추가 비용이 있나요?', a: '매장 방문은 표기 금액이 기준입니다. 출장 마사지는 이동 거리에 따른 기준이 별도로 붙을 수 있으므로, 예약 시 주소지를 함께 알려주면 총액을 미리 확인할 수 있습니다.' },
    { q: '코스 중간에 시간을 늘릴 수 있나요?', a: '가능한 경우가 많지만 다음 예약 상황에 따라 달라집니다. 연장은 남은 시간 기준으로 정산되는 구조가 일반적이므로, 시작 전에 미리 의사를 밝히는 편이 확실합니다.' },
    { q: '결제는 어떻게 하나요?', a: '현금과 카드가 모두 쓰이고 현장 후불이 일반적입니다. 현금영수증 발행 여부는 업소마다 다르므로 영수 처리가 필요하면 예약 단계에서 확인하세요. 과도한 선입금 요구는 권장하지 않습니다.' }
  ];
  shell({
    path, eyebrow: 'COURSE & PRICE', h1: '코스 · 요금 안내',
    title: '마사지 코스·요금 기준 정리 | 시간별 선택 가이드',
    desc: clampDesc(`마사지 코스 요금은 60분 ${won(lo)}원, 90분 ${won(mid)}원, 120분 ${won(hi)}원으로 전 업소 동일합니다. 시간별 구성과 분당 단가, 출장 마사지·홈타이 요금 기준을 정리했습니다.`),
    keywords: '마사지 요금, 마사지 코스, 스웨디시 가격, 출장 마사지 요금, 홈타이 요금',
    sub: `60분 ${won(lo)}원 · 90분 ${won(mid)}원 · 120분 ${won(hi)}원`,
    lead: '전 업소가 같은 요금표를 씁니다. 가격을 비교할 필요가 없으니, 목적에 맞는 시간 배분만 정하면 됩니다. 부위 집중과 전신 이완은 필요한 시간이 다릅니다.',
    chips: [{ t: `60분 ${won(lo)}원`, cls: 'chip--pine' }, { t: `90분 ${won(mid)}원`, cls: 'chip--gold' }, { t: `120분 ${won(hi)}원`, cls: 'chip--terra' }],
    faq,
    body: `${section({ body: answerBox(`코스는 60분 ${won(lo)}원, 90분 ${won(mid)}원, 120분 ${won(hi)}원 세 가지이며 서울·경기·인천 전 업소가 동일한 요금표를 씁니다. 분당 단가는 각각 ${perMin(60)}원 · ${perMin(90)}원 · ${perMin(120)}원으로 시간이 길수록 내려갑니다. 출장 마사지와 홈타이는 ${SITE.tel} 로 접수하며 이동 거리 기준이 별도로 적용될 수 있습니다.`) })}
${section({
      title: '코스별 요금표', body: `<div class="tbl-wrap"><table class="tbl">
    <caption class="sr">코스 시간별 요금과 권장 상황</caption>
    <thead><tr><th scope="col">시간</th><th scope="col" style="text-align:right">요금</th><th scope="col" style="text-align:right">분당</th><th scope="col">구성 · 이럴 때</th></tr></thead>
    <tbody>
      <tr><th scope="row">60분</th><td class="num">${won(lo)}원</td><td class="num">${perMin(60)}원</td><td>목·어깨 또는 발 등 부위 집중 — 특정 부위만 뭉쳤을 때</td></tr>
      <tr><th scope="row">90분</th><td class="num">${won(mid)}원</td><td class="num">${perMin(90)}원</td><td>전신 + 취약 부위 추가 배분 — 가장 많이 선택되는 기준 코스</td></tr>
      <tr><th scope="row">120분</th><td class="num">${won(hi)}원</td><td class="num">${perMin(120)}원</td><td>전신 + 두피 또는 발 관리 — 누적 피로가 클 때</td></tr>
    </tbody></table></div>
  <div class="mt">${note(`<b>전 업소 동일 요금</b> <span>서울·경기·인천 어느 지역, 어느 업소를 고르셔도 위 요금표가 그대로 적용됩니다. 지역이나 업종에 따른 가격 차이가 없으므로 위치와 운영 시간만 보고 선택하시면 됩니다.</span>`)}</div>
  <div class="mt">${note(`<b>마지막 예약 시간</b> <span>코스 시간이 90분 이상이면, 운영 종료 시각에서 코스 시간을 뺀 값이 사실상 마지막 예약 시간입니다. 늦은 시간에는 이 계산을 먼저 해보세요.</span>`, 'note--pine')}</div>`
    })}
${section({
      title: '업종별 차이', body: prose(`
    ${P('같은 90분이라도 업종에 따라 체감이 전혀 다릅니다. 목적을 먼저 정하면 선택이 단순해집니다.')}
    ${H('오일 계열 — 스웨디시 · 아로마테라피 · 로미로미')}
    ${P('오일을 사용해 전신을 고르게 풀어주는 방식입니다. 압이 과하지 않아 처음 이용하는 분에게 무리가 적고, 이완과 수면 개선이 목적일 때 적합합니다. 아로마테라피는 향을 통한 이완이 더해지고, 로미로미는 리드미컬한 동작으로 순환에 초점을 둡니다.')}
    ${H('강압 계열 — 딥티슈 · 스포츠마사지')}
    ${P('깊은 층의 근육을 겨냥하므로 압이 셉니다. 특정 부위가 단단하게 뭉친 경우나 운동 후 회복에 효과적이지만, 다음 날 근육통이 올 수 있습니다. 부위를 한정하면 60분으로도 충분한 경우가 있습니다.')}
    ${H('수기 계열 — 타이마사지 · 건식마사지')}
    ${P('타이마사지는 스트레칭 동작이 포함되어 가동 범위를 넓히는 데 초점이 있습니다. 앉아 일하는 시간이 긴 경우 체감이 분명합니다. 건식마사지는 옷을 입은 상태로 진행되어 준비가 간단하고, 샤워가 어려운 상황에 적합합니다.')}
    ${H('압 조절이 가장 중요합니다')}
    ${P('어떤 업종이든 시작 후 5~10분 사이에 세기를 한 번 조정하는 것이 일반적인 흐름입니다. 참으면서 받는 것보다 그때 말하는 쪽이 결과가 좋습니다.')}
  `)
    })}`
  });
}

/* ── 이용 방법 ─────────────────────────────────────────── */
export function buildHowTo() {
  const path = '/guide/how-to/';
  const faq = [
    { q: '예약은 어떻게 하나요?', a: `${SITE.tel} 로 전화해 지역(행정구 또는 행정동), 희망 시간, 원하는 코스 길이를 말하면 가능한 후보를 바로 안내받습니다. 통화는 보통 2~3분 안에 끝납니다.` },
    { q: '당일 예약이 되나요?', a: '잔여 슬롯이 있으면 당일도 가능합니다. 다만 평일 저녁 7~10시는 예약이 몰리는 구간이므로, 이 시간대를 원한다면 몇 시간 전에 접수하는 쪽이 확실합니다.' },
    { q: '예약 시간을 바꿀 수 있나요?', a: '방문 2시간 전까지 전화로 알려주시면 대체로 추가 비용 없이 조정됩니다. 코스 변경은 시작 전까지 가능하고, 시작 후에는 남은 시간 기준으로 적용됩니다.' },
    { q: '동성 관리사로 배정받을 수 있나요?', a: '예약 단계에서 요청하면 배정 가능 여부를 확인해 드립니다. 당일 현장 요청은 배정이 어려울 수 있으므로 통화에서 미리 말해 두는 것이 좋습니다.' },
    { q: '받기 전에 알려야 할 건강 상태가 있나요?', a: '최근 수술 이력, 염증이나 피부 질환, 임신 여부는 압과 부위 조정에 직접 영향을 줍니다. 음주 상태에서는 순환이 과도해질 수 있어 코스 조정이나 연기를 권합니다.' }
  ];
  shell({
    path, eyebrow: 'HOW TO', h1: '이용 방법',
    title: '마사지 예약 방법 | 전화 상담부터 관리 마무리까지',
    desc: clampDesc('지역 선택부터 전화 상담, 도착, 압 조절, 마무리까지 이용 흐름을 단계별로 정리했습니다. 출장 마사지와 홈타이 접수 절차, 예약 변경 기준도 함께 안내합니다.'),
    keywords: '마사지 예약 방법, 마사지 이용 방법, 출장 마사지 예약, 홈타이 예약',
    sub: '지역 선택 → 전화 상담 → 방문 또는 출장',
    lead: '복잡한 가입이나 앱 설치가 없습니다. 지역과 희망 시간만 정해두면 전화 한 통으로 끝납니다.',
    chips: [{ t: '가입 불필요', cls: 'chip--pine' }, { t: '현장 후불', cls: 'chip--gold' }, { t: '24시 상담', cls: 'chip--terra' }],
    faq,
    body: `${section({ body: answerBox(`이용 순서는 ① 행정구·행정동 선택 ② 업소 페이지에서 코스·요금 확인 ③ ${SITE.tel} 로 전화해 지역·시간·코스 전달 ④ 방문 또는 출장 진행입니다. 상담에서는 코스 길이, 업종, 압의 세기, 결제 방식 네 가지를 확인하며 통화는 2~3분 안에 끝납니다.`) })}
${section({
      title: '단계별 흐름', body: `<div class="stack">${[
        ['1단계 · 지역 선택', '행정구에서 바로 고르지 말고 대표 행정동까지 들어가 보세요. 같은 구 안에서도 오피스권과 주거권의 운영 시간과 응대 성격이 다릅니다.'],
        ['2단계 · 조건 비교', '업소 페이지에서 코스별 시간과 요금, 운영 시간, 시설, 이용 대상을 확인합니다. 운영 시간과 마지막 예약 시간만 알아도 후보가 절반으로 줄어듭니다.'],
        ['3단계 · 전화 상담', `${SITE.tel} 로 연결해 지역, 희망 시간, 코스 길이를 말합니다. 방문형과 출장 중 어느 쪽인지 먼저 정해두면 상담이 훨씬 빠릅니다.`],
        ['4단계 · 도착 · 준비', '방문형은 건물명과 층수를 미리 받아두면 헤매지 않습니다. 출장이라면 주소지와 입구 안내가 필요하고, 홈타이는 바닥 공간과 수건만 준비하면 됩니다.'],
        ['5단계 · 관리 진행', '간단한 컨디션 확인을 거친 뒤 시작합니다. 불편한 부위를 미리 말하면 시간 배분이 달라지고, 압 조절 요청은 진행 중에도 언제든 가능합니다.'],
        ['6단계 · 마무리', '미지근한 물을 한 컵 마시고 30분 정도 안정하는 것을 권합니다. 바로 격한 활동을 하면 피로가 다시 올라옵니다.']
      ].map(([t, d]) => `<div style="display:flex;gap:14px;border:1px solid var(--line);background:var(--surface);border-radius:var(--radius-sm);padding:16px 18px">
        <div><div class="tile__t">${esc(t)}</div><p class="muted" style="margin-top:6px;font-size:.94rem;line-height:1.78">${esc(d)}</p></div>
      </div>`).join('')}</div>`
    })}
${section({
      title: '상담에서 물어볼 것', body: dl([
        ['운영 시간', '마지막 예약 시간까지 함께 확인'],
        ['업종', '오일 계열 / 강압 계열 / 수기 계열'],
        ['압의 세기', '강압·중압·약압 중 선호 전달'],
        ['요금 구성', '추가 항목 여부, 출장 시 이동 기준'],
        ['시설', '샤워실, 주차, 수건 교체 방식'],
        ['이용 대상', '성별 기준과 동성 관리사 배정 가능 여부'],
        ['결제', '카드 가능 여부, 현금영수증 발행']
      ])
    })}`
  });
}

/* ── 출장 마사지 · 홈타이 ──────────────────────────────── */
export function buildVisitGuide() {
  const path = '/guide/visit/';
  const faq = [
    { q: '출장 마사지와 홈타이는 다른가요?', a: '현장에서는 거의 같은 의미로 쓰입니다. 구분하면 출장 마사지는 숙소·사무실·가정을 모두 포함하는 방문 방식 전체이고, 홈타이는 그중 가정 방문을 전제로 한 표현입니다. 접수 번호는 같습니다.' },
    { q: '무엇을 준비해야 하나요?', a: '매트를 깔 수 있는 바닥 공간과 수건만 있으면 됩니다. 매트와 오일은 관리사가 지참합니다. 침대보다 바닥에 공간이 확보된 쪽이 압을 주기에 안정적입니다.' },
    { q: '도착까지 얼마나 걸리나요?', a: '같은 행정구 안이면 보통 30분 안팎이고, 인접 지역은 그보다 더 걸립니다. 교통 상황에 따라 달라지므로 예약 시 주소지를 알려주면 도착 예정 시각을 바로 안내받습니다.' },
    { q: '숙소에서도 받을 수 있나요?', a: '가능합니다. 객실 호수와 입구 안내가 필요하고, 프런트 경유가 필요한 건물이면 미리 말해 두는 편이 매끄럽습니다.' },
    { q: '결제는 언제 하나요?', a: '현장 후불이 일반적입니다. 선입금을 요구하는 방식은 분쟁 소지가 있으므로 후불 가능 여부를 먼저 확인하는 쪽을 권합니다.' },
    { q: '가족이나 반려동물이 있어도 되나요?', a: '진행은 가능하지만 조용한 환경과 분리된 공간이 필요합니다. 사전에 알려주면 오일 사용 여부까지 함께 조정할 수 있습니다.' }
  ];
  shell({
    path, eyebrow: 'HOME VISIT', h1: '출장 마사지 · 홈타이',
    title: '출장 마사지와 홈타이 이용 안내 | 준비물·소요 시간·예약',
    desc: clampDesc(`출장 마사지와 홈타이의 차이, 준비물, 도착 소요 시간, 결제 방식을 정리했습니다. 서울·경기·인천 ${STATS.districts}개 행정구 기준으로 ${SITE.tel} 에서 함께 접수합니다.`),
    keywords: '출장 마사지, 홈타이, 출장 마사지 준비물, 홈타이 예약, 숙소 마사지',
    sub: '바닥 공간과 수건만 준비하면 됩니다',
    lead: '매장 방문이 어려운 상황 — 늦은 귀가, 육아 중, 숙소 체류 — 에서 현실적인 선택이 됩니다. 이동 부담이 없다는 점이 가장 큰 차이입니다.',
    chips: [{ t: '매트·오일 지참', cls: 'chip--pine' }, { t: '현장 후불', cls: 'chip--gold' }, { t: `${STATS.districts}개 행정구`, cls: 'chip--terra' }],
    faq,
    body: `${section({ body: answerBox(`출장 마사지는 관리사가 지정 장소로 이동해 진행하는 방식이고, 홈타이는 그중 가정 방문을 전제로 한 표현입니다. 준비물은 매트를 깔 수 있는 바닥 공간과 수건뿐이며 매트·오일은 관리사가 지참합니다. 같은 행정구 안이면 도착까지 보통 30분 안팎, 접수는 ${SITE.tel} 입니다.`) })}
${section({
      title: '차이와 공통점', body: `<div class="tbl-wrap"><table class="tbl">
    <caption class="sr">출장 마사지와 홈타이 비교</caption>
    <thead><tr><th scope="col">항목</th><th scope="col">출장 마사지</th><th scope="col">홈타이</th></tr></thead>
    <tbody>
      <tr><th scope="row">진행 장소</th><td>숙소 · 사무실 · 가정</td><td>가정 중심</td></tr>
      <tr><th scope="row">준비물</th><td colspan="2">바닥 공간과 수건 — 매트·오일은 관리사 지참</td></tr>
      <tr><th scope="row">소요 시간</th><td colspan="2">코스 시간 + 준비·정리 15분</td></tr>
      <tr><th scope="row">예약 리드타임</th><td>지역 내 30분 안팎</td><td>지역 내 30분 안팎</td></tr>
      <tr><th scope="row">결제</th><td colspan="2">현장 후불이 일반적</td></tr>
      <tr><th scope="row">접수</th><td colspan="2">${esc(SITE.tel)} — 두 방식 모두 같은 번호</td></tr>
    </tbody></table></div>`
    })}
${section({
      title: '이럴 때 유리합니다', body: prose(`
    ${H('이동 시간이 아까울 때')}
    ${P('왕복 이동에 한 시간을 쓰면 90분 코스가 실제로는 세 시간 일정이 됩니다. 출장 마사지는 이동 시간이 관리사 쪽으로 넘어가므로 전체 일정이 짧아집니다.')}
    ${H('심야나 우천일')}
    ${P('늦은 시간에는 대중교통이 끊기고 비 오는 날은 이동 자체가 부담입니다. 다만 이런 시점에는 출장 수요도 함께 늘어나 배정 가능 인원이 제한되므로, 희망 시간 2~3시간 전 접수를 권합니다.')}
    ${H('숙소에 체류 중일 때')}
    ${P('출장·여행으로 호텔이나 숙소에 있는 경우 객실에서 바로 받을 수 있습니다. 객실 호수와 입구 안내만 미리 전달하면 됩니다.')}
    ${H('육아 중이거나 집을 비우기 어려울 때')}
    ${P('집에서 진행되므로 자리를 비우지 않아도 됩니다. 다른 가족이 함께 있는 공간이라면 사전에 알려 조용한 환경을 확보하는 편이 좋습니다.')}
  `)
    })}
${section({ title: '지역별 안내', body: `<div class="grid grid--area">${REGIONS.map(r => areaTile({ href: `/${r.slug}/`, title: `${r.full}`, seed: r.slug, sub: `${r.unit} ${r.districts.length}곳` })).join('')}</div>` })}`
  });
}

/* ── 통합 FAQ ──────────────────────────────────────────── */
export function buildFaqPage() {
  const path = '/guide/faq/';
  const faq = [
    { q: '예약은 어떻게 하나요?', a: `${SITE.tel} 로 전화해 지역, 희망 시간, 코스 길이를 말하면 됩니다. 가입이나 앱 설치는 필요하지 않습니다.` },
    { q: '요금은 얼마인가요?', a: '코스 시간과 업종에 따라 다릅니다. 60분은 부위 집중, 90분은 전신 기준이며 90분 기준 분당 1,100원대 전후가 일반적인 구간입니다. 지역별 요금대는 각 행정구·행정동 페이지에 정리돼 있습니다.' },
    { q: '출장 마사지도 가능한가요?', a: `가능합니다. 서울·경기·인천 ${STATS.districts}개 행정구를 기준으로 접수하며, 주소지와 희망 시간을 알려주면 도착 예정 시각을 바로 안내받습니다. 홈타이도 같은 번호입니다.` },
    { q: '당일 예약이 되나요?', a: '잔여 슬롯이 있으면 가능합니다. 평일 저녁 7~10시와 심야는 예약이 몰리므로 몇 시간 전 접수를 권합니다.' },
    { q: '결제는 어떻게 하나요?', a: '현금과 카드가 모두 쓰이고 현장 후불이 일반적입니다. 현금영수증 발행 여부는 업소마다 다르므로 예약 시 확인하세요. 과도한 선입금 요구는 권장하지 않습니다.' },
    { q: '동성 관리사 배정이 되나요?', a: '예약 단계에서 요청하면 배정 가능 여부를 확인해 드립니다. 당일 현장 요청은 어려울 수 있습니다.' },
    { q: '건강 상태를 미리 말해야 하나요?', a: '최근 수술 이력, 염증이나 피부 질환, 임신 여부는 압과 부위 조정에 직접 영향을 줍니다. 음주 상태에서는 코스 조정이나 연기를 권합니다.' },
    { q: '예약을 취소하거나 변경하려면?', a: '방문 2시간 전까지 전화로 알려주시면 대체로 추가 비용 없이 조정됩니다. 당일 노쇼는 다음 예약에 영향을 줄 수 있습니다.' },
    { q: '사이트에 올라온 업소는 실제 업체인가요?', a: `현재 노출되는 ${ALL_SHOPS.length}곳은 실입점 전 샘플 정보입니다. 상호·요금·운영시간은 조건 비교 방식을 보여주기 위한 예시이며, 실제 입점 업소로 순차 교체됩니다.` },
    { q: '이용 연령 제한이 있나요?', a: '19세 미만은 이용할 수 없습니다. 또한 불법 영업이나 성매매 알선과 무관한 서비스이며, 해당 문의는 응대하지 않습니다.' }
  ];
  shell({
    path, eyebrow: 'FAQ', h1: '자주 묻는 질문',
    title: '자주 묻는 질문 | 마사지 예약·요금·출장 마사지·홈타이',
    desc: clampDesc('예약 방법, 요금 기준, 출장 마사지와 홈타이, 결제, 취소 규정, 이용 제한까지 자주 묻는 질문을 한 장에 정리했습니다.'),
    keywords: '마사지 FAQ, 마사지 예약 질문, 출장 마사지 질문, 홈타이 질문',
    sub: '예약 · 요금 · 출장 · 결제',
    lead: '통화 전에 한 번 훑어보면 상담이 1분 안에 끝납니다.',
    chips: [{ t: `질문 ${10}개`, cls: 'chip--pine' }],
    faq,
    body: section({ body: answerBox(`예약은 ${SITE.tel} 전화 한 통으로 끝나고, 가입은 필요하지 않습니다. 결제는 현장 후불이 일반적이며, 변경은 방문 2시간 전까지 가능합니다. 출장 마사지와 홈타이는 같은 번호에서 함께 접수합니다.`) })
  });
}

/* ── 운영 정책 ─────────────────────────────────────────── */
export function buildPolicy() {
  const path = '/policy/';
  shell({
    path, eyebrow: 'POLICY', h1: '운영 및 정보 정책',
    title: '운영 및 정보 정책 | 등록 기준과 책임 범위',
    desc: clampDesc(`${SITE.brand}의 정보 등록 기준, 샘플 데이터 표기 원칙, 책임 범위, 이용 제한 사항을 정리했습니다. 운영 주체는 ${SITE.operator.name}입니다.`),
    keywords: '운영 정책, 정보 등록 기준, 이용 제한',
    sub: `운영 주체 ${SITE.operator.name}`,
    lead: '어떤 기준으로 정보를 올리고, 무엇을 책임지지 않는지 명확히 밝힙니다.',
    chips: [{ t: `정보 확인일 ${SITE.updated}`, cls: 'chip--pine' }],
    body: section({
      body: prose(`
      ${H('1. 사이트 성격')}
      ${P(`${esc(jo(SITE.brand, '은'))} 서울·경기·인천의 행정구와 대표 행정동 단위로 마사지 로드샵 정보를 정리해 제공하는 <strong>안내 매체</strong>입니다. 직접 마사지 서비스를 제공하는 사업자가 아니며, 예약 상담을 연결하는 역할을 합니다.`)}
      ${H('2. 현재 노출 정보의 상태')}
      ${P(`현재 사이트에 노출되는 ${ALL_SHOPS.length}곳의 업소 정보는 <strong>실입점 전 샘플 데이터</strong>입니다. 상호, 코스 구성, 요금, 운영 시간은 조건을 비교하는 방식을 보여주기 위해 생성한 예시이며 실제 업체가 아닙니다. 실입점 업소로 순차 교체되며, 교체 시점에는 각 페이지의 고지 문구가 제거됩니다.`)}
      ${P('별점, 후기, 순위처럼 조작 소지가 있는 지표는 의도적으로 넣지 않았습니다. 운영 시간, 코스 시간, 요금, 시설처럼 확인 가능한 항목만 제공합니다.')}
      ${H('3. 정보 등록 기준')}
      ${P(`실입점 업소는 <strong>${esc(SITE.operator.policy)}</strong>를 기준으로 등록합니다. 전화 응답이 확인되지 않거나 표기 정보와 실제 운영이 다른 경우 노출을 중단합니다.`)}
      ${H('4. 갱신 주기')}
      ${P(`운영 변경이 확인될 때마다 해당 지역 페이지를 갱신하고, 페이지 하단에 최근 확인일을 표기합니다. 최근 전체 점검일은 ${esc(SITE.updated)}입니다. 표기 정보와 실제 운영이 다를 수 있으므로, 방문 전 전화로 재확인하는 것을 기준으로 삼습니다.`)}
      ${H('5. 책임 범위')}
      ${P('본 사이트는 정보 제공과 상담 연결까지를 범위로 합니다. 업소와 이용자 사이에 발생한 서비스 품질, 요금 분쟁, 예약 불이행에 대해서는 직접적인 책임을 지지 않습니다. 다만 표기 정보와 실제가 다르다는 제보가 접수되면 해당 정보를 수정하거나 노출을 중단합니다.')}
      ${H('6. 이용 제한')}
      ${P('19세 미만은 이용할 수 없습니다. 본 사이트는 불법 영업, 성매매 알선 및 이를 암시하는 어떤 서비스와도 무관하며, 해당 성격의 문의에는 응대하지 않습니다. 관련 문의가 확인된 업소는 즉시 노출을 중단합니다.')}
      ${H('7. 문의')}
      ${P(`정보 수정, 입점, 노출 중단 요청은 ${esc(SITE.tel)} 로 연락해 주세요. 운영 주체는 ${esc(SITE.operator.name)}(${esc(SITE.operator.role)})이며 ${SITE.operator.since}년부터 지역 정보를 정리해 왔습니다.`)}
    `)
    })
  });
}

/* ── 검색 ──────────────────────────────────────────────── */
export function buildSearch() {
  const path = '/search/';
  const title = `지역 검색 — 행정구·행정동·로드샵 찾기 | ${SITE.brand}`;
  const desc = clampDesc(`행정구, 행정동, 역 이름, 업소명으로 바로 찾을 수 있습니다. 서울·경기·인천 ${STATS.districts}개 행정구와 ${STATS.dongs}개 행정동, 로드샵 ${ALL_SHOPS.length}곳이 대상입니다.`);
  const crumbs = [{ label: '홈', href: '/' }, { label: '검색', href: path }];
  add(path, layout({
    active: path, bottom: fab(),
    seo: {
      path, title, desc, keywords: '마사지 지역 검색, 행정동 검색',
      graph: [orgNode(), siteNode(), breadcrumbNode(crumbs, path), webPageNode({ path, title, desc })]
    },
    body: `<div class="wrap">${breadcrumb(crumbs)}</div>
${heroH1({
      seed: path, eyebrow: 'SEARCH', title: '지역 검색', sub: '행정구 · 행정동 · 역 · 업소명',
      lead: '두 글자만 입력해도 결과가 나옵니다. 역 이름으로 찾으면 해당 생활권의 행정동이 먼저 나옵니다.',
      extra: `<form class="mt" role="search" onsubmit="return false" style="display:flex;gap:10px;flex-wrap:wrap">
      <label class="sr" for="q">검색어</label>
      <input id="q" name="q" type="search" placeholder="예: 역삼동, 분당, 주안역, 라온" autocomplete="off"
        style="flex:1 1 240px;min-height:52px;padding:0 18px;border-radius:14px;border:1px solid var(--line-2);background:var(--surface);color:var(--ink);font-size:1.02rem;font-family:inherit">
      <a class="btn btn--call" href="${PHONE_HREF}" data-loc="search">${ICON.phone}출장마사지 전화</a>
    </form>`
    })}
${section({ body: `<div id="result" class="grid grid--area" aria-live="polite"></div><p id="hint" class="muted mt">검색어를 입력하세요.</p>` })}
<script>
(function(){
  var input=document.getElementById('q'),out=document.getElementById('result'),hint=document.getElementById('hint'),data=null;
  function load(){ return data?Promise.resolve(data):fetch('/search-index.json').then(function(r){return r.json()}).then(function(j){data=j;return j}); }
  function render(q){
    if(q.length<2){out.innerHTML='';hint.textContent='두 글자 이상 입력하세요.';return;}
    load().then(function(idx){
      var k=q.toLowerCase();
      var hit=idx.filter(function(it){return it.k.toLowerCase().indexOf(k)>-1}).slice(0,60);
      hint.textContent=hit.length?hit.length+'건':'결과가 없습니다. 인접 지역명으로 다시 찾아보세요.';
      out.innerHTML=hit.map(function(it){
        return '<a class="tile" href="'+it.u+'"><span><span class="tile__t">'+it.t+'</span><span class="tile__s">'+it.s+'</span></span></a>';
      }).join('');
    });
  }
  var t;input.addEventListener('input',function(){clearTimeout(t);t=setTimeout(function(){render(input.value.trim())},140)});
  var p=new URLSearchParams(location.search).get('q'); if(p){input.value=p;render(p);}
})();
</script>`
  }));
}

/* ── 404 ───────────────────────────────────────────────── */
export function build404() {
  const path = '/404.html';
  add(path, layout({
    seo: {
      path: '/404.html', title: '페이지를 찾을 수 없습니다', desc: '요청한 주소의 페이지가 없습니다. 지역 목록에서 다시 찾아보세요.',
      graph: [orgNode(), siteNode()]
    },
    bottom: fab(),
    body: `${heroH1({
      seed: '404', eyebrow: '404', title: '페이지를 찾을 수 없습니다', sub: '주소가 바뀌었거나 삭제된 페이지입니다',
      lead: '아래에서 지역을 다시 선택하거나, 검색으로 행정동을 찾아보세요.',
      extra: `<div class="hero__cta"><a class="btn btn--pine" href="/areas/">지역 전체 목록</a><a class="btn btn--ghost" href="/search/">검색하기</a></div>`
    })}
${section({ title: '지역 선택', body: `<div class="grid grid--area">${REGIONS.map(r => areaTile({ href: `/${r.slug}/`, title: r.full, seed: r.slug, sub: `${r.unit} ${r.districts.length}곳` })).join('')}</div>` })}`
  }));
}
