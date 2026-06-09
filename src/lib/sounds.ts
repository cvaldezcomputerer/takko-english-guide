// Procedural retro sound effects for the classroom quiz game.
//
// Every sound is synthesised on the fly with the Web Audio API — no audio
// files, no network, no dependencies. The vibe is chiptune-adjacent with a
// little warmth: square waves for most blips (Pokemon Gen 1/2, OSRS), sine for
// soft chimes, sawtooth for buzzes, and white noise for the crowd cheer.
//
// Usage:
//     import { sounds } from '../lib/sounds';
//     sounds.correct();
//     sounds.mute();  // e.g. wire to a classroom "quiet" toggle
//
// The AudioContext is created lazily on the first call so it starts inside a
// user gesture (browsers suspend contexts created before any interaction).
//
// A few sounds (see ASSET_KEYS) sound better as real recordings than as
// synthesis — those are generated with the ElevenLabs Sound Effects API and
// approved via the tools/ pipeline (see tools/README.md). When an approved
// clip exists in src/data/sfx.ts the clip is played; otherwise the procedural
// fallback defined here is used, so the game always has sound even with no
// clips approved yet.

import { sfxAssets } from '../data/sfx';

// --- master state -----------------------------------------------------------

let ctx: AudioContext | null = null;
let master = 0.3; // default classroom-friendly volume multiplier
let muted = false;

function ac(): AudioContext {
    if (!ctx) {
        const Ctor =
            window.AudioContext ||
            (window as unknown as { webkitAudioContext: typeof AudioContext })
                .webkitAudioContext;
        ctx = new Ctor();
    }
    // A context can drift into "suspended" (autoplay policy, tab backgrounding);
    // nudge it awake on each use. resume() is a no-op when already running.
    if (ctx.state === 'suspended') void ctx.resume();
    return ctx;
}

// --- low-level voices -------------------------------------------------------

type Wave = OscillatorType;

// One enveloped oscillator note. `t` is an absolute start time on the audio
// clock; returns when the note ends so callers can chain notes.
function tone(
    freq: number,
    t: number,
    dur: number,
    {
        type = 'square',
        gain = 0.5,
        attack = 0.005,
        release = dur * 0.4,
        endFreq,
    }: {
        type?: Wave;
        gain?: number;
        attack?: number;
        release?: number;
        endFreq?: number; // if set, glide pitch from `freq` -> `endFreq`
    } = {},
): number {
    const c = ac();
    const osc = c.createOscillator();
    const g = c.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    if (endFreq !== undefined) {
        osc.frequency.exponentialRampToValueAtTime(Math.max(1, endFreq), t + dur);
    }

    const peak = Math.max(0.0001, gain * master);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(peak, t + attack);
    // Hold the peak, then exponential-fade over the release window — a shorter
    // release than `dur` gives a snappier, more percussive tail.
    const decayStart = Math.max(t + attack, t + dur - release);
    g.gain.setValueAtTime(peak, decayStart);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);

    osc.connect(g).connect(c.destination);
    osc.start(t);
    osc.stop(t + dur + 0.02);
    return t + dur;
}

// Shared white-noise buffer for percussive / crowd sounds.
let noiseBuf: AudioBuffer | null = null;
function noiseBuffer(): AudioBuffer {
    const c = ac();
    if (!noiseBuf) {
        const len = Math.floor(c.sampleRate * 1.5);
        noiseBuf = c.createBuffer(1, len, c.sampleRate);
        const data = noiseBuf.getChannelData(0);
        for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    }
    return noiseBuf;
}

// A burst of band-passed noise — used for applause and percussive accents.
function noise(
    t: number,
    dur: number,
    {
        gain = 0.5,
        attack = 0.01,
        type = 'bandpass',
        freq = 1200,
        q = 0.7,
    }: {
        gain?: number;
        attack?: number;
        type?: BiquadFilterType;
        freq?: number;
        q?: number;
    } = {},
): number {
    const c = ac();
    const src = c.createBufferSource();
    src.buffer = noiseBuffer();

    const filter = c.createBiquadFilter();
    filter.type = type;
    filter.frequency.setValueAtTime(freq, t);
    filter.Q.value = q;

    const g = c.createGain();
    const peak = Math.max(0.0001, gain * master);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(peak, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);

    src.connect(filter).connect(g).connect(c.destination);
    src.start(t);
    src.stop(t + dur + 0.02);
    return t + dur;
}

// --- approved ElevenLabs clips ----------------------------------------------

// Decoded clip buffers, keyed by sound key. A `null` value means "currently
// loading or failed" so we don't kick off duplicate fetches.
const clips = new Map<string, AudioBuffer | null>();

// Fetch + decode an approved clip into the cache (idempotent).
function loadClip(key: string): void {
    const path = sfxAssets[key];
    if (!path || clips.has(key)) return;
    clips.set(key, null);
    fetch(path)
        .then((r) => r.arrayBuffer())
        .then((b) => ac().decodeAudioData(b))
        .then((buf) => clips.set(key, buf))
        .catch(() => clips.delete(key)); // drop so a later call can retry
}

