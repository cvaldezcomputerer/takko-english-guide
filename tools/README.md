# tools/

Dev-only tooling. Everything here runs on **your machine**, writes files into the
repo, and you commit the result — none of it is part of the site build or shipped
to users. Layout:

```
tools/
  recorder.html          browser tool: record voice clips into the repo
  lib/images.mjs         shared core for the image scripts
  data/                  pipeline data (committed) + scratch (gitignored)
  scripts/
    images/              vocab photos + the general find-image tool
    audio/               ElevenLabs voice clips
    sfx/                 game sound-effect clips (ElevenLabs)
    media/               image optimisation / conversion helpers
```

## Setup (do this first on a new computer)

`.env` is **not** committed. Recreate it in the repo root with:

```
ELEVENLABS_API_KEY=...   # voice + sfx clips (elevenlabs.io)
PEXELS_API_KEY=...       # photos (pexels.com/api)
PIXABAY_API_KEY=...      # photos (pixabay.com/api/docs)
```

Then `npm install` (provides `sharp`). Node 22+.

---

## recorder.html — voice clip recorder

A local, no-install browser tool for recording short voice clips straight into the repo.

1. Open `tools/recorder.html` in **Chrome or Edge** (double-click, or drag into the browser).
2. Click **Choose project folder** and pick this repo's root (`dog_SITE`). One-time; remembered.
3. Click through the folder browser to choose where files land (breadcrumbs, **+ New folder
   here**, quick-jumps to `public/audio` and `voice-samples`).
4. Type a file name (e.g. `library`).
5. Press **Space** to start, **Space** to stop. Preview, then **Save**.

`voice-samples/` is training material for an ElevenLabs voice clone and isn't shipped.
Settings (mic, sample rate, bitrate, auto-trim/normalize/number, noise suppression…) persist
automatically. Needs internet the first time (loads the mp3 encoder from a CDN). Chrome/Edge
only — the folder-writing API isn't in Safari/Firefox.

---

## Vocab images — pick a real photo per word

