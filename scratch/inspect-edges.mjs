import fs from 'fs';
import { unfilterPng } from './measure-all-correct.mjs';

function inspectEdge(file, sampleY, startX, endX) {
  const { width, height, bpp, data } = unfilterPng(fs.readFileSync(file));
  console.log(`=== ${file} at y=${sampleY} ===`);
  for (let x = startX; x <= endX; x++) {
    const idx = (sampleY * width + x) * bpp;
    console.log(`x=${x}: [${data[idx]}, ${data[idx+1]}, ${data[idx+2]}]`);
  }
}

// MacBook left edge at y=500
inspectEdge('public/plates/mac-off.png', 500, 168, 178);

// PC left edge at y=300
inspectEdge('public/plates/pc-off.png', 300, 375, 388);
