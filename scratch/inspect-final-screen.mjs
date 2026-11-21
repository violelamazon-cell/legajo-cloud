import fs from 'fs';
import { unfilterPng } from './measure-all-correct.mjs';

const img = unfilterPng(fs.readFileSync('scratch/cloud-4-phase4-final.png'));
console.log('Inspecting cloud-4-phase4-final.png:');

// Check screen display rectangle in final screenshot:
// Display is around x=580..1020, y=140..420 (in 1587x900 viewport)
let cyanPixels = 0, violetPixels = 0, emeraldPixels = 0;
for (let y = 140; y < 450; y++) {
  for (let x = 500; x < 1100; x++) {
    const idx = (y * img.width + x) * img.bpp;
    const r = img.data[idx], g = img.data[idx+1], b = img.data[idx+2];
    if (g > 140 && b > 140 && g > r * 1.2) cyanPixels++;
    if (r > 100 && b > 140 && r > g * 1.2) violetPixels++;
    if (g > 160 && g > r * 1.5 && g > b * 1.2) emeraldPixels++;
  }
}
console.log({ cyanPixels, violetPixels, emeraldPixels });
