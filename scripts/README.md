# Content tooling (images + audio)

Scripts for giving every vocab word in [`src/data/vocab/words.ts`](../src/data/vocab/words.ts)
an associated **real photo** and **voice clip**, plus a general "find me any image" tool.
Everything is **local authoring** — it runs on your machine, writes files into the repo, and
you commit the result. Nothing here is deployed.

## Setup (do this first on a new computer)

`.env` is **not** committed. Recreate it in the repo root with:

```
ELEVENLABS_API_KEY=...   # voice clips (elevenlabs.io)
PEXELS_API_KEY=...       # photos (pexels.com/api)
PIXABAY_API_KEY=...      # photos (pixabay.com/api/docs)
```

Then `npm install` (provides `sharp`). Node 22+ (uses `--experimental-strip-types` in places).

## Vocab images — pick a real photo per word

A 3-step pipeline. Each step is resumable and skips work already done.

```bash
# 1. fetch ~8 candidates/word into scripts/image-candidates.json (committed, so it travels)
node scripts/fetch-image-candidates.mjs        # resumable; --refetch "<word>" [--query "<terms>"]

# 2. pick in the browser gallery → saves to scripts/image-selections.json (COMMITTED)
node scripts/review-server.mjs                 # http://localhost:4399

# 3. download picks → public/images/vocab/<slug>.webp + generate src/data/vocab/images.ts
node scripts/download-images.mjs
```

**Gallery keys:** `1-8` pick · `s` **reroll** (fresh images for this word; the note box guides
the search, e.g. "a bento, not a lunchbox") · `n` no image (final) · `→` skip for now · `←` back.
Reroll is live — it hits the photo APIs on demand.

## Vocab audio — one voice clip per word

```bash
node scripts/generate-vocab-audio.mjs          # all words; --only apple,sushi for a subset
# → public/audio/vocab/<slug>.mp3 + src/data/vocab/audio.ts
```

ElevenLabs Alice voice; each clip is the word + a period (clean standalone pronunciation).

## Using the assets in code

```ts
import { imageFor, audioFor } from "../data/vocab/words";
imageFor(word); // "/images/vocab/apple.webp" | undefined
audioFor(word); // "/audio/vocab/apple.mp3"   | undefined
```

Both are backed by the generated `images.ts` / `audio.ts` manifests. Existing games don't
display these yet — the assets are a foundation for future games. Playback helpers live in
[`src/scripts/speak.ts`](../src/scripts/speak.ts) (`playClip`, Mii-voice toggle).

## find-image — get any photo, not just vocab

```bash
node scripts/find-image.mjs add "<query>"                      # fetch candidates
node scripts/find-image.mjs serve                              # pick gallery on :4400
node scripts/find-image.mjs save "<query>" --to <path> \       # download your pick
     [--width N] [--height N] [--fit cover|contain]
```

Output format is inferred from the `--to` extension. Path may be absolute or repo-relative.

## Adding more words later

Add entries to `words.ts`, then re-run the steps above — each only touches new/missing words.

## Layout & internals

- `scripts/lib/images.mjs` — **the** shared core: API key loader, slugify, Pexels/Pixabay
  fetchers (page support; drop a source on HTTP 429), `downloadImage()` (sharp). Edit sources here.
- `review-server.mjs` is env-parameterized (`CANDIDATES_PATH`/`SELECTIONS_PATH`/`PORT`) so the
  same gallery serves both vocab review (:4399) and find-image (:4400). Avoids `astro dev` (:4321).
- Committed: `image-candidates.json` (so picking resumes on any machine) and
  `image-selections.json` (your picks). Gitignored scratch: `scripts/.find-image/`.
- `slugify` is shared so a word's image and audio filenames line up.
