import fs from 'fs';
import { unfilterPng } from './measure-all-correct.mjs';

function inspectBg(file, bbox) {
  const { width, height, bpp, data } = unfilterPng(fs.readFileSync(file));
  let maxBgBri = 0;
  const hist = {};
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      // If outside bbox with margin of 10px
      if (x < bbox.left - 10 || x > bbox.right + 10 || y < bbox.top - 10 || y > bbox.bottom + 10) {
        const i = (y * width + x) * bpp;
        const bri = Math.max(data[i], data[i+1], data[i+2]);
        maxBgBri = Math.max(maxBgBri, bri);
        hist[bri] = (hist[bri] || 0) + 1;
      }
    }
  }
  return { file, maxBgBri, hist };
}

console.log(inspectBg('public/plates/pc-off.png', { left: 209, right: 1320, top: 18, bottom: 995 }));
console.log(inspectBg('public/plates/mac-off.png', { left: 172, right: 1362, top: 113, bottom: 894 }));