// Play an approved clip if it's decoded and ready. Returns false if there's no
// approved clip or it hasn't finished loading — caller then plays the fallback.
function playClip(key: string): boolean {
    if (!sfxAssets[key]) return false;
    const buf = clips.get(key);
    if (!buf) {
        loadClip(key); // warm the cache for next time
        return false;
    }
    const c = ac();
    const src = c.createBufferSource();
    const g = c.createGain();
    src.buffer = buf;
    g.gain.value = master;
    src.connect(g).connect(c.destination);
    src.start();
    return true;
}

// `now()` with a tiny lead so the first envelope ramp isn't clipped.
function now(): number {
    return ac().currentTime + 0.001;
}

// Guard so muted calls skip all synthesis entirely.
function play(fn: (t: number) => void): void {
    if (muted) return;
    fn(now());
}

// Note frequencies we lean on (equal temperament, A4 = 440).
const N = {
    C4: 261.63, E4: 329.63, G4: 392.0, A4: 440.0,
    C5: 523.25, D5: 587.33, E5: 659.25, G5: 783.99, A5: 880.0,
    C6: 1046.5, E6: 1318.51, G6: 1567.98,
    // minor-flavoured set for the sad cues
    A3: 220.0, E3: 164.81, C4m: 261.63, A2: 110.0,
} as const;

// --- the sounds -------------------------------------------------------------

const lib = {
    // Bright ascending ding — Pokemon item get / OSRS level-up chime.
    correct(): void {
        play((t) => {
            tone(N.E5, t, 0.09, { gain: 0.5 });
            tone(N.G5, t + 0.08, 0.09, { gain: 0.5 });
            tone(N.C6, t + 0.16, 0.22, { gain: 0.55, release: 0.18 });
        });
    },

    // Low descending buzz — OSRS death thud / Zelda bonk.
    wrong(): void {
        play((t) => {
            tone(220, t, 0.28, { type: 'sawtooth', gain: 0.45, endFreq: 90 });
            tone(110, t, 0.3, { type: 'square', gain: 0.25, endFreq: 55 });
        });
    },

    // Quick ascending arpeggio — Pokemon evolution jingle snippet.
    streak(): void {
        play((t) => {
            const steps = [N.C5, N.E5, N.G5, N.C6, N.E6];
            steps.forEach((f, i) =>
                tone(f, t + i * 0.06, 0.1, { gain: 0.45, release: 0.07 }),
            );
        });
    },

    // Short quiet tick — OSRS clock / Zelda low-health beep.
    timerTick(): void {
        play((t) => tone(N.A5, t, 0.04, { gain: 0.18, release: 0.03 }));
    },

    // Descending sweep, slightly sad — Pokemon faint.
    timeUp(): void {
        play((t) => {
            tone(N.G5, t, 0.6, { type: 'square', gain: 0.4, endFreq: N.C4 });
            tone(N.E5, t + 0.05, 0.55, { type: 'sine', gain: 0.2, endFreq: N.A3 });
        });
    },

    // Short triumphant fanfare — OSRS quest complete / Mario stage clear.
    levelClear(): void {
        play((t) => {
            tone(N.G4, t, 0.12, { gain: 0.45 });
            tone(N.C5, t + 0.11, 0.12, { gain: 0.45 });
            tone(N.E5, t + 0.22, 0.12, { gain: 0.45 });
            tone(N.G5, t + 0.33, 0.14, { gain: 0.5 });
            tone(N.E5, t + 0.47, 0.1, { gain: 0.4 });
            tone(N.G5, t + 0.57, 0.4, { gain: 0.55, release: 0.32 });
            // Octave sparkle on the final note.
            tone(N.G6, t + 0.57, 0.4, { type: 'sine', gain: 0.18, release: 0.32 });
        });
    },

    // Slow descending minor phrase — Pokemon blackout jingle.
    gameOver(): void {
        play((t) => {
            tone(N.A4, t, 0.22, { gain: 0.4 });
            tone(N.G4, t + 0.22, 0.22, { gain: 0.4 });
            tone(N.E4, t + 0.44, 0.22, { gain: 0.4 });
            tone(N.A3, t + 0.66, 0.55, { gain: 0.45, release: 0.45 });
            tone(N.A2, t + 0.66, 0.55, { type: 'sine', gain: 0.2, release: 0.45 });
        });
    },

    // Very short soft tap — OSRS wooden UI click.
    buttonClick(): void {
        play((t) => tone(420, t, 0.035, { gain: 0.25, release: 0.025, endFreq: 320 }));
    },

    // Quick upward whoosh — Pokemon menu open.
    menuOpen(): void {
        play((t) => tone(300, t, 0.12, { type: 'square', gain: 0.3, endFreq: 900 }));
    },

    // Quick downward whoosh — Pokemon menu close.
    menuClose(): void {
        play((t) => tone(900, t, 0.12, { type: 'square', gain: 0.3, endFreq: 300 }));
    },

    // Subtle tick, distinct from buttonClick — OSRS inventory select.
    itemSelect(): void {
        play((t) => tone(680, t, 0.045, { type: 'square', gain: 0.22, release: 0.03 }));
    },

    // Gentle two-tone chime — Pokemon save sound.
    notification(): void {
        play((t) => {
            tone(N.E5, t, 0.16, { type: 'sine', gain: 0.35, release: 0.12 });
            tone(N.A5, t + 0.14, 0.28, { type: 'sine', gain: 0.35, release: 0.22 });
        });
    },

    // Single sharp mid-range beep — meant to be called once per second.
    countdown(): void {
        play((t) => tone(N.A4, t, 0.12, { gain: 0.4, release: 0.08 }));
    },

    // Short burst of filtered noise shaped like a cheer — OSRS fanfare crowd.
    applause(): void {
        play((t) => {
            // Swelling band of noise = the crowd body.
            const c = ac();
            const src = c.createBufferSource();
            src.buffer = noiseBuffer();
            const filter = c.createBiquadFilter();
            filter.type = 'bandpass';
            filter.frequency.setValueAtTime(900, t);
            filter.frequency.linearRampToValueAtTime(1600, t + 0.9);
            filter.Q.value = 0.6;
            const g = c.createGain();
            const peak = Math.max(0.0001, 0.4 * master);
            g.gain.setValueAtTime(0.0001, t);
            g.gain.linearRampToValueAtTime(peak, t + 0.15);
            g.gain.linearRampToValueAtTime(peak * 0.8, t + 0.7);
            g.gain.exponentialRampToValueAtTime(0.0001, t + 1.3);
            src.connect(filter).connect(g).connect(c.destination);
            src.start(t);
            src.stop(t + 1.35);
            // Scattered clap transients ride on top for texture.
            for (let i = 0; i < 14; i++) {
                const ct = t + 0.05 + Math.random() * 1.0;
                noise(ct, 0.05, { gain: 0.12, freq: 1800 + Math.random() * 1200, q: 1.2 });
            }
        });
    },

    // Rising sweep + short tail — Pokemon card reveal / OSRS chest open.
    reveal(): void {
        play((t) => {
            tone(200, t, 0.5, { type: 'square', gain: 0.35, endFreq: 1400 });
            tone(N.C6, t + 0.5, 0.25, { type: 'sine', gain: 0.4, release: 0.2 });
            tone(N.E6, t + 0.55, 0.22, { type: 'sine', gain: 0.25, release: 0.18 });
        });
    },

    // Harsh short buzz — Zelda error.
    error(): void {
        play((t) => {
            tone(150, t, 0.18, { type: 'sawtooth', gain: 0.4 });
            tone(155, t, 0.18, { type: 'square', gain: 0.25 }); // slight detune = grit
        });
    },
};

