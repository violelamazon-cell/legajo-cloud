import fs from 'fs';
import { unfilterPng } from './measure-all-correct.mjs';

const mac = unfilterPng(fs.readFileSync('public/plates/mac-off.png'));
console.log('MacBook row 500:');
let firstNonBlack = -1, lastNonBlack = -1;
for (let x = 0; x < mac.width; x++) {
  const i = (500 * mac.width + x) * 3;
  if (Math.max(mac.data[i], mac.data[i+1], mac.data[i+2]) > 10) {
    if (firstNonBlack === -1) firstNonBlack = x;
    lastNonBlack = x;
  }
}
console.log({ firstNonBlack, lastNonBlack });
for (let x = firstNonBlack - 5; x <= firstNonBlack + 10; x++) {
  const i = (500 * mac.width + x) * 3;
  console.log(`x=${x}: [${mac.data[i]}, ${mac.data[i+1]}, ${mac.data[i+2]}]`);
}
