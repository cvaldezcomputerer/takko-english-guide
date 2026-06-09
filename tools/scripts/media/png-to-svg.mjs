import sharp from 'sharp';
import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const inPath = join(ROOT, 'public/images/logo-pixel.png');
const outPath = join(ROOT, 'public/images/logo-pixel.svg');

const img = sharp(inPath);
const { width, height } = await img.metadata();
const { data } = await img.ensureAlpha().raw().toBuffer({ resolveWithObject: true });

const rects = [];
for (let y = 0; y < height; y++) {
  for (let x = 0; x < width; x++) {
    const i = (y * width + x) * 4;
    const r = data[i], g = data[i+1], b = data[i+2], a = data[i+3];
    if (a > 64 && (r + g + b) < 400) {
      const hex = `#${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${b.toString(16).padStart(2,'0')}`;
      rects.push(`<rect x="${x}" y="${y}" width="1" height="1" fill="${hex}"/>`);
    }
  }
}

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" shape-rendering="crispEdges">
${rects.join('\n')}
</svg>`;

writeFileSync(outPath, svg);
console.log(`Done — ${rects.length} pixels, ${width}x${height} → ${outPath}`);
