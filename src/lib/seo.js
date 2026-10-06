/* ===========================================================
 *  <head> 메타 · 구조화 데이터(JSON-LD) 생성
 *  SEO  : 고유 title/description/canonical, sitemap, RSS
 *  GEO  : geo.region / geo.position / ICBM / areaServed / GeoCoordinates
 *  AEO  : FAQPage, speakable, 답변 요약 블록, Q&A 구조
 *  네이버: 서치어드바이저 메타, 단일 주제 일관성, dateModified 최신성
 * =========================================================== */
import { SITE } from '../data/site.js';

const PRETENDARD = 'https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css';

export const esc = s => String(s ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

export const abs = p => SITE.origin + (p.startsWith('/') ? p : '/' + p);

/* description 길이 보정 (검색결과 잘림 방지: 70~158자) */
export function clampDesc(s) {
  const t = String(s).replace(/\s+/g, ' ').trim();
  if (t.length <= 158) return t;
  const cut = t.slice(0, 158);
  const i = Math.max(cut.lastIndexOf('. '), cut.lastIndexOf('다 '), cut.lastIndexOf('요 '), cut.lastIndexOf(', '));
  return (i > 90 ? cut.slice(0, i + 1) : cut).trim();
}

export const jsonld = obj =>
  `<script type="application/ld+json">${JSON.stringify(obj).replace(/</g, '\\u003c')}</script>`;

/* ── 공통 노드 ─────────────────────────────────────────── */
export const orgNode = () => ({
  '@type': 'Organization',
  '@id': abs('/#org'),
  name: SITE.brand,
  alternateName: SITE.brandEn,
  url: abs('/'),
  description: `${SITE.tagline} — 서울·경기·인천 행정구·행정동 단위 마사지 로드샵 정보와 출장 마사지·홈타이 예약 안내`,
  areaServed: ['서울특별시', '경기도', '인천광역시'].map(n => ({ '@type': 'AdministrativeArea', name: n })),
  contactPoint: [{
    '@type': 'ContactPoint',
    telephone: `+82-${SITE.telRaw.replace(/^0/, '')}`,
    contactType: 'reservations',
    areaServed: 'KR',
    availableLanguage: ['ko'],
    contactOption: 'TollFree'
  }]
});

export const siteNode = () => ({
  '@type': 'WebSite',
  '@id': abs('/#website'),
  url: abs('/'),
  name: SITE.brand,
  inLanguage: 'ko-KR',
  publisher: { '@id': abs('/#org') },
  potentialAction: {
    '@type': 'SearchAction',
    target: { '@type': 'EntryPoint', urlTemplate: abs('/search/?q={q}') },
    'query-input': 'required name=q'
  }
});

export const breadcrumbNode = (crumbs, path) => ({
  '@type': 'BreadcrumbList',
  '@id': abs(path) + '#breadcrumb',
  itemListElement: crumbs.map((c, i) => ({
    '@type': 'ListItem', position: i + 1, name: c.label,
    ...(c.href ? { item: abs(c.href) } : {})
  }))
});

export const webPageNode = ({ path, title, desc, crumbs, geo, placename }) => ({
  '@type': 'WebPage',
  '@id': abs(path) + '#webpage',
  url: abs(path),
  name: title,
  description: desc,
  inLanguage: 'ko-KR',
  isPartOf: { '@id': abs('/#website') },
  datePublished: `${SITE.operator.since}-01-01`,
  dateModified: SITE.updated,
  breadcrumb: { '@id': abs(path) + '#breadcrumb' },
  ...(geo ? {
    about: {
      '@type': 'Place', name: placename,
      geo: { '@type': 'GeoCoordinates', latitude: geo[0], longitude: geo[1] }
    }
  } : {}),
  /* AEO: 음성/발췌 대상 지정 */
  speakable: {
    '@type': 'SpeakableSpecification',
    cssSelector: ['.answer p', 'h1', '.faq summary', '.faq .a']
  },
  ...(crumbs ? {} : {})
});

export const faqNode = (faq, path) => ({
  '@type': 'FAQPage',
  '@id': abs(path) + '#faq',
  mainEntity: faq.map(f => ({
    '@type': 'Question', name: f.q,
    acceptedAnswer: { '@type': 'Answer', text: f.a }
  }))
});

export const itemListNode = ({ path, name, items }) => ({
  '@type': 'ItemList',
  '@id': abs(path) + '#list',
  name,
  numberOfItems: items.length,
  itemListOrder: 'https://schema.org/ItemListOrderAscending',
  itemListElement: items.map((it, i) => ({
    '@type': 'ListItem', position: i + 1, name: it.name, url: abs(it.path)
  }))
});

/* 로드샵 — HealthAndBeautyBusiness (MassageShop 하위 유형) */
export const shopNode = shop => ({
  '@type': ['HealthAndBeautyBusiness', 'LocalBusiness'],
  '@id': abs(shop.path) + '#business',
  name: shop.name,
  url: abs(shop.path),
  description: shop.desc,
  telephone: `+82-${SITE.telRaw.replace(/^0/, '')}`,
  priceRange: `₩${shop.minPrice.toLocaleString('ko-KR')}~₩${shop.maxPrice.toLocaleString('ko-KR')}`,
  currenciesAccepted: 'KRW',
  paymentAccepted: '현금, 카드',
  address: {
    '@type': 'PostalAddress',
    addressCountry: 'KR',
    addressRegion: shop.region.full,
    addressLocality: shop.district.name,
    addressArea: shop.dong.name
  },
  geo: { '@type': 'GeoCoordinates', latitude: shop.district.geo[0], longitude: shop.district.geo[1] },
  areaServed: [
    { '@type': 'AdministrativeArea', name: `${shop.district.name} ${shop.dong.name}` },
    { '@type': 'AdministrativeArea', name: shop.district.name },
    ...shop.district.near.map(n => ({ '@type': 'AdministrativeArea', name: n }))
  ],
  knowsAbout: shop.tags,
  makesOffer: shop.courses.map(c => ({
    '@type': 'Offer',
    name: `${c.name} ${c.min}분`,
    price: c.price, priceCurrency: 'KRW',
    availability: 'https://schema.org/InStock',
    itemOffered: { '@type': 'Service', name: `${shop.kind} ${c.min}분`, serviceType: shop.kind, provider: { '@id': abs(shop.path) + '#business' } }
  })),
  availableService: [
    { '@type': 'Service', name: '출장 마사지', serviceType: '출장 마사지', areaServed: { '@type': 'AdministrativeArea', name: `${shop.district.name} ${shop.dong.name}` } },
    { '@type': 'Service', name: '홈타이', serviceType: '홈타이', areaServed: { '@type': 'AdministrativeArea', name: shop.district.name } }
  ],
  isAccessibleForFree: false,
  publicAccess: true,
  parentOrganization: { '@id': abs('/#org') }
});

/* ── <head> ─────────────────────────────────────────────── */
export function head({ path, title, desc, geo, placename, keywords, graph = [], ogType = 'website' }) {
  const t = title.length > 62 ? title : title;
  const V = SITE.verify;
  return `<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>${esc(t)}</title>
<meta name="description" content="${esc(desc)}">
${keywords ? `<meta name="keywords" content="${esc(keywords)}">` : ''}
<link rel="canonical" href="${abs(path)}">
<meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1">
<meta name="format-detection" content="telephone=yes">
<meta name="author" content="${esc(SITE.operator.name)}">
<meta name="theme-color" content="#0B6B5B" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#0F1214" media="(prefers-color-scheme: dark)">
<meta property="og:type" content="${ogType}">
<meta property="og:site_name" content="${esc(SITE.brand)}">
<meta property="og:locale" content="ko_KR">
<meta property="og:title" content="${esc(t)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${abs(path)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(t)}">
<meta name="twitter:description" content="${esc(desc)}">
${geo ? `<meta name="geo.region" content="${esc(geo.region)}">
<meta name="geo.placename" content="${esc(placename)}">
<meta name="geo.position" content="${geo.pos[0]};${geo.pos[1]}">
<meta name="ICBM" content="${geo.pos[0]}, ${geo.pos[1]}">` : ''}
${V.naver ? `<meta name="naver-site-verification" content="${esc(V.naver)}">` : ''}
${V.google ? `<meta name="google-site-verification" content="${esc(V.google)}">` : ''}
${V.bing ? `<meta name="msvalidate.01" content="${esc(V.bing)}">` : ''}
<link rel="alternate" hreflang="ko-KR" href="${abs(path)}">
<link rel="alternate" type="application/rss+xml" title="${esc(SITE.brand)} 지역 업데이트" href="${abs('/rss.xml')}">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/favicon.svg">
<link rel="stylesheet" href="/assets/styles.css">
<!-- 본문 폰트(Pretendard)는 렌더를 막지 않도록 비동기 로드.
     CDN 이 막히거나 느려도 시스템 한글 폰트로 즉시 렌더됩니다. -->
<link rel="preconnect" href="https://cdn.jsdelivr.net" crossorigin>
<link rel="preload" as="style" href="${PRETENDARD}" onload="this.onload=null;this.rel='stylesheet'">
<noscript><link rel="stylesheet" href="${PRETENDARD}"></noscript>
${jsonld({ '@context': 'https://schema.org', '@graph': graph })}`;
}
