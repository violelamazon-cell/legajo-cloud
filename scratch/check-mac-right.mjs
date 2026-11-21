import fs from 'fs';
import { unfilterPng } from './analyze-plates.mjs';

const mac = unfilterPng(fs.readFileSync('public/plates/mac-off.png'));
let maxCol0to165 = 0;
for (let y = 0; y < mac.height; y++) {
  for (let x = 0; x < 165; x++) {
    const i = (y * mac.width + x) * 3;
    const val = Math.max(mac.data[i], mac.data[i+1], mac.data[i+2]);
    if (val > maxCol0to165) maxCol0to165 = val;
  }
}
console.log('Max brightness in cols x=0..165:', maxCol0to165);

// And what about the right side? What is the rightmost x of the laptop?
// Earlier we saw: laptopBBox: { left: 172, right: 1362, top: 113, bottom: 894 }
// Wait, why did analyze-plates show maxX: 1535?
// Let's check what is between x=1363 and 1535!
for (let x = 1360; x < 1536; x += 10) {
  let colMax = 0;
  for (let y = 0; y < mac.height; y++) {
    const i = (y * mac.width + x) * 3;
    colMax = Math.max(colMax, mac.data[i], mac.data[i+1], mac.data[i+2]);
  }
  console.log(`col x=${x}: max=${colMax}`);
}