> **Shorthand:** when the project owner says "get pictures with the API" (or "the image
> API"), it means **this** `tools/` workflow — the 3-step pipeline below
> (`fetch-image-candidates` → `review-server` → `download-images`), not any other service.

Gives every vocab word in [`src/data/vocab/words.ts`](../src/data/vocab/words.ts) a real
photo. A 3-step pipeline; each step is resumable and skips work already done.

```bash
# 1. fetch ~8 candidates/word into tools/data/image-candidates.json (committed, so it travels)
node tools/scripts/images/fetch-image-candidates.mjs   # resumable; --refetch "<word>" [--query "<terms>"]

# 2. pick in the browser gallery → saves to tools/data/image-selections.json (COMMITTED)
node tools/scripts/images/review-server.mjs            # http://localhost:4399

# 3. download picks → public/images/vocab/<slug>.webp + generate src/data/vocab/images.ts
node tools/scripts/images/download-images.mjs
```

**Gallery keys:** `1-8` pick · `s` **reroll** (fresh images for this word; the note box guides
the search, e.g. "a bento, not a lunchbox") · `n` no image (final) · `→` skip for now · `←` back.
Reroll is live — it hits the photo APIs on demand.

### Hand-grabbed illustrations (emotions, tastes, abstract words)

Stock photos don't work for words like "angry", "bitter", or "embarrassed". For those,
download an illustration yourself (e.g. from [Irasutoya](https://www.irasutoya.com/)) and add it:

```bash
node tools/scripts/images/add-local-image.mjs "<word>" <path-to-image> [--page <url>] [--source <name>]
# e.g. node tools/scripts/images/add-local-image.mjs "angry" ~/Downloads/okoru.png --page https://www.irasutoya.com/...
```

It mats the image onto a white 400x400 webp (`fit: contain`, so nothing is cropped),
writes `public/images/vocab/<slug>.webp`, registers it in `image-selections.json`, and
regenerates the manifest + CREDITS.json. Defaults `--source` to `irasutoya` and credits
Takashi Mifune. **Irasutoya licensing:** free + unlimited for non-commercial use (this site
earns no money); a 20-illustration cap applies only if it's ever monetized.

## Vocab audio — one voice clip per word

```bash
node tools/scripts/audio/generate-vocab-audio.mjs      # all words; --only apple,sushi for a subset
# → public/audio/vocab/<slug>.mp3 + src/data/vocab/audio.ts
```

ElevenLabs Alice voice; each clip is the word + a period (clean standalone pronunciation).
`generate-audio.mjs` is the older sibling for one-off page clips.

### Using the vocab assets in code

```ts
import { imageFor, audioFor } from "../data/vocab/words";
imageFor(word); // "/images/vocab/apple.webp" | undefined
audioFor(word); // "/audio/vocab/apple.mp3"   | undefined
```

Both are backed by the generated `images.ts` / `audio.ts` manifests. Playback helpers live in
[`src/scripts/speak.ts`](../src/scripts/speak.ts) (`playClip`, Mii-voice toggle).

## Game sound effects — approve ElevenLabs clips for a few keys

Most game sounds are synthesised procedurally in [`src/lib/sounds.ts`](../src/lib/sounds.ts)
(no files, no network). A few feel better as real recordings — `levelClear`, `gameOver`,
`applause`, `streak` — so those have an approval loop like images: generate, audition, approve.
Approved keys play the clip; everything else uses the procedural fallback automatically.

```bash
# 1. generate candidates → tools/data/sfx-candidates/<key>/ (gitignored scratch)
node tools/scripts/sfx/generate-sfx.mjs        # 3 per key; --only levelClear,streak · --count 5 · --redo applause

# 2. audition + approve one per key in the browser
node tools/scripts/sfx/sfx-review-server.mjs   # http://localhost:4401

# (no step 3 — approving finalizes in one go)
```

Approving copies the pick to `public/audio/sfx/<key>.mp3` and regenerates
[`src/data/sfx.ts`](../src/data/sfx.ts) (committed, so approvals travel).
Clearing a key deletes its clip and falls back to procedural.

**Tips from the brief:** do `levelClear` first (hardest to get right). It and `gameOver` use
model-decided length (length is load-bearing for the feel, ~200 credits); `applause`/`streak`
are pinned short to stay punchy (~40 credits/sec).

```ts
import { sounds } from '../lib/sounds';
sounds.correct();          // procedural
sounds.levelClear();       // approved clip if one exists, else procedural
sounds.preload();          // decode approved clips up front (e.g. at game start)
```

Preview every sound at the dev page `/sound-preview` (linked from `/dev`).

## find-image — get any photo, not just vocab

```bash
node tools/scripts/images/find-image.mjs add "<query>"                  # fetch candidates
node tools/scripts/images/find-image.mjs serve                          # pick gallery on :4400
node tools/scripts/images/find-image.mjs save "<query>" --to <path> \   # download your pick
     [--width N] [--height N] [--fit cover|contain]
```

Output format is inferred from the `--to` extension. Path may be absolute or repo-relative.

## media/ — image optimisation helpers

```bash
./tools/scripts/media/optimize-images.sh [public/images/...]   # ffmpeg recompress + resize
node tools/scripts/media/resize-card-thumbnails.mjs <folder>   # max 800x450 card thumbs
node tools/scripts/media/png-to-svg.mjs                        # pixel PNG → crisp SVG (logo)
```

## Adding more words later

Add entries to `words.ts`, then re-run the image/audio steps — each only touches new/missing words.

## Layout & internals

- `tools/lib/images.mjs` — **the** shared core: API key loader, slugify, Pexels/Pixabay
  fetchers (page support; drop a source on HTTP 429), `downloadImage()` (sharp). Edit sources here.
- `images/review-server.mjs` is env-parameterized (`CANDIDATES_PATH`/`SELECTIONS_PATH`/`PORT`)
  so the same gallery serves vocab review (:4399) and find-image (:4400). Ports avoid `astro dev` (:4321).
- **Committed** under `tools/data/`: `image-candidates.json` (picking resumes anywhere),
  `image-selections.json`, `sfx-selections.json`, `vocab-image-todo.md`.
- **Gitignored scratch** under `tools/data/`: `.find-image/`, `sfx-candidates/`, `sfx-candidates.json`.
- All scripts derive the repo root from their own path, so they run from anywhere.
- `slugify` is shared so a word's image and audio filenames line up.
