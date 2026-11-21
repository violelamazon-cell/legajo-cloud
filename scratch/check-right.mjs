import fs from 'fs';
import { unfilterPng } from './analyze-plates.mjs';

for (const file of ['public/plates/pc-off.png', 'public/plates/pc-off-original.png', 'public/plates/mac-off.png']) {
  const { width, height, bpp, data } = unfilterPng(fs.readFileSync(file));
  console.log('===', file, '===');
  // Check pixel columns from x=1300 to 1535 at mid-height y=500
  for (let x = 1350; x < width; x += 20) {
    const idx = (500 * width + x) * bpp;
    console.log(`x=${x}, y=500: [${data[idx]}, ${data[idx+1]}, ${data[idx+2]}]`);
  }
}
