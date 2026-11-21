import fs from 'fs';
import { unfilterPng } from './analyze-plates.mjs';

const img = unfilterPng(fs.readFileSync('public/plates/pc-off.png'));
console.log('width:', img.width, 'height:', img.height);

// Find all distinct regions of pixels
// Let's print average RGB in 16x16 blocks across the image
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
console.log('Average brightness in 64x64 blocks (24 cols x 16 rows):');
console.log(grid);
