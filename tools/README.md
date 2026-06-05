# tools/

Dev-only utilities. Not part of the site build (lives outside `src/`, never shipped).

## recorder.html — Voice Clip Recorder

A local, no-install tool for recording short voice clips straight into the repo.

**Use it:**
1. Open `tools/recorder.html` in **Chrome or Edge** (double-click, or drag into the browser).
2. Click **Choose project folder** and pick this repo's root (`dog_SITE`). You only do this once — it's remembered (and it reopens to where you left off).
3. Pick where files land by **clicking through the folder browser**:
   - Breadcrumbs at the top — click any segment to jump back up.
   - Click a folder tile to go into it; **+ New folder here** makes one.
   - Quick-jump buttons: **Go to public/audio** and **Go to voice-samples**.
   - Files save into whatever folder you're currently in.
4. Type a file name (e.g. `library`).
5. Press **Space** to start, **Space** to stop. Preview, then **Save**.

`voice-samples/` is training material for an ElevenLabs voice clone and isn't shipped with the site.

**Settings (persist automatically):**
- Mic picker, sample rate, mp3 bitrate.
- Auto-trim silence, normalize volume, auto-number names (`library` → `library-2`).
- Noise suppression / echo cancellation, trim threshold, padding, max length.

Needs internet the first time (loads the mp3 encoder from a CDN). Chrome/Edge only — the
folder-writing API isn't in Safari/Firefox.
