/* 한글 → 로마자(개정 로마자 표기법 근사) 변환기.  URL 슬러그 생성 전용. */
const CHO = ['g','kk','n','d','tt','r','m','b','pp','s','ss','','j','jj','ch','k','t','p','h'];
const JUNG = ['a','ae','ya','yae','eo','e','yeo','ye','o','wa','wae','oe','yo','u','wo','we','wi','yu','eu','ui','i'];
/* 종성 27종 + 없음 */
const JONG = ['','k','k','k','n','n','n','t','l','k','m','p','l','l','p','l','m','p','p','t','t','ng','t','t','k','t','p','t'];

export function romanize(str) {
  let out = '';
  for (const ch of str) {
    const code = ch.codePointAt(0);
    if (code >= 0xac00 && code <= 0xd7a3) {
      const i = code - 0xac00;
      out += CHO[Math.floor(i / 588)] + JUNG[Math.floor((i % 588) / 28)] + JONG[i % 28];
    } else if (/[a-zA-Z0-9]/.test(ch)) {
      out += ch.toLowerCase();
    } else if (/[\s·\-_.]/.test(ch)) {
      out += '-';
    }
  }
  return out.replace(/-+/g, '-').replace(/^-|-$/g, '');
}

/* 행정동/구 이름 → 슬러그.  접미사(동·읍·면·가)는 제거해 짧게 유지 */
export function slugify(korName, { keepSuffix = false } = {}) {
  let n = String(korName).replace(/\([^)]*\)/g, '').trim();
  if (!keepSuffix) n = n.replace(/(제?\d+)?(동|읍|면|리|가)$/, '');
  if (!n) n = String(korName);
  return romanize(n) || 'area';
}
