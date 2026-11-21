import fs from 'fs';
import { unfilterPng } from './analyze-plates.mjs';

const mac = unfilterPng(fs.readFileSync('public/plates/mac-off.png'));
console.log('mac-off.png dimensions:', mac.width, mac.height);

// Find background threshold:
// At the 4 corners: (0,0), (1535, 0), (0, 1023), (1535, 1023), what are the RGB values?
const p = (x, y) => {
  const i = (y * mac.width + x) * 3;
  return [mac.data[i], mac.data[i+1], mac.data[i+2]];
};
console.log('(0,0):', p(0,0));
console.log('(1535,0):', p(1535,0));
console.log('(0,1023):', p(0,1023));
console.log('(1535,1023):', p(1535,1023));

// Check rows y=0..110 across all x
let maxRow0to110 = 0;
for (let y = 0; y < 110; y++) {
  for (let x = 0; x < mac.width; x++) {
    const val = Math.max(...p(x, y));
    if (val > maxRow0to110) maxRow0to110 = val;
  }
}
console.log('Max brightness in rows y=0..110:', maxRow0to110);

// Check rows y=900..1023 across all x
let maxRow900to1023 = 0;
for (let y = 900; y < mac.height; y++) {
  for (let x = 0; x < mac.width; x++) {
    const val = Math.max(...p(x, y));
    if (val > maxRow900to1023) maxRow900to1023 = val;
  }
}
console.log('Max brightness in rows y=900..1023:', maxRow900to1023);
