// Splits big download files (e.g. .exe) into gzip parts under 8 MB so any static
// host (Netlify) can serve them; public/download.html joins them back together.
// Writes public/downloads/<dir>/<i>.bin and records the file in src/lib/downloads.json.
// usage: npm run pack-downloads -- <file> [<file> ...]
import { createGzip, constants } from 'node:zlib';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { pipeline } from 'node:stream/promises';
import fs from 'node:fs';
import path from 'node:path';

const MAX_PART = 8 * 1024 * 1024;
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const manifestPath = path.join(root, 'src/lib/downloads.json');
const files = process.argv.slice(2);
if (!files.length) { console.error('usage: npm run pack-downloads -- <file> [<file> ...]'); process.exit(1); }
const manifest = fs.existsSync(manifestPath) ? JSON.parse(fs.readFileSync(manifestPath, 'utf8')) : {};

for (const file of files) {
  const name = path.basename(file);
  const dir = path.parse(name).name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const dest = path.join(root, 'public/downloads', dir);
  fs.rmSync(dest, { recursive: true, force: true });
  fs.mkdirSync(dest, { recursive: true });
  // Stream gzip output straight into numbered parts so a 1 GB+ file never sits in memory.
  let part = 0, inPart = 0, out = fs.openSync(path.join(dest, '0.bin'), 'w'), total = 0;
  const hash = createHash('sha1');
  await pipeline(fs.createReadStream(file), createGzip({ level: 6 }), async source => {
    for await (const chunk of source) {
      hash.update(chunk); total += chunk.length;
      let off = 0;
      while (off < chunk.length) {
        if (inPart === MAX_PART) { fs.closeSync(out); out = fs.openSync(path.join(dest, `${++part}.bin`), 'w'); inPart = 0; }
        const n = Math.min(MAX_PART - inPart, chunk.length - off);
        fs.writeSync(out, chunk, off, n); off += n; inPart += n;
      }
    }
  });
  fs.closeSync(out);
  const size = fs.statSync(file).size;
  manifest[name] = { dir, parts: part + 1, bytes: total, size, v: hash.digest('hex').slice(0, 10) };
  console.log(`${name}: ${(size / 1e6).toFixed(0)} MB -> ${(total / 1e6).toFixed(0)} MB in ${part + 1} parts`);
}
fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 1)}\n`);
