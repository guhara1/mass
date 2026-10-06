/* ===========================================================
 *  가상(샘플) 업소 데이터 생성기
 *  - 실제 업체가 아니며, 실입점 전까지 노출되는 데모 데이터입니다.
 *  - 별점/후기처럼 조작 소지가 있는 지표는 의도적으로 넣지 않고,
 *    운영시간·코스·시설 같은 객관 항목만 구성합니다.
 * =========================================================== */
import { rng, variantPicker } from '../lib/rng.js';
import { ALL_DONGS, dongPath } from './regions.js';
import { SITE } from './site.js';
import { jo } from '../lib/kor.js';

const NAME_A = ['라온', '다온', '온유', '소담', '해든', '하랑', '나래', '아린', '유담', '리안', '가온', '노을',
  '서담', '이든', '연하', '비안', '루아', '예담', '청아', '수아', '담율', '로아', '시안', '테르', '루미', '모아',
  '포레', '세라', '아리', '단하', '여울', '미르', '설아', '보라', '정음', '하율', '초아', '윤슬', '라희', '해랑',
  '소율', '단비', '아토', '네아', '유안', '봄결', '휘안', '리체', '카린', '레아', '무아', '솔담', '아셀', '티아'];
const NAME_B = ['테라피', '스웨디시', '힐링', '아로마', '바디케어', '릴렉스', '스파', '라운지', '하우스',
  '케어', '테라스', '웰니스', '터치', '살롱', '클럽', '스테이', '뷰티케어', '리추얼'];

const KINDS = [
  { k: '스웨디시', t: ['전신 오일', '림프 순환', '저자극 압'] },
  { k: '타이마사지', t: ['스트레칭', '근육 이완', '전통 수기'] },
  { k: '아로마테라피', t: ['블렌딩 오일', '수면 이완', '향 선택'] },
  { k: '딥티슈', t: ['강압 선택', '근육 뭉침', '체형 관리'] },
  { k: '건식마사지', t: ['옷 착용', '무오일', '빠른 회복'] },
  { k: '로미로미', t: ['하와이안', '리드미컬', '전신 순환'] },
  { k: '스포츠마사지', t: ['운동 후 회복', '근피로', '부위 집중'] },
  { k: '발마사지', t: ['족부 반사', '하체 부종', '단시간'] },
  { k: '바디&두피', t: ['두피 케어', '목·어깨', '사무직 집중'] }
];

const STYLES = [
  { s: '1인 전담샵', d: '관리사 한 명이 예약부터 마무리까지 전담하는 운영 방식' },
  { s: '다인 운영샵', d: '시간대별로 관리사가 배치되어 당일 예약 여유가 있는 운영 방식' },
  { s: '샵 + 출장 병행', d: '매장 방문과 출장 마사지를 함께 운영하는 방식' },
  { s: '출장 전문', d: '매장 없이 숙소·가정 방문만 운영하는 홈타이 전문 방식' },
  { s: '프라이빗 룸제', d: '예약 단위로 룸을 단독 배정하는 운영 방식' }
];

const OPENS = ['10:00 ~ 익일 02:00', '11:00 ~ 익일 04:00', '12:00 ~ 익일 05:00', '10:30 ~ 24:00',
  '13:00 ~ 익일 03:00', '24시간 예약제', '11:00 ~ 23:30', '09:00 ~ 23:00'];

const FACIL = ['주차 가능', '발렛 안내', '개인 샤워실', '파우더룸', '카드 결제', '현금영수증',
  '전액 후불', '예약 전용', '워크인 가능', '엘리베이터 이용', '1층 입구', '수건 1회용',
  '린넨 당일 교체', '정수기 비치', '무료 Wi-Fi'];

/* 이용 대상 — 시설 목록과 섞이면 모순이 생기므로 분리 */
const GUESTS = ['남녀 모두 예약', '남성 고객 중심', '여성 고객 전용', '커플 동시 예약 가능'];

/* ── 코스 · 요금 (전 업소 공통 고정) ───────────────────────
 *  60분 120,000원 / 90분 150,000원 / 120분 180,000원
 *  시간과 금액은 모든 업소가 동일하며, 코스 이름만 업소별로 달라집니다.
 *  금액 변경은 이 배열만 고치면 표·카드·JSON-LD·본문 요금 문장까지
 *  전 페이지에 자동 반영됩니다. */
export const COURSE_PRICE = [
  { min: 60,  price: 120000 },
  { min: 90,  price: 150000 },
  { min: 120, price: 180000 }
];

