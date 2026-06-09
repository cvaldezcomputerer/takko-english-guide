/**
 * Step 2 of the vocab-image pipeline.
 *
 * Serves a local review gallery so you can pick the best photo for each word
 * (homonyms like "soda"/"date" and abstract words need a human eye). Reads
 * tools/data/image-candidates.json (step 1) and writes your picks to
 * tools/data/image-selections.json. Picks save instantly, so you can stop and
 * resume anytime.
 *
 * Usage:
 *   node tools/scripts/images/review-server.mjs        then open http://localhost:4321
 *
 * Keyboard: 1-8 pick a candidate · s skip · ← back · → next unreviewed
 */

import { createServer } from "http";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { loadKeys, fetchCandidates } from "../../lib/images.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..", "..", "..");
const keys = loadKeys(ROOT); // for the reroll endpoint (hits Pexels/Pixabay for a fresh page)
// Paths/port are env-overridable so the same gallery serves both the vocab
// review and the general find-image tool (which points it at its own files).
const CANDIDATES_PATH = process.env.CANDIDATES_PATH || join(ROOT, "tools", "data", "image-candidates.json");
const SELECTIONS_PATH = process.env.SELECTIONS_PATH || join(ROOT, "tools", "data", "image-selections.json");
const PORT = Number(process.env.PORT || 4399); // 4399 to avoid clashing with `astro dev` (4321)

if (!existsSync(CANDIDATES_PATH)) {
  console.error(`No candidates file at ${CANDIDATES_PATH}.`);
  process.exit(1);
}

const readSelections = () =>
  existsSync(SELECTIONS_PATH) ? JSON.parse(readFileSync(SELECTIONS_PATH, "utf8")) : {};

const PAGE = `<!doctype html><html><head><meta charset="utf8">
<title>Vocab image review</title>
<style>
  :root { color-scheme: light; }
  body { font-family: system-ui, sans-serif; margin: 0; background: #fffbf0; color: #333; }
  header { position: sticky; top: 0; background: #4a7c59; color: #fff; padding: 12px 20px;
    display: flex; align-items: baseline; gap: 16px; }
  header h1 { font-size: 1.4rem; margin: 0; }
  header .ja { color: #d6ecdb; }
  header .cat { background: rgba(255,255,255,.2); padding: 2px 10px; border-radius: 6px; font-size: .85rem; }
  header .count { margin-left: auto; font-variant-numeric: tabular-nums; }
  .grid { display: flex; flex-wrap: wrap; gap: 16px; padding: 24px; }
  .tile { width: 240px; border: 3px solid transparent; border-radius: 10px; overflow: hidden;
    cursor: pointer; background: #fff; box-shadow: 2px 2px 0 #2d3a3a33; }
  .tile.chosen { border-color: #e76f51; }
  .tile img { width: 240px; height: 200px; object-fit: cover; display: block; }
  .tile .meta { font-size: .75rem; padding: 4px 8px; display: flex; justify-content: space-between; color: #666; }
  .num { position: absolute; margin: 6px; background: #2d3a3a; color: #fff; width: 24px; height: 24px;
    border-radius: 6px; display: grid; place-items: center; font-weight: bold; font-size: .8rem; }
  .controls { padding: 0 24px 40px; display: flex; gap: 12px; }
  button { font: inherit; padding: 10px 18px; border-radius: 8px; border: 2px solid #2d3a3a;
    background: #fff; cursor: pointer; box-shadow: 2px 2px 0 #2d3a3a; }
  button.skip { background: #f8f3e6; }
  button.none { background: #fbe6e0; border-color: #b5291c; }
  input.note { flex: 1; min-width: 220px; font: inherit; padding: 9px 14px;
    border-radius: 8px; border: 2px solid #2d3a3a; }
  .empty { padding: 24px; color: #999; }
  .notebanner { margin: 0 24px 12px; padding: 8px 12px; background: #fff6e0;
    border: 1px solid #e0c890; border-radius: 8px; color: #8a5a00; font-size: .9rem; }
  .hint { padding: 0 24px; color: #999; font-size: .85rem; }
</style></head><body>
<header>
  <h1 id="en"></h1><span class="ja" id="ja"></span><span class="cat" id="cat"></span>
  <span class="count" id="count"></span>
</header>
<div class="grid" id="grid"></div>
<div class="hint">Keys: <b>1-8</b> pick · <b>s</b> reroll (fresh images) · <b>n</b> no image · <b>←</b> back · <b>→</b> skip for now · the note box guides the reroll</div>
<div class="controls">
  <button onclick="go(-1)">← Back</button>
  <input id="note" class="note" placeholder="guide the reroll, e.g. 'a bento, not a lunchbox' — then press s">
  <button class="skip" onclick="reroll()">Reroll (s)</button>
  <button class="none" onclick="noImage()">No image (n)</button>
  <button onclick="nextUndecided()">Skip for now →</button>
</div>
<script>
let words = [], sel = {}, i = 0, shownEn = null, loading = false;
// "decided" = picked or marked no-image. Rerolls and "skip for now" save nothing,
// so an unpicked word stays undecided and resurfaces.
const decided = (en) => !!sel[en];
async function load() {
  const r = await fetch('/data'); const d = await r.json();
  words = d.words; sel = d.selections;
  nextUndecided(true);
}
function render() {
  const w = words[i];
  document.getElementById('en').textContent = w.en;
  document.getElementById('ja').textContent = (w.ja||[]).join(' / ');
  document.getElementById('cat').textContent = w.category;
  const n = Object.keys(sel).length;
  const pg = w.page && w.page > 1 ? '  ·  reroll ' + w.page : '';
  document.getElementById('count').textContent = n + ' / ' + words.length + ' decided  ·  #' + (i+1) + pg;
  if (w.en !== shownEn) { document.getElementById('note').value = ''; shownEn = w.en; } // clear note on a new word
  const chosen = sel[w.en];
  const grid = document.getElementById('grid');
  const banner = chosen && chosen.none ? '<div class="notebanner">Marked <b>no image</b> — pick a tile to override.</div>' : '';
  if (!w.candidates.length) {
    grid.innerHTML = banner || '<div class="empty">No images. Add a guiding note and reroll, or use <b>No image</b>.</div>';
    return;
  }
  grid.innerHTML = banner + w.candidates.map((c, k) => \`
    <div class="tile \${chosen && chosen.id===c.id ? 'chosen':''}" onclick="pick(\${k})">
      <span class="num">\${k+1}</span>
      <img loading="lazy" src="\${c.thumb}">
      <div class="meta"><span>\${c.source}</span><span>\${c.author||''}</span></div>
    </div>\`).join('');
}
async function save(en, choice) {
  sel[en] = choice;
  await fetch('/select', { method:'POST', headers:{'content-type':'application/json'},
    body: JSON.stringify({ en, choice }) });
}
async function pick(n) {
  const w = words[i]; const c = w.candidates[n]; if (!c) return;
  await save(w.en, c); render(); setTimeout(()=>nextUndecided(), 120);
}
// Reroll: pull a fresh page of images for THIS word (note box = guided query),
// staying on the word. Pages forward each press; wraps to page 1 at the end.
async function reroll() {
  if (loading) return;
  const w = words[i];
  const q = document.getElementById('note').value.trim() || w.en;
  let page = (w.query === q ? (w.page||1) + 1 : 1); // same query → next page; new query → page 1
  const btn = document.querySelector('button.skip'); const label = btn.textContent;
  loading = true; btn.textContent = '…';
  try {
    let cands = await more(w.en, q, page);
    if (!cands.length && page > 1) { page = 1; cands = await more(w.en, q, page); } // off the end → wrap
    if (cands.length) { w.candidates = cands; w.query = q; w.page = page; }
  } finally { loading = false; btn.textContent = label; render(); }
}
async function more(en, query, page) {
  const r = await fetch('/more', { method:'POST', headers:{'content-type':'application/json'},
    body: JSON.stringify({ en, query, page }) });
  const d = await r.json();
  return d.candidates || [];
}
async function noImage() { await save(words[i].en, { none:true }); nextUndecided(); } // final
function go(d) { i = Math.max(0, Math.min(words.length-1, i+d)); render(); }
function nextUndecided(initial) {
  let start = initial ? 0 : i+1;
  for (let k=start; k<words.length; k++) if (!decided(words[k].en)) { i=k; return render(); }
  for (let k=0; k<words.length; k++) if (!decided(words[k].en)) { i=k; return render(); }
  render(); // everything decided — stay put
}
document.addEventListener('keydown', e => {
  // While typing a note: let keys type normally; Enter triggers the guided reroll.
  if (document.activeElement === document.getElementById('note')) {
    if (e.key === 'Enter') { e.preventDefault(); reroll(); }
    else if (e.key === 'Escape') document.getElementById('note').blur();
    return;
  }
  if (e.key>='1' && e.key<='8') pick(+e.key-1);
  else if (e.key==='s') reroll();
  else if (e.key==='n') noImage();
  else if (e.key==='ArrowLeft') go(-1);
  else if (e.key==='ArrowRight') nextUndecided();
});
load();
</script></body></html>`;

