/**
 * Shared helpers for the image tools (vocab pipeline + general find-image).
 * Stock sources: Pexels & Pixabay (free, real photos, no attribution required).
 */

import { readFileSync, existsSync, mkdirSync } from "fs";
import { dirname, extname } from "path";
import sharp from "sharp";

/** Read keys from .env (manual loader — same convention as generate-audio.mjs). */
export function loadKeys(root) {
  const path = `${root}/.env`;
  const env = existsSync(path)
    ? Object.fromEntries(
        readFileSync(path, "utf8")
          .split("\n")
          .filter((l) => l.includes("=") && !l.startsWith("#"))
          .map((l) => {
            const i = l.indexOf("=");
            return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
          })
      )
    : {};
  return {
    pexels: env.PEXELS_API_KEY || process.env.PEXELS_API_KEY,
    pixabay: env.PIXABAY_API_KEY || process.env.PIXABAY_API_KEY,
    elevenlabs: env.ELEVENLABS_API_KEY || process.env.ELEVENLABS_API_KEY,
  };
}

/** Filesystem-safe slug. Shared so image + audio filenames line up. */
export const slugify = (s) =>
  s
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

/** A 429 from a source throws this so callers can drop just that source. */
export class RateLimitError extends Error {
  constructor(source) {
    super(`${source} rate-limited`);
    this.source = source;
  }
}

export async function fromPixabay(key, query, n = 4, page = 1) {
  const url = `https://pixabay.com/api/?key=${key}&q=${encodeURIComponent(
    query
  )}&image_type=photo&per_page=${n + 1}&page=${page}&safesearch=true&order=popular`;
  const res = await fetch(url);
  if (res.status === 429) throw new RateLimitError("pixabay");
  if (!res.ok) throw new Error(`pixabay ${res.status}`);
  const data = await res.json();
  return (data.hits || []).slice(0, n).map((h) => ({
    id: `pixabay-${h.id}`,
    source: "pixabay",
    thumb: h.webformatURL, // ~640px
    full: h.largeImageURL || h.webformatURL,
    page: h.pageURL,
    author: h.user,
  }));
}

export async function fromPexels(key, query, n = 4, page = 1) {
  const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=${n}&page=${page}`;
  const res = await fetch(url, { headers: { Authorization: key } });
  if (res.status === 429) throw new RateLimitError("pexels");
  if (!res.ok) throw new Error(`pexels ${res.status}`);
  const data = await res.json();
  return (data.photos || []).map((p) => ({
    id: `pexels-${p.id}`,
    source: "pexels",
    thumb: p.src.medium,
    full: p.src.original,
    page: p.url,
    author: p.photographer,
  }));
}

/**
 * Fetch candidates from whichever sources have keys and are still `enabled`.
 * On a 429 the source is flipped off in `enabled` (mutated) and the other keeps
 * going; callers can stop once both are off.
 */
export async function fetchCandidates(query, keys, enabled, perSource = 4, page = 1) {
  const out = [];
  for (const [name, fn] of [
    ["pixabay", fromPixabay],
    ["pexels", fromPexels],
  ]) {
    if (!keys[name] || !enabled[name]) continue;
    try {
      out.push(...(await fn(keys[name], query, perSource, page)));
    } catch (e) {
      if (e instanceof RateLimitError) {
        enabled[name] = false;
        console.error(`    ${name} rate-limited — dropping it for the rest of this run.`);
      } else console.error(`    ${name} failed: ${e.message}`);
    }
  }
  return out;
}

/**
 * Download an image URL and write it to `outPath`, processed with sharp.
 * Format is inferred from the output extension (.webp/.jpg/.png). When width
 * and/or height are given it resizes; with both + fit:"cover" it crops to fill.
 * With no dimensions it keeps the original size (just re-encodes/optimizes).
 */
export async function downloadImage(url, outPath, { width, height, fit = "cover", quality = 80 } = {}) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`download ${res.status}`);
  mkdirSync(dirname(outPath), { recursive: true });

  let img = sharp(Buffer.from(await res.arrayBuffer()));
  if (width || height) img = img.resize(width || null, height || null, { fit, position: "centre" });

  const ext = extname(outPath).toLowerCase();
  if (ext === ".webp") img = img.webp({ quality });
  else if (ext === ".png") img = img.png();
  else img = img.jpeg({ quality });

  await img.toFile(outPath);
}
