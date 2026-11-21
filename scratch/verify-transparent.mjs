import fs from 'fs';
import { unfilterPng } from './measure-all-correct.mjs';

function verifyTransparent(file, crtArea) {
  const { width, height, bpp, data } = unfilterPng(fs.readFileSync(file));
  let fullyTransparent = 0;
  let semiTransparent = 0;
  let fullyOpaque = 0;

  for (let i = 0; i < width * height; i++) {
    const a = data[i * bpp + 3];
    if (a === 0) fullyTransparent++;
    else if (a === 255) fullyOpaque++;
    else semiTransparent++;
  }

  // Check CRT / screen area:
  let crtTransparent = 0;
  let minCrtAlpha = 255;
  for (let y = crtArea.top; y <= crtArea.bottom; y++) {
    for (let x = crtArea.left; x <= crtArea.right; x++) {
      const a = data[(y * width + x) * bpp + 3];
      if (a < minCrtAlpha) minCrtAlpha = a;
      if (a < 255) crtTransparent++;
    }
  }

  console.log(`=== Verification for ${file} ===`);
  console.log({
    width, height, bpp,
    fullyTransparent,
    semiTransparent,
    fullyOpaque,
    minCrtAlpha,
    crtTransparentPixels: crtTransparent
  });
}

// Check PC: CRT screen is X=[488..1048], Y=[106..496]
verifyTransparent('public/plates/pc-off-transparent.png', { left: 520, right: 1000, top: 150, bottom: 450 });

// Check Mac: screen area is roughly X=[350..1180], Y=[160..680]
verifyTransparent('public/plates/mac-off-transparent.png', { left: 400, right: 1100, top: 200, bottom: 650 });
