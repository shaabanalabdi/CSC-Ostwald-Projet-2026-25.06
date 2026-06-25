// One-shot utility — finds i18n keys present in fr/translation.json
// that no longer appear anywhere under client/src. Run from client/:
//   node scripts/find-dead-i18n.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const fr = JSON.parse(
  fs.readFileSync(path.join(root, 'src/i18n/locales/fr/translation.json'), 'utf8')
);

function flatten(obj, prefix = '') {
  const out = [];
  for (const [k, v] of Object.entries(obj)) {
    const full = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) out.push(...flatten(v, full));
    else out.push(full);
  }
  return out;
}

const allKeys = flatten(fr);

// Collect every .tsx/.ts/.scss/.html under src
function walk(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(p));
    else if (/\.(ts|tsx|jsx?|html)$/.test(entry.name) && !p.includes(path.sep + 'mocks' + path.sep))
      out.push(p);
  }
  return out;
}

const files = walk(path.join(root, 'src'));
const blob = files.map((f) => fs.readFileSync(f, 'utf8')).join('\n');

const dead = allKeys.filter((k) => {
  // Match either the full key or a parent prefix used dynamically
  // e.g. t(\`form.benevole.${x}\`). We keep parents in i18n only if a
  // string in code contains the prefix followed by ${ or +.
  const escaped = k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const reLiteral = new RegExp(`['"\`]${escaped}['"\`)\\s.,}]`);
  if (reLiteral.test(blob)) return false;
  // dynamic prefix
  const parts = k.split('.');
  for (let i = 1; i < parts.length; i++) {
    const prefix = parts.slice(0, i).join('.');
    const reDyn = new RegExp(`['"\`]${prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\.\\$\\{`);
    if (reDyn.test(blob)) return false;
  }
  return true;
});

console.log(`Total keys: ${allKeys.length}`);
console.log(`Dead keys: ${dead.length}`);
for (const k of dead) console.log('  ' + k);
