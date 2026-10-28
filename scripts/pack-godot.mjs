// Publishes a Godot web export (single-threaded, Compatibility renderer) into
// public/games/<id>/. Small files are copied as-is; the .wasm and .pck are gzipped
// and split into parts under 8 MB (Lovable rejects files over 10 MB), and
// index.html gets public/games/godot-pack.js, which reassembles them in the browser.
// usage: npm run pack-godot -- <export folder with index.html> <id>
import { constants, gzipSync } from 'node:zlib';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import path from 'node:path';

const MAX_PART = 8 * 1024 * 1024;
const TYPES = { '.wasm': 'application/wasm', '.pck': 'application/octet-stream' };
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const [src, id] = process.argv.slice(2);
if (!src || !/^[a-z0-9-]+$/.test(id ?? '') || !fs.existsSync(path.join(src, 'index.html'))) {
  console.error('usage: npm run pack-godot -- <export folder with index.html> <id (a-z, 0-9, -)>');
  process.exit(1);
}
const dest = path.join(root, 'public/games', id);
fs.rmSync(dest, { recursive: true, force: true });
fs.mkdirSync(path.join(dest, 'parts'), { recursive: true });

const packs = {};
for (const name of fs.readdirSync(src)) {
  const file = path.join(src, name);
  if (!fs.statSync(file).isFile()) continue;
  const type = TYPES[path.extname(name)];
  if (!type) {
    if (fs.statSync(file).size > MAX_PART) throw new Error(`${name} is over 8 MB and isn't a .wasm or .pck`);
    fs.copyFileSync(file, path.join(dest, name));
    continue;
  }
  const raw = fs.readFileSync(file);
  const gz = gzipSync(raw, { level: constants.Z_BEST_COMPRESSION });
  const parts = Math.max(1, Math.ceil(gz.length / MAX_PART));
  const size = Math.ceil(gz.length / parts);
  for (let i = 0; i < parts; i++) fs.writeFileSync(path.join(dest, 'parts', `${name}.${i}.bin`), gz.subarray(i * size, (i + 1) * size));
  packs[name] = { parts, size: raw.length, type, v: createHash('sha1').update(gz).digest('hex').slice(0, 10) };
  console.log(`${name}: ${(raw.length / 1e6).toFixed(1)} MB -> ${(gz.length / 1e6).toFixed(1)} MB in ${parts} part(s)`);
}

const htmlPath = path.join(dest, 'index.html');
const html = fs.readFileSync(htmlPath, 'utf8');
const shim = `<script>window.GODOT_PACKS=${JSON.stringify(packs)};</script><script src="/games/godot-pack.js"></script>`;
const at = html.indexOf('<script');
if (at < 0) throw new Error('index.html has no <script> to load the engine');
fs.writeFileSync(htmlPath, html.slice(0, at) + shim + html.slice(at));
console.log(`published to public/games/${id}/`);