/* 코스 이름 세트 — [60분, 90분, 120분] */
const COURSE_NAMES = [
  ['집중 케어', '베이직 전신', '딥 리커버리'],
  ['드라이 60', '오일 전신 90', '프리미엄 120'],
  ['숏 코스', '스탠다드', '풀 케어'],
  ['목·어깨 집중', '전신 밸런스', '전신 + 두피'],
  ['베이직', '디럭스', '로얄'],
  ['부위 집중', '시그니처 전신', '야간 회복']
];

/* 업소 설명(메타 디스크립션) — 출장 마사지 / 홈타이 키워드 필수 포함 */
const DESC_T = [
  ({ n, a, k, o }) => `${a} ${jo(n, '은')} ${k} 중심의 로드샵으로 매장 방문과 출장 마사지를 함께 안내합니다. 홈타이 예약은 ${o} 사이 전화로 가능합니다.`,
  ({ n, a, k, st }) => `${a}에 위치한 ${n} 정보입니다. ${k} 코스와 ${st} 운영, 출장 마사지·홈타이 예약 절차를 한 장에 정리했습니다.`,
  ({ n, a, k, o }) => `${n}(${a})의 ${k} 코스·요금·${o} 운영시간 안내. 숙소나 가정으로 가는 출장 마사지와 홈타이도 같은 번호로 접수합니다.`,
  ({ n, a, k }) => `${a} ${k} 로드샵 ${n}. 코스별 시간과 요금, 시설, 출장 마사지 가능 범위와 홈타이 소요 시간을 확인하세요.`,
  ({ n, a, o, st }) => `${a} ${n} — ${st}. ${o} 운영이며 출장 마사지와 홈타이 모두 전화 한 통으로 예약됩니다.`,
  ({ n, a, k, o }) => `${jo(n, '은')} ${a} 기준 ${k} 전문 로드샵입니다. ${o} 운영, 출장 마사지 이동 시간과 홈타이 준비물까지 안내합니다.`,
  ({ n, a, k, st }) => `${a} ${n} 코스 안내. ${k} 기반 ${jo(st, '으로')}, 출장 마사지 요청과 홈타이 일정 조정은 상담 시 함께 처리됩니다.`,
  ({ n, a, k, o }) => `${a}에서 ${jo(k, '를')} 찾을 때 참고할 ${n} 페이지. ${o} 운영시간과 출장 마사지 범위, 홈타이 요금 기준을 정리했습니다.`
];

const INTRO_T = [
  ({ n, dn, stn, mk }) => `${jo(n, '은')} ${dn} ${stn} 생활권에 자리한 로드샵입니다. ${mk} 방면에서 접근할 때 동선이 짧아 이동 부담이 적은 위치입니다.`,
  ({ n, dn, stn }) => `${dn} 일대에서 ${jo(stn, '을')} 기준점으로 삼으면 ${n}까지 도보 이동 범위 안에서 찾을 수 있습니다.`,
  ({ n, dn, mk }) => `${mk} 주변을 이용하는 분들이 자주 함께 검색하는 곳이 ${jo(n, '이며')}, ${dn} 내에서는 비교적 찾기 쉬운 편입니다.`,
  ({ n, dn, stn }) => `${n}의 위치는 ${dn}이고, 가장 가까운 기준점은 ${stn}입니다. 첫 방문이라면 전화로 입구 안내를 받는 편이 빠릅니다.`,
  ({ n, dn, stn, mk }) => `${dn}에서 ${mk} 쪽을 기준으로 보면 ${n}까지의 동선이 단순합니다. ${stn}에서 출발하는 경우가 가장 많습니다.`,
  ({ n, dn, stn }) => `${n}의 생활권 기준점은 ${stn}입니다. ${dn} 내부 이동이라면 대부분 도보 범위에서 해결됩니다.`
];

const POLICY_T = [
  '예약 시간 변경은 방문 2시간 전까지 전화로 알려주시면 추가 비용 없이 조정됩니다.',
  '코스 변경은 시작 전까지 가능하며, 시작 후 변경은 남은 시간 기준으로 적용됩니다.',
  '방문 전 간단한 컨디션 확인을 거치며, 통증 부위가 있으면 압 세기를 미리 조절합니다.',
  '출장 마사지는 이동 거리에 따라 도착 시간이 달라지므로 예약 시 주소지를 함께 알려주세요.',
  '홈타이는 눕힐 공간과 수건만 준비되면 진행 가능하며, 매트는 관리사가 지참합니다.',
  '심야 시간대는 예약이 집중되므로 희망 시간 2~3시간 전 접수를 권장합니다.'
];

