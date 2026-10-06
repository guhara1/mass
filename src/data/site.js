/* =============================================================
 *  사이트 전역 설정  —  상호 / 도메인이 확정되면 "이 파일만" 고치면 됩니다.
 *  (브랜드명은 전부 placeholder 입니다. BRAND.name 만 바꾸면 전 페이지 반영)
 * ============================================================= */

export const SITE = {
  // ---- 브랜드 (임시값) -------------------------------------------------
  brand: '휴라인',                 // ← 상호 확정 후 교체
  brandEn: 'HUELINE',              // ← 로고 SVG 하단 레터링
  tagline: '서울·경기·인천 로드샵 지역 안내',
  claim: '내 위치에서 가까운 로드샵부터',

  // ---- 도메인 ---------------------------------------------------------
  // Netlify 환경변수 SITE_URL 이 있으면 그 값이 우선합니다.
  origin: (process.env.SITE_URL || 'https://hueline-guide.netlify.app').replace(/\/+$/, ''),

  // ---- 연락처 (요청 고정값) --------------------------------------------
  tel: '050-8202-4749',
  telRaw: '05082024749',
  telLabel: '출장마사지 전화연결',
  telSubLabel: '24시 상담 · 통화료 무료',

  // ---- 검증 메타 (발급 후 값만 채우면 자동 출력) -------------------------
  verify: {
    naver: process.env.NAVER_VERIFY || '',   // 네이버 서치어드바이저
    google: process.env.GOOGLE_VERIFY || '', // 구글 서치콘솔
    bing: process.env.BING_VERIFY || ''
  },

  // ---- 운영 정보 (C-Rank 신뢰도 신호: 운영주체 명시) ---------------------
  operator: {
    name: '휴라인 편집팀',
    role: '지역 로드샵 정보 에디터',
    since: 2024,
    policy: '현장 확인 · 전화 응답 확인 후 등록'
  },

  updated: '2026-10-06',

  // ---- 공통 키워드 (로드샵 디스크립션 필수 키워드) ------------------------
  coreKeywords: ['출장 마사지', '홈타이'],

  nav: [
    { label: '서울', href: '/seoul/' },
    { label: '경기', href: '/gyeonggi/' },
    { label: '인천', href: '/incheon/' },
    { label: '코스안내', href: '/guide/course/' },
    { label: '이용방법', href: '/guide/how-to/' },
    { label: '자주묻는질문', href: '/guide/faq/' }
  ]
};

export const PHONE_HREF = `tel:${SITE.telRaw}`;
