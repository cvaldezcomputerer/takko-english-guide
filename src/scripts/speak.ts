// Site-wide "Mii voice".
//
// Anywhere the site reads English aloud with the browser's built-in speech (the
// placeholder used until a real recording exists), route it through speakMii so
// it comes out pitched-up and brisk like a Tomodachi-style Mii. A fresh random
// voice + pitch is chosen each call, so it feels like a different little Mii is
// talking every time.
//
// Note: only *local* voices reliably honour pitch/rate (Chrome's remote "Google"
// voices often ignore them), so we prefer local English voices.

let voices: SpeechSynthesisVoice[] = [];

function loadVoices(): void {
    if (!('speechSynthesis' in window)) return;
    voices = window.speechSynthesis.getVoices();
}

if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    loadVoices();
    // The list is populated asynchronously on first load in most browsers.
    window.speechSynthesis.addEventListener('voiceschanged', loadVoices);
}

// Voices (macOS / iOS / common desktop) that take the high-pitch Mii treatment
// nicely. We rotate through whichever of these are actually installed; if none
// are, we fall back to any local English voice.
const PREFERRED = [
    /samantha/i, /karen/i, /moira/i, /tessa/i, /victoria/i,
    /fiona/i, /serena/i, /allison/i, /ava/i, /susan/i, /daniel/i,
];

function miiVoicePool(): SpeechSynthesisVoice[] {
    const english = voices.filter((v) => /^en[-_]?/i.test(v.lang));
    const base = english.length ? english : voices;
    const local = base.filter((v) => v.localService);
    const pool = local.length ? local : base;
    const preferred = pool.filter((v) => PREFERRED.some((re) => re.test(v.name)));
    return preferred.length ? preferred : pool;
}

const rand = (min: number, max: number) => min + Math.random() * (max - min);
const pick = <T>(arr: T[]): T | undefined => arr[Math.floor(Math.random() * arr.length)];

// ── Mii-voice toggle ──────────────────────────────────────────────────────
// The navbar button writes this localStorage key ('on' | absent). Off by
// default: the "normal" voice is the recorded ElevenLabs clip; flipping it on
// swaps the read-aloud over to the Mii voice. Keep this key string in sync with
// the inline toggle script in Navbar.astro (it can't import this module).
export const MII_KEY = 'mii-voice';

export function isMiiVoiceOn(): boolean {
    try { return localStorage.getItem(MII_KEY) === 'on'; } catch { return false; }
}

/**
 * Plain browser voice — the fallback used in "normal" mode when a recording is
 * missing. No Mii pitch; just a clear, slightly slow read.
 */
export function speakPlain(text: string | undefined | null): boolean {
    if (!text || !('speechSynthesis' in window)) return false;
    const synth = window.speechSynthesis;
    synth.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'en-US';
    u.rate = 0.9;
    synth.speak(u);
    return true;
}

export interface MiiOpts {
    /** 0–2, default randomized ~1.5–2.0 (the "Mii knob"). */
    pitch?: number;
    /** speaking speed, default randomized ~1.1–1.35. */
    rate?: number;
    /** force a specific voice by (partial) name, e.g. "Samantha". */
    voiceName?: string;
}

/**
 * Speak `text` in a Mii voice. Returns false (and does nothing) when there's no
 * text or the browser can't speak — callers can use that to show a fallback note.
 */
export function speakMii(text: string | undefined | null, opts: MiiOpts = {}): boolean {
    if (!text || !('speechSynthesis' in window)) return false;

    const synth = window.speechSynthesis;
    synth.cancel(); // never let utterances pile up / overlap
    if (!voices.length) loadVoices(); // in case voiceschanged hasn't fired yet

    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'en-US';
    u.pitch = opts.pitch ?? rand(1.5, 2);   // high + a little random = a new Mii each time
    u.rate = opts.rate ?? rand(1.1, 1.35);

    const pool = miiVoicePool();
    const voice = opts.voiceName
        ? pool.find((v) => v.name.toLowerCase().includes(opts.voiceName!.toLowerCase())) ?? pick(pool)
        : pick(pool);
    if (voice) u.voice = voice;

    synth.speak(u);
    return true;
}

// ── Shared audio playback (used by every read-aloud tool) ─────────────────────

/**
 * Play one clip, resolving when it finishes. Resolves `false` if the file is
 * missing / can't play, so sequences can fall back to a spoken sentence.
 */
export function playClip(src: string): Promise<boolean> {
    return new Promise((resolve) => {
        const a = new Audio(src);
        a.addEventListener('ended', () => resolve(true), { once: true });
        a.addEventListener('error', () => resolve(false), { once: true });
        a.play().catch(() => resolve(false));
    });
}

/**
 * Read a card/button aloud, honouring the Mii toggle: on → Mii voice; off →
 * its `data-audio` recording, with a plain spoken `data-say` if that's missing.
 * `onUnavailable` fires when nothing could be spoken (e.g. no speech support).
 */
export function playFromEl(el: HTMLElement, onUnavailable?: () => void): void {
    const say = el.dataset.say;
    if (isMiiVoiceOn()) {
        if (!speakMii(say)) onUnavailable?.();
        return;
    }
    const fallback = () => { if (!speakPlain(say)) onUnavailable?.(); };
    const src = el.dataset.audio;
    if (!src) { fallback(); return; }
    const a = new Audio(src);
    let handled = false;
    const onceFallback = () => { if (!handled) { handled = true; fallback(); } };
    a.addEventListener('error', onceFallback, { once: true });
    a.play().catch(onceFallback);
}
