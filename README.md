# 서울·경기·인천 마사지 로드샵 지역 디렉터리

행정구 **70곳** · 대표 행정동 **210곳** · 로드샵 **523곳** = 총 **815 페이지**를
의존성 없이(Node 내장 모듈만) 정적 생성하는 사이트입니다. Netlify 배포 기준으로 구성돼 있습니다.

```
npm run build     # dist/ 생성 (약 1.3초)
npm run dev       # 빌드 후 http://localhost:4321 미리보기
npm run audit     # 1,500자·키워드·중복·링크·구조화데이터 전수 검사
```

---

## 1. Netlify 연결

1. Netlify → **Add new site → Import an existing project** → 이 깃 저장소 선택
2. Build command / Publish directory 는 `netlify.toml` 에서 자동 적용됩니다
   (`npm run build` → `dist`)
3. 도메인을 연결한 뒤 **Site configuration → Environment variables** 에 추가:

| 키 | 값 | 효과 |
|---|---|---|
| `SITE_URL` | `https://내도메인.com` | canonical · sitemap · JSON-LD 절대경로 전부 교체 |
| `NAVER_VERIFY` | 서치어드바이저 메타값 | `<meta name="naver-site-verification">` 자동 출력 |
| `GOOGLE_VERIFY` | 서치콘솔 메타값 | `<meta name="google-site-verification">` 자동 출력 |

> `SITE_URL` 을 넣지 않으면 `https://mass24.netlify.app` 가 기본값으로 쓰입니다.
> **자체 도메인을 연결하면 반드시 이 값을 바꾸세요.** canonical 이 틀리면 색인이 꼬입니다.

배포 후 제출할 것: `/sitemap.xml`, `/rss.xml` (네이버 서치어드바이저는 RSS 제출 시 수집이 빨라집니다)

---

## 2. 상호·도메인·전화번호 바꾸기

전부 **`src/data/site.js` 한 파일**에 있습니다.

```js
brand:   '출장 휴라인',    // 상호 — 로고 SVG·전 페이지 타이틀·푸터 자동 반영
brandEn: 'HUELINE',       // 로고 하단 레터링
tel:     '050-8202-4749', // 표기용
telRaw:  '05082024749',   // tel: 링크용
origin:  'https://mass24.netlify.app'   // SITE_URL 환경변수가 있으면 그 값이 우선
```

로고는 이미지가 아니라 **텍스트 SVG**(`src/lib/svg.js` → `logoSvg`)이고
뷰박스 폭을 상호 글자 수에 맞춰 계산하므로, 상호가 길어져도 잘리지 않습니다.

### 코스 요금

전 업소가 동일한 요금표를 씁니다. `src/data/shops.js` 의 `COURSE_PRICE` 만 고치면
요금표·카드 가격·JSON-LD `Offer`·본문 요금 문장·FAQ·코스 안내 페이지까지 전부 따라옵니다.

```js
export const COURSE_PRICE = [
  { min: 60,  price: 120000 },
  { min: 90,  price: 150000 },
  { min: 120, price: 180000 }
];
```

---

## 3. 가상 업소 → 실제 업소로 교체

현재 523곳은 **실입점 전 샘플**이며, 그 사실이 푸터·각 지역 페이지·`/policy/` 에 명시돼 있습니다.
(별점·후기처럼 조작 소지가 있는 지표는 의도적으로 넣지 않았습니다.)

실입점 업소를 넣으려면 `src/data/shops.js` 의 `ALL_SHOPS` 를
아래 형태의 배열로 바꾸면 나머지는 전부 자동 생성됩니다.

```js
{
  id, code, name, slug, path,          // path = `${dongPath}${slug}/`
  dong, district, region,              // regions.js 객체 참조
  areaLabel, station, mark,
  kind, kindTags, style, styleDesc, open, guests,
  courses: [{ name, min, price }],
  facilities: [], tags: [],
  desc,                                // ★ "출장 마사지" + "홈타이" 필수 포함
  intro, policy: [], notes: [],
  minPrice, maxPrice, visit, tel, telRaw
}
```

