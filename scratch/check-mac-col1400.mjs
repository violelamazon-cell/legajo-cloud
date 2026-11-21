import fs from 'fs';
import { unfilterPng } from './analyze-plates.mjs';

const mac = unfilterPng(fs.readFileSync('public/plates/mac-off.png'));
for (let y = 0; y < mac.height; y += 30) {
  const i = (y * mac.width + 1400) * 3;
  console.log(`y=${y}: [${mac.data[i]}, ${mac.data[i+1]}, ${mac.data[i+2]}]`);
}
