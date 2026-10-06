import { slugify } from '../lib/romanize.js';

/* 행정구(또는 시) 1건 생성.  dongs: [이름, 인접역, 랜드마크, 상권특징] */
export const d = (name, geo, o = {}) => ({
  slug: o.slug || slugify(name.replace(/(구|군|시)$/, ''), { keepSuffix: true }),
  name,                        // 전체 표기 (예: "수원시 영통구")
  short: o.short || name,      // 짧은 표기 (예: "영통구")
  city: o.city || '',          // 상위 시 (경기 구 단위에서만 사용)
  geo,                         // [lat, lng]
  lines: o.lines || [],
  hubs: o.hubs || [],
  marks: o.marks || [],
  zone: o.zone,
  near: o.near || [],
  night: o.night || '심야 수요 보통',
  road: o.road || '간선도로 접근 양호',
  dongs: (o.dongs || []).map(([dn, st, mk, tr, s]) => ({
    slug: s || slugify(dn), name: dn, station: st, mark: mk, trait: tr
  }))
});