교체가 끝나면 `src/templates/pages.js` 의 `SAMPLE_NOTE` 와
`src/templates/static.js` 의 정책 2항 문구를 제거하세요.

---

## 4. 지역 추가 / 수정

`src/data/seoul.js` · `gyeonggi.js` · `incheon.js` 에서 `d()` 헬퍼로 선언합니다.

```js
d('강남구', [37.5173, 127.0473], {
  lines: ['2호선', '9호선'],      // 교통 축
  hubs:  ['강남역', '삼성역'],     // 기준 상권
  marks: ['코엑스', '가로수길'],   // 랜드마크
  zone:  '…권역',                 // 권역 성격 (본문에 조사와 함께 들어감)
  near:  ['서초구', '송파구'],     // 인접 지역 (내부 링크로 연결)
  night: '심야 수요 매우 높음',
  road:  '강남대로·테헤란로 축',
  dongs: [
    // [행정동명, 인접역, 랜드마크, 상권 특징]
    ['역삼동', '역삼역', '르메이에르 타운', '오피스 밀집으로 평일 저녁 예약이 몰리는 구역'],
  ]
})
```

- URL 슬러그는 `src/lib/romanize.js` 가 한글에서 자동 생성합니다 (`역삼동 → yeoksam`).
- `OO1동/2동/3동` 처럼 숫자로 나뉜 행정동은 **대표 1곳으로 통합 표기**했습니다.
- 새 지역을 추가하면 지역 페이지·업소·사이트맵·검색 인덱스가 전부 자동으로 늘어납니다.

---

## 5. 중복·유사 콘텐츠 방지 설계

이전 플랫폼과의 중복, 그리고 페이지 간 자기 복제(스팸 패널티)를 피하기 위한 구조입니다.

| 장치 | 위치 | 내용 |
|---|---|---|
| 섹션 셔플 | `src/content/build.js` | 9개 섹션의 **순서를 페이지마다 다르게** 배치 |
| 문장 풀 | `src/content/pools.js` | 섹션별 제목 6종 + 문장 12종 → 시드 기반 조합 |
| 실데이터 주입 | `makeCtx()` | 역·랜드마크·노선·상권성격·요금대·운영시간·업종분포를 문장에 직접 삽입 |
| 조사 자동화 | `src/lib/kor.js` | `역삼동는` 같은 기계적 티를 제거 (`jo()` 미경유 시 `scripts/josa-check.mjs` 가 실패) |
| 유사도 측정 | `scripts/audit.mjs` | 지역 페이지 간 12-gram Jaccard — **현재 최대 14.3%** |

본문은 행정구·행정동 페이지 기준 **순수 본문 2,800~3,100자**(요구치 1,500자의 약 2배)이며,
`npm run audit` 이 1,500자 미달 페이지를 오류로 잡습니다.

---

## 6. SEO / GEO / AEO / 네이버 C-Rank

**SEO**
- 페이지마다 고유 `title` · `description` · `canonical` (814개 전부 고유, 감사에서 검증)
- `sitemap.xml` (814 URL, 깊이별 priority), `robots.txt` (Yeti·Googlebot·Daum 명시), `rss.xml`
- 내부 링크 깊이 3 이하 — 홈 → 지역 → 행정구 → 행정동 → 로드샵 + 인접 지역 상호 링크

**GEO (지역 신호)**
- `geo.region` / `geo.placename` / `geo.position` / `ICBM` 메타
- JSON-LD `Place.geo` → `GeoCoordinates`, `areaServed` 에 행정동·행정구·인접구 명시
- 로드샵은 `HealthAndBeautyBusiness` + `PostalAddress`(시/구/동) + `makesOffer`(코스별 Offer)

**AEO (답변 최적화)**
- 모든 지역 페이지 상단 **「한눈에 보기」 즉답 블록** (요금대·운영시간·업종·전화 1문장 요약)
- `FAQPage` 구조화 데이터 — 지역 페이지 5문항, 로드샵 5문항
- `speakable` 로 `.answer p`, `h1`, FAQ 질문/답변 지정

