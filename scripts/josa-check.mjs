/* 템플릿 소스 점검: ${변수} 바로 뒤에 조사가 붙었는데 jo() 를 거치지 않은 곳을 찾는다.
 * (생성된 본문을 정규식으로 훑으면 '맞는/않는' 같은 동사 어미와 구분이 안 되므로
 *  템플릿 작성 시점에서 막는 방식이 정확하다.) */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const JOSA = '은|는|이라|이나|이며|이|가|을|를|과|와';
const RE = new RegExp(String.raw`\$\{([^{}]*(?:\{[^{}]*\}[^{}]*)*)\}(${JOSA})(?![가-힣])`, 'g');

function walk(dir, out = []) {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (f.endsWith('.js') || f.endsWith('.mjs')) out.push(p);
  }
  return out;
}

let bad = 0;
for (const file of walk('src')) {
  const src = readFileSync(file, 'utf8');
  src.split('\n').forEach((line, i) => {
    for (const m of line.matchAll(RE)) {
      if (/^jo\(/.test(m[1].trim())) continue;       // 이미 처리됨
      bad++;
      console.log(`${file}:${i + 1}  →  \${${m[1]}}${m[2]}   (jo(expr, '${m[2]}') 로 감싸세요)`);
    }
  });
}
console.log(bad === 0 ? '조사 처리 점검 통과 — 변수 뒤 조사는 모두 jo() 를 거칩니다.' : `${bad}건 수정 필요`);
process.exit(bad === 0 ? 0 : 1);
