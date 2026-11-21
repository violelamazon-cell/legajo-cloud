import fs from 'fs';
import { unfilterPng } from './analyze-plates.mjs';

const img = unfilterPng(fs.readFileSync('docs/stage2-reposo-1920.png'));
console.log('stage2-reposo-1920.png: width:', img.width, 'height:', img.height);
const blockW = Math.floor(img.width / 24);
const blockH = Math.floor(img.height / 16);
let grid = '';
for (let by = 0; by < 16; by++) {
  let row = '';
  for (let bx = 0; bx < 24; bx++) {
    let sumBri = 0, count = 0;
    for (let y = by * blockH; y < (by + 1) * blockH; y++) {
      for (let x = bx * blockW; x < (bx + 1) * blockW; x++) {
        const i = (y * img.width + x) * 3;
        sumBri += Math.max(img.data[i], img.data[i+1], img.data[i+2]);
        count++;
      }
    }
    row += Math.round(sumBri / count).toString().padStart(4, ' ');
  }
  grid += row + '\n';
}
console.log(grid);
