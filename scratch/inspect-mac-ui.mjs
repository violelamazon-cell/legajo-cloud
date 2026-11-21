import fs from 'fs';
import { unfilterPng } from './measure-all-correct.mjs';

const macOn = unfilterPng(fs.readFileSync('public/plates/mac-on.png'));

// Let's sample key areas in mac-on.png:
// 1. Three circular dots (top left)
// 2. Title // NUEVO SISTEMA: CLOUD
// 3. Subtitle > MIGRACIÓN: EN PROGRESO
// 4. Cloud Icon
// 5. Progress bar and percentage
// 6. Waves at the bottom

console.log('Sampling mac-on screen elements...');
// Find bounding box of 3 dots: usually near top-left of window (x ~ 310..380, y ~ 160..200)
// Let's search for the window border in mac-on.png:
// Along x=768 (center vertical line), what is the top border and bottom border of the window?
for (let y = 130; y <= 660; y += 10) {
  const i = (y * 1536 + 768) * 3;
  const bri = Math.max(macOn.data[i], macOn.data[i+1], macOn.data[i+2]);
  if (bri > 30) {
    console.log(`Center x=768, y=${y}: [${macOn.data[i]}, ${macOn.data[i+1]}, ${macOn.data[i+2]}]`);
  }
}

// Check window corners in mac-on:
// Look at left edge of the tech window at y=300
for (let x = 280; x <= 360; x += 2) {
  const i = (300 * 1536 + x) * 3;
  if (Math.max(macOn.data[i], macOn.data[i+1], macOn.data[i+2]) > 40) {
    console.log(`Left border at y=300, x=${x}: [${macOn.data[i]}, ${macOn.data[i+1]}, ${macOn.data[i+2]}]`);
    break;
  }
}
