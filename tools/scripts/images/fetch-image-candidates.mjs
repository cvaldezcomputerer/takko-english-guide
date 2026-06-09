/**
 * Step 1 of the vocab-image pipeline.
 *
 * Queries Pexels and/or Pixabay for a few real-photo CANDIDATES per vocab word
 * and caches them to tools/data/image-candidates.json. Nothing is downloaded yet —
 * that happens after you pick the best one in the review gallery (step 2).
 *
 * Requires PEXELS_API_KEY and/or PIXABAY_API_KEY in .env (either works; both is
 * better — you get more candidates to choose from).
 *
 * Usage:
 *   node tools/scripts/images/fetch-image-candidates.mjs
 *
 * Resumable & safe to re-run: words already in the cache are skipped, so it
 * never re-hits the API for work already done. Use --refetch <word> to redo one.
 *
 * Rate limits: Pixabay ~100 req/min (fast). Pexels 200 req/hour (slow) — if a
 * source 429s, it's dropped for the rest of the run and the other carries on.
 */

import { readFileSync, writeFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { loadKeys, fetchCandidates } from "../../lib/images.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..", "..", "..");
const CACHE_PATH = join(ROOT, "tools", "data", "image-candidates.json");

const keys = loadKeys(ROOT);
if (!keys.pexels && !keys.pixabay) {
  console.error("Need PEXELS_API_KEY and/or PIXABAY_API_KEY in .env");
  process.exit(1);
}

const DELAY_MS = Number(process.env.DELAY_MS || (keys.pixabay ? 700 : 18500));
const PER_SOURCE = 4;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ── build the word list (en + first category it appears in) ──
// Parsed straight from the .ts source so this script needs no TS toolchain and
// doesn't get tripped up by words.ts's extensionless `./images` import.
const src = readFileSync(join(ROOT, "src/data/vocab/words.ts"), "utf8");
const words = [];
const seen = new Set();
let category = "";
for (const line of src.split("\n")) {
  const nameM = line.match(/name:\s*"((?:[^"\\]|\\.)*)"/);
  if (nameM) {
    category = nameM[1];
    continue;
  }
  const m = line.match(/en:\s*"((?:[^"\\]|\\.)*)"\s*,\s*ja:\s*\[([^\]]*)\]/);
  if (!m) continue;
  const en = m[1];
  if (seen.has(en)) continue;
  seen.add(en);
  const ja = [...m[2].matchAll(/"((?:[^"\\]|\\.)*)"/g)].map((x) => x[1]);
  words.push({ en, ja, category });
}

// ── main ──
const SELECTIONS_PATH = join(ROOT, "tools", "data", "image-selections.json");
const arg = (name) => {
  const i = process.argv.indexOf(name);
  return i !== -1 ? process.argv[i + 1] : null;
};

// --list-notes: print words the reviewer flagged with a note (for a re-fetch), then exit.
if (process.argv.includes("--list-notes")) {
  const sel = existsSync(SELECTIONS_PATH) ? JSON.parse(readFileSync(SELECTIONS_PATH, "utf8")) : {};
  const noted = Object.entries(sel).filter(([, v]) => v && v.note);
  if (!noted.length) console.log("No noted words.");
  else for (const [en, v] of noted) console.log(`  ${en}  —  ${v.note}`);
  process.exit(0);
}

const cache = existsSync(CACHE_PATH) ? JSON.parse(readFileSync(CACHE_PATH, "utf8")) : {};
const refetchWord = arg("--refetch");
// --query "<terms>" overrides what we search for (only with --refetch), e.g. to
// act on a reviewer note: --refetch "date" --query "calendar date day". The cache
// key stays the word; only the search text changes.
const customQuery = arg("--query");

// Sources start enabled if their key exists; fetchCandidates flips one off on 429.
const enabled = { pixabay: !!keys.pixabay, pexels: !!keys.pexels };

let done = 0;
// Fetch words with no cache entry OR an empty candidate list (e.g. a prior run
// where a source was down). --refetch <word> forces just one.
const needsFetch = (w) => !cache[w.en] || !cache[w.en].candidates.length;
const todo = words.filter((w) => (refetchWord ? w.en === refetchWord : needsFetch(w)));
if (refetchWord && !todo.length) console.error(`No vocab word matches --refetch "${refetchWord}".`);
console.log(
  `${words.length} words total, ${todo.length} to fetch ` +
    `(sources: ${[keys.pixabay && "pixabay", keys.pexels && "pexels"].filter(Boolean).join("+")}, ${DELAY_MS}ms gap)` +
    (customQuery ? `  query="${customQuery}"` : "")
);

for (const w of todo) {
  if (!enabled.pixabay && !enabled.pexels) {
    console.error("All sources rate-limited. Progress saved — re-run later to continue.");
    break;
  }
  const query = refetchWord && customQuery ? customQuery : w.en;
  const candidates = await fetchCandidates(query, keys, enabled, PER_SOURCE);
  cache[w.en] = { en: w.en, ja: w.ja, category: w.category, candidates };
  writeFileSync(CACHE_PATH, JSON.stringify(cache, null, 2)); // save after each → resumable

  // A refetch means "give me fresh options" — drop any old pick/skip-note/no-image
  // for this word so it resurfaces as undecided in the gallery.
  if (refetchWord && existsSync(SELECTIONS_PATH)) {
    const sel = JSON.parse(readFileSync(SELECTIONS_PATH, "utf8"));
    if (w.en in sel) {
      delete sel[w.en];
      writeFileSync(SELECTIONS_PATH, JSON.stringify(sel, null, 2));
    }
  }
  done++;
  console.log(`  ${done}/${todo.length}  ${w.en} (${candidates.length} candidates)`);
  await sleep(DELAY_MS);
}

console.log(`Done. Cache: ${CACHE_PATH}`);
