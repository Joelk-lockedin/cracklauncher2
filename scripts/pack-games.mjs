// Packs single-file HTML games for the launcher's /play.html loader: each file is
// gzipped as one stream and split into equal parts under 8 MB, because Lovable
// rejects files over 10 MB. Writes public/games/packed/<dir>/<i>.bin and records
// the game in src/lib/packed-games.json, which games.ts reads by filename.
// usage: npm run pack-games -- <game.html> [<game.html> ...]
import { constants, gzipSync } from 'node:zlib';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import path from 'node:path';

const MAX_PART = 8 * 1024 * 1024;
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.join(root, 'public/games/packed');
const manifestPath = path.join(root, 'src/lib/packed-games.json');

const files = process.argv.slice(2);
if (!files.length) {
  console.error('usage: npm run pack-games -- <game.html> [<game.html> ...]');
  process.exit(1);
}
const manifest = fs.existsSync(manifestPath) ? JSON.parse(fs.readFileSync(manifestPath, 'utf8')) : {};
for (const file of files) {
  const name = path.basename(file);
  const raw = fs.readFileSync(file);
  const gz = gzipSync(raw, { level: constants.Z_BEST_COMPRESSION });
  const parts = Math.max(1, Math.ceil(gz.length / MAX_PART));
  const size = Math.ceil(gz.length / parts);
  const dir = path.parse(name).name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const dest = path.join(outDir, dir);
  fs.rmSync(dest, { recursive: true, force: true });
  fs.mkdirSync(dest, { recursive: true });
  for (let i = 0; i < parts; i++) fs.writeFileSync(path.join(dest, `${i}.bin`), gz.subarray(i * size, (i + 1) * size));
  manifest[name] = { dir, parts, bytes: gz.length, size: raw.length, v: createHash('sha1').update(gz).digest('hex').slice(0, 10) };
  console.log(`${name}: ${(raw.length / 1e6).toFixed(1)} MB -> ${(gz.length / 1e6).toFixed(1)} MB in ${parts} part(s)`);
}
const sorted = Object.fromEntries(Object.entries(manifest).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)));
fs.writeFileSync(manifestPath, `${JSON.stringify(sorted, null, 1)}\n`);
