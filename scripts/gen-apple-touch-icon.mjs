// Generates public/apple-touch-icon.png (180x180) from the vector favicon.
// iOS shows black behind transparency, so the logo is flattened onto the
// site's warm background (#fffbf0) with a little padding. Re-run after the
// logo changes: `node scripts/gen-apple-touch-icon.mjs`.
import sharp from 'sharp';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SIZE = 180;   // Apple touch icon target
const INNER = 144;  // logo area, leaves ~20% padding all around
const BG = '#fffbf0';

const svg = readFileSync(resolve(root, 'public/favicon.svg'));

const logo = await sharp(svg, { density: 384 })
  .resize(INNER, INNER, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
  .png()
  .toBuffer();

await sharp({
  create: { width: SIZE, height: SIZE, channels: 4, background: BG },
})
  .composite([{ input: logo, gravity: 'center' }])
  .png()
  .toFile(resolve(root, 'public/apple-touch-icon.png'));

console.log('Wrote public/apple-touch-icon.png (180x180)');
