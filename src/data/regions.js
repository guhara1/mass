import { SEOUL_DISTRICTS } from './seoul.js';
import { GYEONGGI_DISTRICTS } from './gyeonggi.js';
import { INCHEON_DISTRICTS } from './incheon.js';

export const REGIONS = [
  {
    slug: 'seoul', name: '서울', full: '서울특별시', unit: '자치구',
    geo: [37.5665, 126.9780], geoRegion: 'KR-11',
    headline: '서울 25개 자치구 전역',
    summary: '지하철 노선이 촘촘해 행정동 단위로 이동 시간이 거의 차이 나지 않는 지역입니다. 같은 구 안에서도 오피스권과 주거권의 응대 성격이 다르므로, 행정동 페이지에서 상권 성격을 먼저 확인하는 편이 빠릅니다.',
    districts: SEOUL_DISTRICTS
  },
  {
    slug: 'gyeonggi', name: '경기', full: '경기도', unit: '행정구·시',
    geo: [37.4138, 127.5183], geoRegion: 'KR-41',
    headline: '경기 주요 행정구 및 시 단위',
    summary: '행정구가 설치된 수원·성남·안양·안산·고양·용인은 구 단위로, 그 밖의 대도시는 시 단위로 묶었습니다. 면적이 넓어 같은 시 안에서도 이동 시간 차이가 크므로 행정동 기준 선택을 권장합니다.',
    districts: GYEONGGI_DISTRICTS
  },
  {
    slug: 'incheon', name: '인천', full: '인천광역시', unit: '구·군',
    geo: [37.4563, 126.7052], geoRegion: 'KR-28',
    headline: '인천 8구 2군 전역',
    summary: '공항·항만·신도시가 한 도시에 공존해 체류 목적에 따라 수요 패턴이 크게 갈립니다. 원도심과 송도·청라 신도시는 운영 방식이 달라 행정동 단위 비교가 특히 중요합니다.',
    districts: INCHEON_DISTRICTS
  }
];

/* ── 역참조 연결 (district.region / dong.district / dong.region) ──── */
for (const r of REGIONS) {
  for (const dd of r.districts) {
    dd.region = r;
    for (const g of dd.dongs) { g.district = dd; g.region = r; }
  }
}

/* ── 파생 인덱스 ───────────────────────────────────────────── */
export const ALL_DISTRICTS = REGIONS.flatMap(r => r.districts);
export const ALL_DONGS = ALL_DISTRICTS.flatMap(dd => dd.dongs);

export const regionPath = r => `/${r.slug}/`;
export const districtPath = dd => `/${dd.region.slug}/${dd.slug}/`;
export const dongPath = g => `/${g.region.slug}/${g.district.slug}/${g.slug}/`;

export const STATS = {
  regions: REGIONS.length,
  districts: ALL_DISTRICTS.length,
  dongs: ALL_DONGS.length
};
