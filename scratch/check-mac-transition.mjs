import fs from 'fs';
import { unfilterPng } from './analyze-plates.mjs';

const mac = unfilterPng(fs.readFileSync('public/plates/mac-off.png'));
// Find the transition between laptop and whatever is on the right
for (let x = 1340; x <= 1380; x++) {
  let countNonBlack = 0;
  for (let y = 200; y < 700; y++) {
    const i = (y * mac.width + x) * 3;
    if (mac.data[i] > 10 || mac.data[i+1] > 10 || mac.data[i+2] > 10) countNonBlack++;
  }
  console.log(`x=${x}: non-black in y=200..700: ${countNonBlack}`);
}
