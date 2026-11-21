import fs from 'fs';
import { unfilterPng } from './analyze-plates.mjs';

const img = unfilterPng(fs.readFileSync('public/plates/pc-off.png'));
// Let's inspect where pixels > 20 are horizontally across the image width
const colCounts = new Array(img.width).fill(0);
for (let x = 0; x < img.width; x++) {
  for (let y = 0; y < img.height; y++) {
    const idx = (y * img.width + x) * 3;
    if (Math.max(img.data[idx], img.data[idx+1], img.data[idx+2]) > 20) {
      colCounts[x]++;
    }
  }
}

// Print ranges with non-zero counts
let inRange = false, startX = 0;
for (let x = 0; x < img.width; x++) {
  if (colCounts[x] > 0 && !inRange) {
    inRange = true;
    startX = x;
  } else if (colCounts[x] === 0 && inRange) {
    inRange = false;
    console.log(`Region from x=${startX} to x=${x-1}, max count in col: ${Math.max(...colCounts.slice(startX, x))}`);
  }
}
if (inRange) {
  console.log(`Region from x=${startX} to x=${img.width-1}, max count in col: ${Math.max(...colCounts.slice(startX))}`);
}
