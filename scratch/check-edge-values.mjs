import fs from 'fs';
import { unfilterPng } from './measure-all-correct.mjs';

const mac = unfilterPng(fs.readFileSync('public/plates/mac-off.png'));
console.log('MacBook edge at y=500:');
for (let x = 175; x <= 220; x += 2) {
  const i = (500 * mac.width + x) * 3;
  console.log(`x=${x}: [${mac.data[i]}, ${mac.data[i+1]}, ${mac.data[i+2]}]`);
}

const pc = unfilterPng(fs.readFileSync('public/plates/pc-off.png'));
console.log('PC edge at y=300:');
for (let x = 385; x <= 430; x += 2) {
  const i = (300 * pc.width + x) * 3;
  console.log(`x=${x}: [${pc.data[i]}, ${pc.data[i+1]}, ${pc.data[i+2]}]`);
}