const NOTE_T = [
  '남성·여성 모두 예약 가능하며, 요청 시 동성 관리사 배정을 확인해 드립니다.',
  '임신 중이거나 최근 수술 이력이 있는 경우 압 조절이 필요하므로 상담 시 알려주세요.',
  '음주 상태에서는 순환이 과도해질 수 있어 코스 조정 또는 예약 연기를 권합니다.',
  '피부 질환·염증 부위는 오일 접촉을 피하고 해당 부위를 제외해 진행합니다.',
  '관리 직후에는 미지근한 물을 한 컵 마시고 30분 정도 안정하는 편이 좋습니다.'
];

const uniqueNames = new Set();

function makeName(r, dong) {
  for (let attempt = 0; attempt < 60; attempt++) {
    const a = r.pick(NAME_A), b = r.pick(NAME_B);
    const form = r.int(0, 5);
    const dshort = dong.name.replace(/(동|읍|면|가)$/, '');
    let n;
    if (form === 0) n = a + b;
    else if (form === 1) n = `${a} ${b}`;
    else if (form === 2) n = `${dshort} ${a}`;
    else if (form === 3) n = `${a}${b}`;
    else if (form === 4) n = `${dshort}${a}`;
    else n = `${a} ${r.pick(['스웨디시', '테라피', '바디케어', '스파'])}`;
    if (!uniqueNames.has(n)) { uniqueNames.add(n); return n; }
  }
  const fb = `${dong.name} 샵 ${uniqueNames.size}`;
  uniqueNames.add(fb);
  return fb;
}

function buildShop(dong, idx) {
  const seed = `${dong.region.slug}/${dong.district.slug}/${dong.slug}/${idx}`;
  const r = rng('shop:' + seed);
  const v = variantPicker('shopv:' + seed);

  const name = makeName(r, dong);
  const kind = r.pick(KINDS);
  const style = r.pick(STYLES);
  const open = r.pick(OPENS);
  const code = (dong.district.slug.slice(0, 2) + dong.slug.slice(0, 2)).toUpperCase() + '-' + String(r.int(1000, 9999));
  const names = r.pick(COURSE_NAMES);
  const courses = COURSE_PRICE.map((c, i) => ({ name: names[i], min: c.min, price: c.price }));
  const facilities = r.sample(FACIL, r.int(5, 7));
  const guests = r.pick(GUESTS);
  const areaLabel = `${dong.district.short || dong.district.name} ${dong.name}`;
  const tags = [kind.k, ...r.sample(kind.t, 2), '출장 마사지', '홈타이'];

  const ctx = { n: name, a: areaLabel, k: kind.k, o: open, st: style.s, dn: dong.name, mk: dong.mark, stn: dong.station };
  const desc = v(DESC_T, 'desc')(ctx);

  return {
    id: seed.replace(/\//g, '-') ,
    code,
    name,
    slug: `${dong.slug}-${code.toLowerCase()}`,
    path: `${dongPath(dong)}${dong.slug}-${code.toLowerCase()}/`,
    dong, district: dong.district, region: dong.region,
    areaLabel,
    station: dong.station,
    mark: dong.mark,
    kind: kind.k,
    kindTags: kind.t,
    style: style.s, styleDesc: style.d,
    open,
    courses,
    facilities,
    guests,
    tags,
    desc,
    intro: v(INTRO_T, 'intro')(ctx),
    policy: r.sample(POLICY_T, 3),
    notes: r.sample(NOTE_T, 2),
    minPrice: Math.min(...courses.map(c => c.price)),
    maxPrice: Math.max(...courses.map(c => c.price)),
    visit: ['샵 + 출장 병행', '출장 전문'].includes(style.s),
    tel: SITE.tel, telRaw: SITE.telRaw
  };
}

/* 행정동별 2~3곳 생성 */
export const ALL_SHOPS = ALL_DONGS.flatMap(dong => {
  const n = rng('count:' + dong.region.slug + dong.district.slug + dong.slug).int(2, 3);
  return Array.from({ length: n }, (_, i) => buildShop(dong, i + 1));
});

export const shopsByDong = new Map();
export const shopsByDistrict = new Map();
for (const s of ALL_SHOPS) {
  const dk = `${s.region.slug}/${s.district.slug}/${s.dong.slug}`;
  const gk = `${s.region.slug}/${s.district.slug}`;
  if (!shopsByDong.has(dk)) shopsByDong.set(dk, []);
  if (!shopsByDistrict.has(gk)) shopsByDistrict.set(gk, []);
  shopsByDong.get(dk).push(s);
  shopsByDistrict.get(gk).push(s);
}
