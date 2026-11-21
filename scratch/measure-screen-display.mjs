import fs from 'fs';
import { unfilterPng } from './measure-all-correct.mjs';

const macOn = unfilterPng(fs.readFileSync('public/plates/mac-on.png'));
const macOff = unfilterPng(fs.readFileSync('public/plates/mac-off.png'));

// Find pixels that differ between mac-on and mac-off
let minDiffX = macOn.width, maxDiffX = 0, minDiffY = macOn.height, maxDiffY = 0;
let diffCount = 0;

for (let y = 0; y < macOn.height; y++) {
  for (let x = 0; x < macOn.width; x++) {
    const idx = (y * macOn.width + x) * 3;
    const r1 = macOn.data[idx], g1 = macOn.data[idx + 1], b1 = macOn.data[idx + 2];
    const r2 = macOff.data[idx], g2 = macOff.data[idx + 1], b2 = macOff.data[idx + 2];
    if (Math.abs(r1 - r2) > 15 || Math.abs(g1 - g2) > 15 || Math.abs(b1 - b2) > 15) {
      diffCount++;
      if (x < minDiffX) minDiffX = x;
      if (x > maxDiffX) maxDiffX = x;
      if (y < minDiffY) minDiffY = y;
      if (y > maxDiffY) maxDiffY = y;
    }
  }
}

console.log('Screen display difference area (mac-on vs mac-off):');
console.log({
  minDiffX,
  maxDiffX,
  minDiffY,
  maxDiffY,
  width: maxDiffX - minDiffX + 1,
  height: maxDiffY - minDiffY + 1,
  centerX: ((minDiffX + maxDiffX) / 2).toFixed(1),
  centerY: ((minDiffY + maxDiffY) / 2).toFixed(1),
  diffPixels: diffCount
});
