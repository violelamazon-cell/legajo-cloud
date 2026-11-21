import fs from 'fs';
import { unfilterPng } from './analyze-plates.mjs';

const img1 = unfilterPng(fs.readFileSync('public/plates/pc-off.png'));
const img2 = unfilterPng(fs.readFileSync('public/plates/pc-off-original.png'));

let diffCount = 0;
let minDiffX = img1.width, maxDiffX = 0, minDiffY = img1.height, maxDiffY = 0;

for (let y = 0; y < img1.height; y++) {
  for (let x = 0; x < img1.width; x++) {
    const i = (y * img1.width + x) * 3;
    if (img1.data[i] !== img2.data[i] || img1.data[i+1] !== img2.data[i+1] || img1.data[i+2] !== img2.data[i+2]) {
      diffCount++;
      if (x < minDiffX) minDiffX = x;
      if (x > maxDiffX) maxDiffX = x;
      if (y < minDiffY) minDiffY = y;
      if (y > maxDiffY) maxDiffY = y;
    }
  }
}
console.log({ diffCount, minDiffX, maxDiffX, minDiffY, maxDiffY });
