import fs from 'fs';
import { unfilterPng } from './measure-all-correct.mjs';

const macOn = unfilterPng(fs.readFileSync('public/plates/mac-on.png'));
const macOff = unfilterPng(fs.readFileSync('public/plates/mac-off.png'));

// Let's inspect where the window frame / bright screen content is in mac-on.png
// Find bounding box of bright pixels in the upper half (screen area, y < 650)
let minX = 1536, maxX = 0, minY = 1024, maxY = 0;
for (let y = 100; y < 650; y++) {
  for (let x = 200; x < 1350; x++) {
    const idx = (y * macOn.width + x) * 3;
    const r = macOn.data[idx], g = macOn.data[idx+1], b = macOn.data[idx+2];
    // Cyan or violet or white or bright pixels
    if ((g > 80 && b > 80) || (r > 80 && b > 80) || (r > 120 && g > 120 && b > 120)) {
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  }
}

console.log('Screen content in mac-on.png:');
console.log({
  minX, maxX, minY, maxY,
  width: maxX - minX + 1,
  height: maxY - minY + 1,
  centerX: ((minX + maxX) / 2).toFixed(1),
  centerY: ((minY + maxY) / 2).toFixed(1)
});

// Let's also inspect the inner glass coordinates in macOff
// Look at row y=400 in macOff:
let bezelLeft = 0, bezelRight = 0;
for (let x = 200; x < 500; x++) {
  const i = (400 * 1536 + x) * 3;
  if (macOff.data[i] < 10 && macOff.data[i+1] < 10 && macOff.data[i+2] < 10) {
    bezelLeft = x;
    break;
  }
}
for (let x = 1350; x > 1000; x--) {
  const i = (400 * 1536 + x) * 3;
  if (macOff.data[i] < 10 && macOff.data[i+1] < 10 && macOff.data[i+2] < 10) {
    bezelRight = x;
    break;
  }
}
console.log('Screen glass inner bounds at y=400 in mac-off:', { bezelLeft, bezelRight, width: bezelRight - bezelLeft });
