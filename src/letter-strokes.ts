// Stroke-based (centerline) capital letters A–Z, designed for writing animation.
// Each letter is an ordered array of SVG path `d` strings — one per pen stroke, in
// D'Nealian-style print order, drawn top→bottom / left→right (O/Q circles go CCW).
// Authored on a 0 0 100 100 viewBox; render with fill="none", stroke-width≈11,
// round caps/joins, and pathLength="1" if you want to drive a dash-draw animation.
// Source of truth for the <StrokeLetter> component and the ABC Order game grid.

export const letterStrokes: Record<string, string[]> = {
  A: ["M 50,8 L 23,91", "M 50,8 L 77,91", "M 35,62 L 65,62"],
  B: ["M 29,8 L 29,91", "M 29,8 C 52,7 68,10 68,25 C 68,40 52,47 29,47", "M 29,47 C 53,47 70,52 70,69 C 70,86 53,91 29,91"],
  C: ["M 70,28 A 24.5,39 0 1 0 70,72"],
  D: ["M 28,8 L 28,91", "M 28,8 C 52,8 72,19 72,49.5 C 72,80 52,91 28,91"],
  E: ["M 28,8 L 28,91", "M 28,8 L 73,8", "M 28,50 L 63,50", "M 28,91 L 73,91"],
  F: ["M 28,8 L 28,91", "M 28,8 L 73,8", "M 28,50 L 63,50"],
  G: ["M 70,28 A 24.5,39 0 1 0 74,51", "M 74,51 L 53,51"],
  H: ["M 26,8 L 26,91", "M 74,8 L 74,91", "M 26,48 L 74,48"],
  I: ["M 50,11 L 50,89", "M 30,11 L 70,11", "M 30,89 L 70,89"],
  J: ["M 38,11 L 82,11", "M 61,11 L 61,62 C 61,82 48,88 36,84 C 27,81 22,74 22,67"],
  K: ["M 26,8 L 26,91", "M 73,8 L 30,50", "M 30,50 L 74,91"],
  L: ["M 28,8 L 28,91", "M 28,91 L 73,91"],
  M: ["M 17,10 L 17,91", "M 17,10 L 50,74", "M 50,74 L 83,10", "M 83,10 L 83,91"],
  N: ["M 26,9 L 26,91", "M 26,9 L 74,91", "M 74,9 L 74,91"],
  O: ["M 50,11 A 26,39 0 0 0 50,89 A 26,39 0 0 0 50,11"],
  P: ["M 30,8 L 30,91", "M 30,8 C 54,7 70,12 70,30 C 70,48 54,51 30,51"],
  Q: ["M 50,11 A 26,39 0 0 0 50,89 A 26,39 0 0 0 50,11", "M 60,63 L 78,90"],
  R: ["M 30,8 L 30,91", "M 30,8 C 54,7 70,12 70,30 C 70,48 54,51 30,51", "M 44,51 L 72,91"],
  S: ["M 68,31 C 65,19 53,14 43,16 C 31,18 27,30 35,38 C 42,45 57,48 64,56 C 72,65 69,80 57,84 C 45,88 33,83 31,71"],
  T: ["M 22,11 L 78,11", "M 50,11 L 50,91"],
  U: ["M 28,8 L 28,58 C 28,78 38,89 50,89 C 62,89 72,78 72,58 L 72,8"],
  V: ["M 22,10 L 50,86", "M 78,10 L 50,86"],
  W: ["M 10,10 L 31,86 L 50,10 L 69,86 L 90,10"],
  X: ["M 29,8 L 71,91", "M 71,8 L 29,91"],
  Y: ["M 27,8 L 50,52", "M 73,8 L 50,52", "M 50,52 L 50,91"],
  Z: ["M 27,11 L 73,11", "M 73,11 L 27,91", "M 27,91 L 73,91"],
};
