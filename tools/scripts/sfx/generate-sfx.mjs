/**
 * SFX candidate generator — the sound-effect sibling of the image pipeline.
 *
 * A handful of game sounds (crowd cheer, multi-bar fanfares) feel better as real
 * recordings than as the procedural Web Audio synthesis in src/lib/sounds.ts.
 * This generates candidate clips for those keys with the ElevenLabs Sound
 * Effects API, so you can audition several and approve the best one in the
 * review server (step 2).
 *
 * Requires ELEVENLABS_API_KEY in .env.
 *
 * Usage:
 *   node tools/scripts/sfx/generate-sfx.mjs                 # 3 candidates for every key
 *   node tools/scripts/sfx/generate-sfx.mjs --only levelClear,streak
 *   node tools/scripts/sfx/generate-sfx.mjs --count 5       # more candidates per key
 *   node tools/scripts/sfx/generate-sfx.mjs --redo applause # wipe + regenerate one key
 *
 * Candidates land in tools/data/sfx-candidates/<key>/<key>-<n>.mp3 and are indexed
 * in tools/data/sfx-candidates.json. Both are local scratch (gitignored) — the
 * durable result is the approved clip + manifest the review server writes.
 * Safe to re-run: existing candidates are kept; it tops each key up to --count.
 *
 * Cost note: ElevenLabs bills ~40 credits/sec for fixed-duration clips and a
 * flat 200 credits when duration is left to the model. Specs below mirror the
 * brief: levelClear/gameOver use model-decided length (feel matters more than
 * tightness); applause/streak are pinned short to stay punchy.
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..", "..", "..");
const DATA = join(ROOT, "tools", "data");
const CAND_DIR = join(DATA, "sfx-candidates");
const INDEX_PATH = join(DATA, "sfx-candidates.json");

// ── env (same manual loader as the other generators) ──
const envPath = join(ROOT, ".env");
const envVars = Object.fromEntries(
  readFileSync(envPath, "utf8")
    .split("\n")
    .filter((l) => l.includes("=") && !l.startsWith("#"))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
    })
);
const API_KEY = envVars.ELEVENLABS_API_KEY || process.env.ELEVENLABS_API_KEY;
if (!API_KEY) {
  console.error("Missing ELEVENLABS_API_KEY in .env");
  process.exit(1);
}

// ── the keys we generate, and how. `duration` null = let the model decide. ──
// `prompt` aims for an isolated retro game SFX, no music bed, no voice.
const SPECS = {
  levelClear: {
    duration: null, // ~3s, model-decided — length is load-bearing for the feel
    prompt:
      "Triumphant ascending chiptune fanfare, 8-bit video game level complete jingle, " +
      "celebratory and bright, like an OSRS quest complete or a Mario stage clear. " +
      "Square wave melody, no voice, no music bed, isolated sound effect.",
  },
  gameOver: {
    duration: null, // ~2s, model-decided
    prompt:
      "Slow descending minor chiptune phrase, sad 8-bit game over jingle, like a Pokemon " +
      "blackout. Gentle and a little melancholy, square wave, no voice, no music bed, " +
      "isolated sound effect.",
  },
  applause: {
    duration: 2, // pinned short to stay tight and punchy
    prompt:
      "Short upbeat retro video game crowd cheering and applause, 8-bit flavored, " +
      "celebratory burst, no voice, no music, isolated sound effect.",
  },
  streak: {
    duration: 1, // pinned short
    prompt:
      "Fast ascending chiptune arpeggio, energetic 8-bit combo or bonus jingle, bright and " +
      "quick, square wave, no voice, no music bed, isolated sound effect.",
  },
};

// ── args ──
const arg = (flag) => {
  const i = process.argv.indexOf(flag);
  return i !== -1 ? process.argv[i + 1] : null;
};
const count = Number(arg("--count") || 3);
const onlyArg = arg("--only");
const redoArg = arg("--redo");
const only = onlyArg ? onlyArg.split(",").map((s) => s.trim()) : null;

let keys = Object.keys(SPECS);
if (only) keys = keys.filter((k) => only.includes(k));
if (redoArg) keys = redoArg.split(",").map((s) => s.trim());

const unknown = keys.filter((k) => !SPECS[k]);
if (unknown.length) {
  console.error(`Unknown key(s): ${unknown.join(", ")}. Known: ${Object.keys(SPECS).join(", ")}`);
  process.exit(1);
}

mkdirSync(CAND_DIR, { recursive: true });

// ── index of every candidate we know about (committed for resumability) ──
const index = existsSync(INDEX_PATH) ? JSON.parse(readFileSync(INDEX_PATH, "utf8")) : {};

async function generateOne(key, n) {
  const dir = join(CAND_DIR, key);
  mkdirSync(dir, { recursive: true });
  const file = `${key}-${n}.mp3`;
  const outPath = join(dir, file);
  if (existsSync(outPath)) return "skip";

  const spec = SPECS[key];
  const body = { text: spec.prompt, prompt_influence: 0.45 };
  if (spec.duration != null) body.duration_seconds = spec.duration;

  const res = await fetch("https://api.elevenlabs.io/v1/sound-generation", {
    method: "POST",
    headers: { "xi-api-key": API_KEY, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    console.error(`  ERROR ${key} #${n}: ${res.status} ${await res.text()}`);
    return "error";
  }
  writeFileSync(outPath, Buffer.from(await res.arrayBuffer()));
  return "wrote";
}

let wrote = 0;
for (const key of keys) {
  if (redoArg) index[key] = []; // wipe the index entry; old files are overwritten by name
  const existing = index[key] || [];
  console.log(`${key}: have ${existing.length}, want ${count}`);
  for (let n = 1; n <= count; n++) {
    const r = await generateOne(key, n);
    const rel = `sfx-candidates/${key}/${key}-${n}.mp3`;
    if (r === "wrote") {
      wrote++;
      if (!existing.includes(rel)) existing.push(rel);
      console.log(`  wrote ${rel}`);
    } else if (r === "skip") {
      if (!existing.includes(rel)) existing.push(rel);
    }
  }
  index[key] = existing.sort();
}

writeFileSync(INDEX_PATH, JSON.stringify(index, null, 2) + "\n");
console.log(`\nDone. ${wrote} new clip(s). Index: ${INDEX_PATH}`);
console.log(`Next: node tools/scripts/sfx/sfx-review-server.mjs  → approve one per key`);
