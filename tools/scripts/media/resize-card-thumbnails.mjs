// Resizes images to card thumbnail size: max 800px wide, max 450px tall.
// Cards on the games page are ~320px wide (desktop 3-col grid).
// 800px gives clean 2.5x retina headroom without wasteful file size.
// Run: node tools/scripts/media/resize-card-thumbnails.mjs <folder>

import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const folder = process.argv[2];

if (!folder) {
  console.error('Error: provide a folder path.');
  process.exit(1);
}

const MAX_W = 800;
const MAX_H = 450;

const files = fs.readdirSync(folder).filter(f => f.match(/\.(jpg|jpeg|png)$/i));

for (const file of files) {
  const fullPath = path.join(folder, file);
  const ext = path.extname(file).toLowerCase();

  const image = sharp(fullPath);
  const meta = await image.metadata();

  if (meta.width <= MAX_W && meta.height <= MAX_H) {
    console.log(`   skipped ${file} (already ${meta.width}x${meta.height})`);
    continue;
  }

  let pipeline = image.rotate().resize({
    width: MAX_W,
    height: MAX_H,
    fit: 'inside',
    withoutEnlargement: true,
  });

  pipeline = ext === '.png'
    ? pipeline.png({ compressionLevel: 9 })
    : pipeline.jpeg({ quality: 85, mozjpeg: true });

  const tempPath = fullPath + '.tmp';
  await pipeline.toFile(tempPath);

  const before = fs.statSync(fullPath).size;
  const after = fs.statSync(tempPath).size;

  fs.unlinkSync(fullPath);
  fs.renameSync(tempPath, fullPath);

  const savings = ((before - after) / before * 100).toFixed(1);
  console.log(`   ${file}: ${meta.width}x${meta.height} → ≤${MAX_W}x${MAX_H}px (${savings}% smaller)`);
}
