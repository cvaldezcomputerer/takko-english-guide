/**
 * Generates audio files via ElevenLabs TTS and saves them to public/audio/.
 * Requires ELEVENLABS_API_KEY in .env
 *
 * Usage:
 *   node tools/scripts/audio/generate-audio.mjs
 *
 * Skips files that already exist — safe to re-run.
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..", "..", "..");

// Load .env manually (no dotenv dependency needed)
const envPath = join(ROOT, ".env");
const envVars = Object.fromEntries(
  readFileSync(envPath, "utf8")
    .split("\n")
    .filter((l) => l.includes("=") && !l.startsWith("#"))
    .map((l) => l.split("=").map((s) => s.trim()))
);
const API_KEY = envVars.ELEVENLABS_API_KEY || process.env.ELEVENLABS_API_KEY;

if (!API_KEY) {
  console.error("Missing ELEVENLABS_API_KEY in .env");
  process.exit(1);
}

const VOICE_ID = "Xb7hH8MSUJpSbSDYk0k2"; // Alice - Clear, Engaging Educator
const MODEL_ID = "eleven_flash_v2_5";

/**
 * Define what to generate here.
 * Each entry: { text, out } where `out` is relative to public/audio/
 */
const CLIPS = [
  // ── Weather page ──
  { text: "How's the weather today?", out: "weather/how-is-the-weather.mp3" },
  { text: "It's",                     out: "weather/its.mp3" },
  { text: "and",                      out: "weather/and.mp3" },
  { text: "sunny.",         out: "weather/sunny.mp3" },
  { text: "partly cloudy.", out: "weather/partly_cloudy.mp3" },
  { text: "cloudy.",        out: "weather/cloudy.mp3" },
  { text: "rainy.",         out: "weather/rainy.mp3" },
  { text: "snowy.",         out: "weather/snowy.mp3" },
  { text: "windy.",         out: "weather/windy.mp3" },
  { text: "hot.",           out: "weather/hot.mp3" },
  { text: "warm.",          out: "weather/warm.mp3" },
  { text: "cool.",          out: "weather/cool.mp3" },
  { text: "cold.",          out: "weather/cold.mp3" },

  // ── Date page ──
  { text: "What's the date today?", out: "date/what-is-the-date.mp3" },
  { text: "Today is",               out: "date/today-is.mp3" },
];

// Months + days are generated programmatically. Each gets a trailing period so
// ElevenLabs gives the word a full, clear pronunciation (not a clipped one).
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
for (const name of MONTHS) {
  CLIPS.push({ text: `${name}.`, out: `date/months/${name.toLowerCase()}.mp3` });
}

const ONES = ["", "first", "second", "third", "fourth", "fifth", "sixth", "seventh", "eighth", "ninth",
  "tenth", "eleventh", "twelfth", "thirteenth", "fourteenth", "fifteenth", "sixteenth",
  "seventeenth", "eighteenth", "nineteenth", "twentieth"];
const ordinalWord = (d) => {
  if (d <= 20) return ONES[d];
  if (d === 30) return "thirtieth";
  return `${d < 30 ? "twenty" : "thirty"}-${ONES[d % 10]}`;
};
for (let d = 1; d <= 31; d++) {
  CLIPS.push({ text: `${ordinalWord(d)}.`, out: `date/days/${d}.mp3` });
}

async function generateClip(text, outRelative) {
  const outPath = join(ROOT, "public", "audio", outRelative);

  if (existsSync(outPath)) {
    console.log(`  skip  ${outRelative}`);
    return;
  }

  mkdirSync(dirname(outPath), { recursive: true });

  const res = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}?output_format=mp3_44100_128`,
    {
      method: "POST",
      headers: { "xi-api-key": API_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({
        text,
        model_id: MODEL_ID,
        voice_settings: { stability: 0.85, similarity_boost: 0.75, style: 0, speed: 0.9 },
      }),
    }
  );

  if (!res.ok) {
    console.error(`  ERROR ${outRelative}: ${res.status} ${await res.text()}`);
    return;
  }

  const buffer = Buffer.from(await res.arrayBuffer());
  writeFileSync(outPath, buffer);
  console.log(`  wrote ${outRelative}`);
}

console.log(`Generating ${CLIPS.length} clip(s)...`);
for (const { text, out } of CLIPS) {
  await generateClip(text, out);
}
console.log("Done.");
