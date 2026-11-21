import fs from 'fs';
import { unfilterPng } from './analyze-plates.mjs';

const img = unfilterPng(fs.readFileSync('public/plates/mac-off.png'));
console.log('mac-off.png: width:', img.width, 'height:', img.height);
const blockW = 64;
const blockH = 64;
let grid = '';
for (let by = 0; by < 1024; by += blockH) {
  let row = '';
  for (let bx = 0; bx < 1536; bx += blockW) {
    let sumBri = 0, count = 0;
    for (let y = by; y < by + blockH; y++) {
      for (let x = bx; x < bx + blockW; x++) {
        const i = (y * 1536 + x) * 3;
        sumBri += Math.max(img.data[i], img.data[i+1], img.data[i+2]);
        count++;
      }
    }
    const avg = Math.round(sumBri / count);
    row += avg.toString().padStart(4, ' ');
  }
  grid += row + '\n';
}
console.log(grid);
