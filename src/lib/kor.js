/* 한국어 조사 자동 선택 — 템플릿에 변수를 끼울 때 "역삼동는" 같은 오류를 막는다 */

const DIGIT_JONG = { '0': true, '1': true, '3': true, '6': true, '7': true, '8': true, '2': false, '4': false, '5': false, '9': false };

export function hasJong(word) {
  const s = String(word).replace(/[\s)\]}"'·]+$/, '');
  const ch = s[s.length - 1];
  if (!ch) return false;
  const code = ch.codePointAt(0);
  if (code >= 0xac00 && code <= 0xd7a3) return (code - 0xac00) % 28 !== 0;
  if (/[0-9]/.test(ch)) return DIGIT_JONG[ch];
  if (/[a-zA-Z]/.test(ch)) return !'aeiouAEIOUlmnrLMNR'.includes(ch) ? true : 'lmnrLMNR'.includes(ch);
  return false;
}

const PAIRS = [
  ['은', '는'], ['이', '가'], ['을', '를'], ['과', '와'],
  ['이라', '라'], ['이나', '나'], ['이며', '며'], ['이야', '야'],
  ['으로', '로'], ['이에요', '예요'], ['입니다', '입니다']
];

/* jo('역삼동','는') → '역삼동은' / jo('테헤란로','이') → '테헤란로가' */
export function jo(word, particle) {
  const w = String(word ?? '');
  const pair = PAIRS.find(p => p.includes(particle));
  if (!pair) return w + particle;
  const jong = hasJong(w);
  /* '으로/로' 는 ㄹ 받침이면 '로' */
  if (pair[0] === '으로') {
    const ch = w.replace(/[\s)\]}"'·]+$/, '').slice(-1);
    const code = ch ? ch.codePointAt(0) : 0;
    const isRieul = code >= 0xac00 && code <= 0xd7a3 && (code - 0xac00) % 28 === 8;
    return w + (jong && !isRieul ? '으로' : '로');
  }
  return w + (jong ? pair[0] : pair[1]);
}

/* 템플릿 가독성용 숏컷 */
export const eun = w => jo(w, '은');
export const ga  = w => jo(w, '이');
export const eul = w => jo(w, '을');
export const gwa = w => jo(w, '과');
export const ira = w => jo(w, '이라');
