import fs from 'fs';
import { unfilterPng } from './measure-all-correct.mjs';

for (const name of ['cloud-1-arrived-off.png', 'cloud-2-phase1-flash.png', 'cloud-3-phase3-progress.png', 'cloud-4-phase4-final.png', 'cloud-5-reversed-to-s2.png', 'cloud-6-persisted-on.png', 'cloud-7-scene05-strategies.png']) {
  const file = `scratch/${name}`;
  const stat = fs.statSync(file);
  const { width, height, bpp, data } = unfilterPng(fs.readFileSync(file));
  let maxBri = 0;
  for (let i = 0; i < width * height; i++) {
    const bri = Math.max(data[i*bpp], data[i*bpp+1], data[i*bpp+2]);
    if (bri > maxBri) maxBri = bri;
  }
  console.log(`${name}: ${stat.size} bytes, ${width}x${height}, maxBri: ${maxBri}`);
}