createServer((req, res) => {
  if (req.method === "GET" && req.url === "/") {
    res.writeHead(200, { "content-type": "text/html" });
    return res.end(PAGE);
  }
  if (req.method === "GET" && req.url === "/data") {
    const cache = JSON.parse(readFileSync(CANDIDATES_PATH, "utf8"));
    const words = Object.values(cache);
    res.writeHead(200, { "content-type": "application/json" });
    return res.end(JSON.stringify({ words, selections: readSelections() }));
  }
  if (req.method === "POST" && req.url === "/more") {
    // Reroll: fetch a fresh page of candidates for one word and persist them into
    // the candidates cache (so a reload keeps the rerolled set).
    let body = "";
    req.on("data", (c) => (body += c));
    req.on("end", async () => {
      try {
        const { en, query, page } = JSON.parse(body);
        const enabled = { pixabay: !!keys.pixabay, pexels: !!keys.pexels };
        const candidates = await fetchCandidates(query || en, keys, enabled, 6, page || 1);
        const cache = JSON.parse(readFileSync(CANDIDATES_PATH, "utf8"));
        if (cache[en] && candidates.length) {
          cache[en].candidates = candidates;
          cache[en].query = query || en;
          cache[en].page = page || 1;
          writeFileSync(CANDIDATES_PATH, JSON.stringify(cache, null, 2));
        }
        res.writeHead(200, { "content-type": "application/json" });
        res.end(JSON.stringify({ candidates }));
      } catch (e) {
        res.writeHead(500, { "content-type": "application/json" });
        res.end(JSON.stringify({ error: String(e), candidates: [] }));
      }
    });
    return;
  }
  if (req.method === "POST" && req.url === "/select") {
    let body = "";
    req.on("data", (c) => (body += c));
    req.on("end", () => {
      const { en, choice } = JSON.parse(body);
      const sel = readSelections();
      sel[en] = choice;
      writeFileSync(SELECTIONS_PATH, JSON.stringify(sel, null, 2));
      res.writeHead(200, { "content-type": "application/json" });
      res.end(JSON.stringify({ ok: true }));
    });
    return;
  }
  res.writeHead(404);
  res.end();
}).listen(PORT, () => {
  console.log(`Review gallery: http://localhost:${PORT}`);
  console.log(`Picks save to ${SELECTIONS_PATH}`);
});
