// Lets a Godot web export load its big files (.wasm, .pck) from the gzip parts
// written by scripts/pack-godot.mjs, since Lovable rejects files over 10 MB.
// index.html sets window.GODOT_PACKS before this runs; any fetch for one of those
// files is answered by downloading its parts in parallel (kept in the Cache API so
// replays skip the network) and inflating them back into the original bytes.
// Godot reads the framebuffer binding and scissor state back from WebGL every
// frame; in Chrome each read waits for the GPU to finish, stalling the one thread.
// Track both on the JS side so those reads never leave the page.
(() => {
  const P = window.WebGL2RenderingContext && WebGL2RenderingContext.prototype;
  if (!P) return;
  const G = WebGL2RenderingContext, seen = new WeakMap();
  const st = gl => { let s = seen.get(gl); if (!s) seen.set(gl, s = { draw: null, read: null, scissor: false }); return s; };
  const { bindFramebuffer, enable, disable, getParameter } = P;
  P.bindFramebuffer = function (target, fb) {
    const s = st(this);
    if (target === G.FRAMEBUFFER || target === G.DRAW_FRAMEBUFFER) s.draw = fb;
    if (target === G.FRAMEBUFFER || target === G.READ_FRAMEBUFFER) s.read = fb;
    return bindFramebuffer.call(this, target, fb);
  };
  P.enable = function (cap) { if (cap === G.SCISSOR_TEST) st(this).scissor = true; return enable.call(this, cap); };
  P.disable = function (cap) { if (cap === G.SCISSOR_TEST) st(this).scissor = false; return disable.call(this, cap); };
  P.getParameter = function (p) {
    if (p === G.FRAMEBUFFER_BINDING) return st(this).draw;
    if (p === G.READ_FRAMEBUFFER_BINDING) return st(this).read;
    if (p === G.SCISSOR_TEST) return st(this).scissor;
    return getParameter.call(this, p);
  };
})();

(() => {
  const packs = window.GODOT_PACKS || {};
  const realFetch = window.fetch.bind(window);
  const base = location.pathname.replace(/[^/]*$/, '');
  let cache = null;
  const cacheReady = (async () => { try { cache = await caches.open('cl-games'); } catch {} })();

  async function getPart(url, tries = 2) {
    await cacheReady;
    const hit = cache && await cache.match(url).catch(() => null);
    if (hit) return hit.blob();
    try {
      const res = await realFetch(url);
      if (!res.ok) throw new Error(`Download failed (HTTP ${res.status}).`);
      const blob = await res.blob();
      if (cache) cache.put(url, new Response(blob)).catch(() => {});
      return blob;
    } catch (err) {
      if (tries > 1) return getPart(url, tries - 1);
      throw err;
    }
  }

  async function assemble(name, p) {
    const urls = Array.from({ length: p.parts }, (_, i) => `${base}parts/${name}.${i}.bin?v=${p.v}`);
    const packed = new Blob(await Promise.all(urls.map(u => getPart(u))));
    if (cache) cache.keys().then(keys => keys.forEach(req => {
      const u = new URL(req.url);
      if (u.pathname.startsWith(`${base}parts/${name}.`) && u.searchParams.get('v') !== p.v) cache.delete(req);
    })).catch(() => {});
    const magic = new Uint8Array(await packed.slice(0, 2).arrayBuffer());
    const body = magic[0] === 0x1f && magic[1] === 0x8b ? packed.stream().pipeThrough(new DecompressionStream('gzip')) : packed.stream();
    return new Response(body, { headers: { 'content-type': p.type, 'content-length': String(p.size) } });
  }

  window.fetch = (input, init) => {
    const url = new URL(typeof input === 'string' || input instanceof URL ? input : input.url, location.href);
    const p = url.origin === location.origin && url.pathname.startsWith(base) ? packs[url.pathname.slice(base.length)] : null;
    return p ? assemble(url.pathname.slice(base.length), p) : realFetch(input, init);
  };
})();
