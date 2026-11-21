import fs from 'fs';
import { unfilterPng } from './measure-all-correct.mjs';
import { writePngRgba } from './png-writer.mjs';

export function createTransparentPlate(srcFile, destFile, options) {
  const { bgThreshold, edgeLow, edgeHigh } = options;
  const { width, height, bpp, data } = unfilterPng(fs.readFileSync(srcFile));

  // 1. Exterior flood fill
  const isExterior = new Uint8Array(width * height);
  const queue = new Int32Array(width * height);
  let qHead = 0, qTail = 0;

  // Add all perimeter pixels
  for (let x = 0; x < width; x++) {
    queue[qTail++] = 0 * width + x; isExterior[0 * width + x] = 1;
    queue[qTail++] = (height - 1) * width + x; isExterior[(height - 1) * width + x] = 1;
  }
  for (let y = 1; y < height - 1; y++) {
    queue[qTail++] = y * width + 0; isExterior[y * width + 0] = 1;
    queue[qTail++] = y * width + (width - 1); isExterior[y * width + (width - 1)] = 1;
  }

  while (qHead < qTail) {
    const curr = queue[qHead++];
    const cx = curr % width;
    const cy = (curr / width) | 0;

    const nbrs = [
      cx > 0 ? curr - 1 : -1,
      cx < width - 1 ? curr + 1 : -1,
      cy > 0 ? curr - width : -1,
      cy < height - 1 ? curr + width : -1,
    ];

    for (const n of nbrs) {
      if (n !== -1 && isExterior[n] === 0) {
        const idx = n * bpp;
        const bri = Math.max(data[idx], data[idx + 1], data[idx + 2]);
        if (bri <= bgThreshold) {
          isExterior[n] = 1;
          queue[qTail++] = n;
        }
      }
    }
  }

  // 2. Identify boundary pixels between exterior and hardware
  // Exterior pixels that touch hardware might have partial edge antialiasing (brightness > edgeLow)
  const alpha = new Uint8Array(width * height);
  for (let i = 0; i < width * height; i++) {
    if (isExterior[i] === 0) {
      // Definite hardware
      alpha[i] = 255;
    } else {
      alpha[i] = 0;
    }
  }

  // Refine boundary pixels in a 2-pixel band along the exterior contour
  // To avoid halos and jagged edges:
  // For each exterior pixel adjacent to hardware, compute smooth alpha based on brightness
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = y * width + x;
      if (isExterior[idx] === 1) {
        // Check 8-neighbors for hardware
        let touchesHw = false;
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (isExterior[(y + dy) * width + (x + dx)] === 0) {
              touchesHw = true;
              break;
            }
          }
          if (touchesHw) break;
        }

        if (touchesHw) {
          const pIdx = idx * bpp;
          const bri = Math.max(data[pIdx], data[pIdx + 1], data[pIdx + 2]);
          if (bri > edgeLow) {
            const t = Math.min(1, Math.max(0, (bri - edgeLow) / (edgeHigh - edgeLow)));
            // Smoothstep curve for natural antialiased falloff
            const smoothA = t * t * (3 - 2 * t);
            alpha[idx] = Math.round(smoothA * 255);
          }
        }
      }
    }
  }

  // 3. Construct RGBA buffer with defringing
  const rgba = Buffer.alloc(width * height * 4);
  for (let i = 0; i < width * height; i++) {
    const srcIdx = i * bpp;
    const dstIdx = i * 4;
    const a = alpha[i];

    if (a === 0) {
      rgba[dstIdx] = 0;
      rgba[dstIdx + 1] = 0;
      rgba[dstIdx + 2] = 0;
      rgba[dstIdx + 3] = 0;
    } else if (a === 255) {
      rgba[dstIdx] = data[srcIdx];
      rgba[dstIdx + 1] = data[srcIdx + 1];
      rgba[dstIdx + 2] = data[srcIdx + 2];
      rgba[dstIdx + 3] = 255;
    } else {
      // Boundary pixel: unmultiply against black to remove dark fringe / halo
      const aNorm = a / 255;
      const r = Math.min(255, Math.round(data[srcIdx] / aNorm));
      const g = Math.min(255, Math.round(data[srcIdx + 1] / aNorm));
      const b = Math.min(255, Math.round(data[srcIdx + 2] / aNorm));
      rgba[dstIdx] = r;
      rgba[dstIdx + 1] = g;
      rgba[dstIdx + 2] = b;
      rgba[dstIdx + 3] = a;
    }
  }

  writePngRgba(destFile, width, height, rgba);
  console.log(`Generated ${destFile} (${width}x${height} RGBA), size: ${fs.statSync(destFile).size} bytes`);
}

// Generate transparent versions
createTransparentPlate('public/plates/pc-off.png', 'public/plates/pc-off-transparent.png', {
  bgThreshold: 10,
  edgeLow: 4,
  edgeHigh: 45,
});

createTransparentPlate('public/plates/mac-off.png', 'public/plates/mac-off-transparent.png', {
  bgThreshold: 3,
  edgeLow: 1,
  edgeHigh: 30,
});
