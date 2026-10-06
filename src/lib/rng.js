/* 결정적(seeded) 난수 — 빌드마다 같은 결과가 나와야 하므로 Math.random 미사용 */

export function hash32(str) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h >>> 0;
}

export function rng(seedStr) {
  let s = hash32(String(seedStr)) || 1;
  const next = () => {
    s ^= s << 13; s >>>= 0;
    s ^= s >>> 17;
    s ^= s << 5;  s >>>= 0;
    return s / 4294967296;
  };
  next(); next();
  return {
    float: next,
    int: (min, max) => min + Math.floor(next() * (max - min + 1)),
    pick: arr => arr[Math.floor(next() * arr.length)],
    bool: (p = 0.5) => next() < p,
    /* 중복 없이 n개 뽑기 */
    sample: (arr, n) => {
      const a = arr.slice();
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(next() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
      }
      return a.slice(0, Math.min(n, a.length));
    },
    shuffle: arr => {
      const a = arr.slice();
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(next() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
      }
      return a;
    }
  };
}

/* 시드별로 서로 다른 순서의 "변형 선택기".
 * 같은 템플릿 풀을 쓰더라도 seed 가 다르면 다른 조합이 뽑히고,
 * 한 페이지 안에서는 같은 문장이 재사용되지 않도록 사용 이력을 기억한다. */
export function variantPicker(seedStr) {
  const r = rng(seedStr);
  const used = new Set();
  return function pick(pool, key = '') {
    const order = r.shuffle(pool.map((_, i) => i));
    for (const i of order) {
      const k = key + '#' + i;
      if (!used.has(k)) { used.add(k); return pool[i]; }
    }
    return pool[order[0]];
  };
}