// --- controls + exports -----------------------------------------------------

export type SoundKey = keyof typeof lib;

export const SOUND_KEYS = Object.keys(lib) as SoundKey[];

// Keys that prefer an approved ElevenLabs recording over synthesis. These are
// the ones whose feel is hard to nail procedurally (crowd cheer, multi-bar
// fanfares). Must match the keys the SFX generation script knows about.
export const ASSET_KEYS: SoundKey[] = ['levelClear', 'gameOver', 'applause', 'streak'];

const isAssetKey = new Set<string>(ASSET_KEYS);

// Public callables: asset-backed keys try the approved clip first and fall back
// to the procedural version; everything else is purely procedural.
const callable = {} as Record<SoundKey, () => void>;
for (const key of SOUND_KEYS) {
    const proc = lib[key];
    callable[key] = isAssetKey.has(key)
        ? () => {
              if (muted) return;
              if (playClip(key)) return;
              proc();
          }
        : proc;
}

export const sounds = {
    ...callable,

    mute(): void {
        muted = true;
    },
    unmute(): void {
        muted = false;
    },
    isMuted(): boolean {
        return muted;
    },

    // Set the master volume multiplier (0..1). Default 0.3.
    setVolume(v: number): void {
        master = Math.min(1, Math.max(0, v));
    },
    getVolume(): number {
        return master;
    },

    // Whether an approved ElevenLabs clip exists for a key (vs. procedural).
    hasClip(key: SoundKey): boolean {
        return Boolean(sfxAssets[key]);
    },

    // Decode all approved clips up front (e.g. call once at game start so the
    // first play uses the real recording instead of the procedural fallback).
    preload(): void {
        for (const key of ASSET_KEYS) loadClip(key);
    },

    // Play a sound by key — handy for building a UI toggle/preview list.
    preview(key: SoundKey): void {
        callable[key]?.();
    },
};

export default sounds;
