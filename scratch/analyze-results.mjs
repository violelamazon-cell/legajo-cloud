import fs from 'fs';
import { unfilterPng } from './measure-all-correct.mjs';

function inspectScreenshot(file, description) {
  const { width, height, bpp, data } = unfilterPng(fs.readFileSync(file));
  console.log(`=== ${description} (${file}: ${width}x${height}) ===`);

  // Check green rings / iridescent glass in scene 03:
  // Rings have emerald green color (#19f58c: R~25, G~245, B~140)
  let greenPixels = 0;
  let glassIridPixels = 0;
  for (let i = 0; i < width * height; i++) {
    const idx = i * bpp;
    const r = data[idx], g = data[idx + 1], b = data[idx + 2];
    // Emerald green ring
    if (g > 120 && g > r * 1.5 && g > b * 1.2) greenPixels++;
    // Iridescent colors (cyan, magenta, violet)
    if ((b > 100 && r > 100 && g < 180) || (b > 150 && g > 150 && r < 100)) glassIridPixels++;
  }
  console.log({ greenPixels, glassIridPixels });
}

inspectScreenshot('scratch/transp-scene03-wrapper.png', 'Scene 03 Wrapper (3D capsule & rings)');

function inspectScene04(file) {
  const { width, height, bpp, data } = unfilterPng(fs.readFileSync(file));
  console.log(`=== Scene 04 (${file}) ===`);
  // Inspect area to the left of the MacBook (x=300..600, y=400..650) where fiber optics enter
  let fiberPixels = 0;
  for (let y = 400; y <= 650; y++) {
    for (let x = 300; x <= 600; x++) {
      const idx = (y * width + x) * bpp;
      const r = data[idx], g = data[idx+1], b = data[idx+2];
      // Beams are cyan / turquoise (#22e6d8: R~34, G~230, B~216)
      if (g > 80 && b > 80 && Math.max(g, b) > r * 1.2) fiberPixels++;
    }
  }
  console.log('Fiber optic beam pixels arriving on the left:', fiberPixels);
}

inspectScene04('scratch/transp-scene04-macbook-off.png');
