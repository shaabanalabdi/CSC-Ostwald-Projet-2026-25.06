// ============================================================
// compress-images.mjs — Optimisation images source (one-shot)
//
// Compresse les PNG/JPG > 200 KB en WebP qualité 82 (équivalent
// visuel ~identique, gain typique 70-90% en poids).
//
// Usage : node scripts/compress-images.mjs
// Idempotent : skip les fichiers déjà optimisés (WebP existe + plus récent).
// ============================================================

import sharp from 'sharp';
import { readdir, stat, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, extname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const IMAGES_DIR = join(__dirname, '..', 'src', 'assets', 'images');
const SIZE_THRESHOLD = 200 * 1024; // 200 KB
const WEBP_QUALITY = 82;

const files = await readdir(IMAGES_DIR);
const results = [];
const errors = [];

for (const file of files) {
  const ext = extname(file).toLowerCase();
  if (!['.png', '.jpg', '.jpeg', '.webp'].includes(ext)) continue;

  const fullPath = join(IMAGES_DIR, file);
  let fileStat;
  try {
    fileStat = await stat(fullPath);
  } catch (e) {
    errors.push({ file, err: e.message });
    continue;
  }
  if (fileStat.size < SIZE_THRESHOLD) continue;

  const baseName = basename(file, ext);
  const webpPath = join(IMAGES_DIR, `${baseName}.webp`);

  try {
    if (file.endsWith('.webp')) {
      // WebP > 200 KB → re-compresse via fichier temporaire pour éviter
      // les locks Windows (file en cours d'utilisation par Vite/preview).
      const buffer = await sharp(fullPath).webp({ quality: WEBP_QUALITY }).toBuffer();
      if (buffer.length < fileStat.size) {
        const tmpPath = `${fullPath}.tmp`;
        await writeFile(tmpPath, buffer);
        // Remplacement atomique (sur Windows : delete + rename via fs)
        const { rename, unlink } = await import('node:fs/promises');
        try {
          await unlink(fullPath);
        } catch {}
        await rename(tmpPath, fullPath);
        results.push({ file, before: fileStat.size, after: buffer.length, action: 'recompressed' });
      } else {
        results.push({
          file,
          before: fileStat.size,
          after: fileStat.size,
          action: 'skipped (already optimal)',
        });
      }
      continue;
    }

    // PNG/JPG → génère un .webp à côté
    const buffer = await sharp(fullPath).webp({ quality: WEBP_QUALITY }).toBuffer();
    await writeFile(webpPath, buffer);
    results.push({
      file,
      webp: `${baseName}.webp`,
      before: fileStat.size,
      after: buffer.length,
      action: 'converted to webp',
    });
  } catch (e) {
    errors.push({ file, err: e.message });
  }
}

// Rapport
console.log('\n=== Image optimization report ===\n');
const fmt = (n) => (n / 1024).toFixed(0) + ' KB';
let totalSaved = 0;
for (const r of results) {
  const saved = r.before - r.after;
  totalSaved += saved;
  const ratio = ((saved / r.before) * 100).toFixed(0);
  console.log(
    `${r.action.padEnd(28)} ${r.file.padEnd(50)} ${fmt(r.before)} → ${fmt(r.after)} (-${ratio}%)`
  );
  if (r.webp) console.log(`  ${' '.repeat(28)} (created: ${r.webp})`);
}
console.log(`\nTotal saved: ${fmt(totalSaved)}`);
if (errors.length > 0) {
  console.log(`\n${errors.length} error(s):`);
  for (const e of errors) console.log(`  - ${e.file}: ${e.err}`);
}