**네이버 C-Rank 대응**
- 단일 주제 일관성(마사지 지역 정보)과 전 페이지 동일 연락처·운영주체 표기
- 운영 주체·등록 기준·최근 확인일을 푸터와 `/policy/` 에 명시 (출처 신뢰도)
- 정보 충실도: 1,500자 이상 본문 + 비교표 + 체크리스트 + FAQ
- RSS 제출 경로 제공, `dateModified` 로 최신성 신호

---

## 7. 디자인 원칙

브랜드 톤: **Warm Paper & Pine** — 이 업종에서 흔한 네온·다크퍼플을 피하고
웜 페이퍼 배경 + 딥 파인그린 + 테라코타 CTA 조합으로 차별화했습니다.

- **카드 전체 클릭.** 업소 카드는 배너(SVG)·설명·가격 어디를 눌러도 업소 페이지로 이동합니다.
  링크를 중첩하지 않고 제목 링크의 `::after` 를 카드 전체로 펼치는 방식이라
  접근성 트리에는 링크가 하나만 남고, 카드 안 전화 버튼은 `z-index` 로 분리해 그대로 동작합니다.
- **사진 0장.** 히어로 박스와 업소 썸네일은 전부 **텍스트 SVG** (`src/lib/svg.js`)
  — 12개 컬러 스킴 × 8개 패턴을 업소 ID 시드로 결정하므로 같은 업소는 항상 같은 그림
- **한글 시인성**: 본문 대비 7:1 이상, 행간 1.8, `word-break: keep-all`(어절 단위 줄바꿈),
  `text-wrap: balance/pretty`
- **터치 타겟 최소 48px**, 모든 인터랙션에 `focus-visible` 링
- 히어로는 데스크톱·모바일 **뷰박스를 따로** 내보내 타이포 크기를 화면별로 적정 유지
- 라이트/다크 자동 전환 + 수동 토글(localStorage 기억)

**모바일 전화 연결 (요청 사항)**
- **로드샵 상세**: 화면 하단 고정 바 — `출장마사지 전화연결` + `050-8202-4749`
  (58px 높이, `safe-area-inset` 반영, 터치 시 스케일 피드백)
- **그 외 페이지**: 우하단 플로팅 `출장마사지 전화` 버튼
- 헤더에도 상시 전화 버튼 (좁은 화면에서는 번호 대신 아이콘+「전화」로 축약해 레이아웃 보호)
- 로드샵 **디스크립션에는 「출장 마사지」·「홈타이」가 523곳 전부 포함** (감사에서 강제)

---

## 8. 파일 구조

```
build.mjs                 빌드 엔트리
netlify.toml              Netlify 설정 + 보안 헤더 + 캐시 정책
src/
  data/
    site.js               ★ 상호·도메인·전화번호·검증코드
    seoul.js / gyeonggi.js / incheon.js   지역 원본 데이터
    regions.js            지역 합성 + 역참조 + 경로 생성
    shops.js              가상 업소 생성기
  content/
    pools.js              섹션 제목·문장 풀
    build.js              1,500자 본문 조립
  lib/
    rng.js                시드 난수 (빌드 재현성 보장)
    svg.js                텍스트 SVG 아트 생성
    kor.js                한국어 조사 자동 선택
    romanize.js           한글 → URL 슬러그
    seo.js                head 메타 + JSON-LD
  templates/
    layout.js             헤더·푸터·고정 전화바
    parts.js              공통 컴포넌트
    pages.js              홈·지역·행정구·행정동·로드샵
    static.js             안내·정책·검색·404
  assets/                 styles.css · app.js
scripts/
  serve.mjs               로컬 미리보기
  audit.mjs               전수 감사
  josa-check.mjs          조사 처리 린트
```

---

## 9. 법적 고지

- 19세 미만 이용 불가 표기, 불법 영업·성매매 알선 무관 고지를 전 페이지 푸터에 포함
- 업소 정보가 샘플 상태라는 사실을 숨기지 않고 명시 (허위 정보 노출 방지)
