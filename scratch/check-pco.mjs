import fs from 'fs';
import { unfilterPng } from './analyze-plates.mjs';

const pco = unfilterPng(fs.readFileSync('public/plates/pc-off-original.png'));
const pc = unfilterPng(fs.readFileSync('public/plates/pc-off.png'));

// Check what pixels changed between original and pc-off.png
let diffCount = 0;
for (let y = 0; y < 1024; y++) {
  for (let x = 0; x < 1536; x++) {
    const i = (y * 1536 + x) * 3;
    const r1 = pco.data[i], g1 = pco.data[i+1], b1 = pco.data[i+2];
    const r2 = pc.data[i], g2 = pc.data[i+1], b2 = pc.data[i+2];
    if (Math.abs(r1 - r2) > 5 || Math.abs(g1 - g2) > 5 || Math.abs(b1 - b2) > 5) {
      diffCount++;
    }
  }
}
console.log('Pixels with diff > 5:', diffCount);
