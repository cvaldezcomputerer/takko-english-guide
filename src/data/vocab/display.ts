import type { VocabWord } from "./words";
import { imageFor } from "./words";

/**
 * Resolves how a vocab word should be shown in the dictionary. Most words use a
 * real photo/illustration (`image`), but a few categories render in the UI with
 * no image file (see tools/data/vocab-image-todo.md, "Route C"):
 *   - Colors  → a solid colour swatch
 *   - Shapes  → a simple outlined SVG
 *   - Months  → Japanese text (一月, 二月 …)
 *   - Dates   → the English ordinal (1st, 2nd …)
 *   - Days    → Japanese text (日曜日 …)
 * Anything still without an asset falls back to a letter monogram placeholder.
 */
export type VocabVisual =
  | { kind: "image"; src: string }
  | { kind: "color"; hex: string }
  | { kind: "shape"; svg: string }
  | { kind: "text"; text: string }
  | { kind: "monogram"; letter: string };

const COLOR_HEX: Record<string, string> = {
  white: "#ffffff",
  red: "#e23b35",
  orange: "#f3852b",
  yellow: "#f7cf2e",
  green: "#3fa34d",
  pink: "#f06ea9",
  purple: "#8e44ad",
  brown: "#8b5a2b",
  black: "#1f1f1f",
  blue: "#2272d6",
  "light blue": "#5bc0eb",
  "yellow green": "#9acd32",
  gold: "#d4af37",
  silver: "#c2c2c2",
};

const MONTH_EN = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const MONTH_KANJI = [
  "一月", "二月", "三月", "四月", "五月", "六月",
  "七月", "八月", "九月", "十月", "十一月", "十二月",
];

const DAY_KANJI: Record<string, string> = {
  Sunday: "日曜日",
  Monday: "月曜日",
  Tuesday: "火曜日",
  Wednesday: "水曜日",
  Thursday: "木曜日",
  Friday: "金曜日",
  Saturday: "土曜日",
  "one week": "一週間",
};

// Outlined shape SVG: coloured stroke + faint matching fill, on a 0–100 box.
const shape = (color: string, inner: string) =>
  `<svg viewBox="0 0 100 100" role="img" aria-hidden="true" fill="${color}" fill-opacity="0.14" ` +
  `stroke="${color}" stroke-width="7" stroke-linejoin="round" stroke-linecap="round">${inner}</svg>`;

const SHAPE_SVG: Record<string, string> = {
  circle: shape("#2272d6", `<circle cx="50" cy="50" r="33"/>`),
  square: shape("#e0852b", `<rect x="20" y="20" width="60" height="60" rx="6"/>`),
  rectangle: shape("#3fa34d", `<rect x="12" y="28" width="76" height="44" rx="6"/>`),
  triangle: shape("#d94b3e", `<polygon points="50,16 84,82 16,82"/>`),
  diamond: shape("#8e44ad", `<polygon points="50,12 84,50 50,88 16,50"/>`),
  star: shape("#e0a52b", `<polygon points="50,8 61,38 93,38 67,58 77,90 50,71 23,90 33,58 7,38 39,38"/>`),
  heart: shape("#ef5da0", `<path d="M50 82 C18 58 14 38 28 27 C40 18 50 28 50 35 C50 28 60 18 72 27 C86 38 82 58 50 82 Z"/>`),
  cross: shape("#1f9e8f", `<polygon points="38,14 62,14 62,38 86,38 86,62 62,62 62,86 38,86 38,62 14,62 14,38 38,38"/>`),
};

export function visualFor(categoryName: string, word: VocabWord): VocabVisual {
  // Category-specific UI renders take priority over a photo. (Notably "orange"
  // the colour must beat "orange" the fruit, which shares the manifest key.)
  switch (categoryName) {
    case "Colors": {
      const hex = COLOR_HEX[word.en];
      if (hex) return { kind: "color", hex };
      break;
    }
    case "Shapes": {
      const svg = SHAPE_SVG[word.en];
      if (svg) return { kind: "shape", svg };
      break;
    }
    case "Months": {
      if (word.en === "one year") return { kind: "text", text: "一年" };
      const i = MONTH_EN.indexOf(word.en);
      if (i >= 0) return { kind: "text", text: MONTH_KANJI[i] };
      break;
    }
    case "Dates":
      return { kind: "text", text: word.en };
    case "Days": {
      const kanji = DAY_KANJI[word.en];
      if (kanji) return { kind: "text", text: kanji };
      break;
    }
  }

  const img = imageFor(word);
  if (img) return { kind: "image", src: img };
  return { kind: "monogram", letter: (word.en[0] || "?").toUpperCase() };
}
