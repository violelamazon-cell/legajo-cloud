import fs from 'fs';
import { unfilterPng } from './measure-all-correct.mjs';

const img = unfilterPng(fs.readFileSync('scratch/cloud-6-persisted-on.png'));
// Count non-black pixels
let nonBlack = 0;
for (let i = 0; i < img.width * img.height; i++) {
  if (Math.max(img.data[i*img.bpp], img.data[i*img.bpp+1], img.data[i*img.bpp+2]) > 10) nonBlack++;
}
console.log('cloud-6-persisted-on.png non-black pixels:', nonBlack, 'out of', img.width * img.height);
