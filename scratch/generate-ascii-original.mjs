import fs from 'fs';
import { unfilterPng } from './analyze-plates.mjs';

const img = unfilterPng(fs.readFileSync('public/plates/pc-off-original.png'));
const downW = 76;
const downH = 50;
let ascii = '';
for (let dy = 0; dy < downH; dy++) {
  let line = '';
  for (let dx = 0; dx < downW; dx++) {
    const x = Math.floor(dx * (img.width / downW));
    const y = Math.floor(dy * (img.height / downH));
    const i = (y * img.width + x) * 3;
    const r = img.data[i];
    const g = img.data[i+1];
    const b = img.data[i+2];
    const bri = Math.max(r, g, b);
    if (bri < 15) line += ' ';
    else if (bri < 50) line += '.';
    else if (bri < 100) line += ':';
    else if (bri < 180) line += '=';
    else line += '#';
  }
  ascii += line + '\n';
}
fs.writeFileSync('scratch/ascii-pc-original.txt', ascii);
console.log('Saved scratch/ascii-pc-original.txt');
