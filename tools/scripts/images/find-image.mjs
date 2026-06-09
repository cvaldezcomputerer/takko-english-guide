/**
 * find-image — a general "get me a real photo" tool (not tied to vocab).
 *
 * Ask for any image, browse candidates from Pexels/Pixabay in the gallery, pick
 * one, and save it wherever you want at whatever size. Same engine as the vocab
 * image pipeline; reuses the review gallery (tools/scripts/images/review-server.mjs).
 *
 * Requires PEXELS_API_KEY and/or PIXABAY_API_KEY in .env.
 *
 *   node tools/scripts/images/find-image.mjs add "<query>" ["<query>" ...]   # fetch candidates
 *   node tools/scripts/images/find-image.mjs serve [--port 4400]             # open the pick gallery
 *   node tools/scripts/images/find-image.mjs list                            # show queue + picks
 *   node tools/scripts/images/find-image.mjs save "<query>" --to <path> \    # download your pick
 *        [--width N] [--height N] [--fit cover|contain]
 *
 * Typical loop (Claude drives this for you): add → you pick in the gallery → save.
 * Output format is inferred from the --to extension (.webp/.jpg/.png).
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join, dirname, resolve } from "path";
import { fileURLToPath } from "url";
import { spawn } from "child_process";
import { loadKeys, fetchCandidates, downloadImage } from "../../lib/images.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..", "..", "..");
const DIR = join(ROOT, "tools", "data", ".find-image");
const CANDIDATES_PATH = join(DIR, "candidates.json");
const SELECTIONS_PATH = join(DIR, "selections.json");
mkdirSync(DIR, { recursive: true });

const keys = loadKeys(ROOT);
const readJson = (p) => (existsSync(p) ? JSON.parse(readFileSync(p, "utf8")) : {});

// crude flag parser: --key value  (and bare --flag → true)
function flags(args) {
  const out = {};
  for (let i = 0; i < args.length; i++) {
    if (!args[i].startsWith("--")) continue;
    const k = args[i].slice(2);
    const v = args[i + 1] && !args[i + 1].startsWith("--") ? args[(i++, i)] : true;
    out[k] = v;
  }
  return out;
}

const [cmd, ...rest] = process.argv.slice(2);

async function cmdAdd() {
  const queries = rest.filter((a) => !a.startsWith("--"));
  if (!queries.length) return console.error('Usage: find-image add "<query>" ...');
  if (!keys.pexels && !keys.pixabay) return console.error("Need PEXELS_API_KEY and/or PIXABAY_API_KEY in .env");

  const cache = readJson(CANDIDATES_PATH);
  const enabled = { pixabay: !!keys.pixabay, pexels: !!keys.pexels };
  for (const q of queries) {
    const candidates = await fetchCandidates(q, keys, enabled, 6); // 6/source → up to 12 options
    cache[q] = { en: q, ja: [], category: "find-image", candidates };
    writeFileSync(CANDIDATES_PATH, JSON.stringify(cache, null, 2));
    console.log(`  "${q}" → ${candidates.length} candidates`);
  }
  console.log(`Now run:  node tools/scripts/images/find-image.mjs serve   then open the gallery and pick.`);
}

function cmdServe() {
  const f = flags(rest);
  const port = f.port || 4400; // 4400 so it can run alongside the vocab gallery (4399)
  console.log(`Opening pick gallery on http://localhost:${port} …`);
  spawn("node", [join(__dirname, "review-server.mjs")], {
    stdio: "inherit",
    env: { ...process.env, CANDIDATES_PATH, SELECTIONS_PATH, PORT: String(port) },
  });
}

function cmdList() {
  const cache = readJson(CANDIDATES_PATH);
  const sel = readJson(SELECTIONS_PATH);
  const rows = Object.keys(cache);
  if (!rows.length) return console.log("Queue empty. Add one with: find-image add \"<query>\"");
  for (const q of rows) {
    const s = sel[q];
    const state = !s ? "… not picked" : s.none ? "✗ no image" : s.skip ? "↦ skipped" : `✓ ${s.source} ${s.id}`;
    console.log(`  ${state.padEnd(20)}  ${q}  (${cache[q].candidates.length} candidates)`);
  }
}

async function cmdSave() {
  const query = rest.find((a) => !a.startsWith("--"));
  const f = flags(rest);
  if (!query || !f.to) return console.error('Usage: find-image save "<query>" --to <path> [--width N --height N --fit cover|contain]');

  const sel = readJson(SELECTIONS_PATH);
  const choice = sel[query];
  if (!choice) return console.error(`No pick for "${query}" yet — open the gallery and choose one first.`);
  if (choice.none || choice.skip) return console.error(`"${query}" is marked ${choice.none ? "no-image" : "skipped"}, not picked.`);

  const outPath = resolve(ROOT, f.to); // honors absolute --to; resolves a relative one against repo root
  await downloadImage(choice.full || choice.thumb, outPath, {
    width: f.width ? Number(f.width) : undefined,
    height: f.height ? Number(f.height) : undefined,
    fit: f.fit || "cover",
  });
  console.log(`Saved "${query}" → ${f.to}  (from ${choice.source}, by ${choice.author || "unknown"})`);
}

const commands = { add: cmdAdd, serve: cmdServe, list: cmdList, save: cmdSave };
if (!commands[cmd]) {
  console.error("Commands: add | serve | list | save   (run with no args for help in the header comment)");
  process.exit(1);
}
await commands[cmd]();
