import fs from 'fs';
import { unfilterPng } from './measure-all-correct.mjs';

function analyzeContour(file, bgThreshold) {
  const { width, height, bpp, data } = unfilterPng(fs.readFileSync(file));
  const visited = new Uint8Array(width * height);
  const queue = new Int32Array(width * height);
  let qHead = 0, qTail = 0;

  // Initialize queue with perimeter pixels
  for (let x = 0; x < width; x++) {
    queue[qTail++] = 0 * width + x;
    visited[0 * width + x] = 1;
    queue[qTail++] = (height - 1) * width + x;
    visited[(height - 1) * width + x] = 1;
  }
  for (let y = 1; y < height - 1; y++) {
    queue[qTail++] = y * width + 0;
    visited[y * width + 0] = 1;
    queue[qTail++] = y * width + (width - 1);
    visited[y * width + (width - 1)] = 1;
  }

  // Flood fill: exterior reaches all pixels with max(r,g,b) <= bgThreshold
  while (qHead < qTail) {
    const curr = queue[qHead++];
    const cx = curr % width;
    const cy = (curr / width) | 0;

    const neighbors = [
      cx > 0 ? curr - 1 : -1,
      cx < width - 1 ? curr + 1 : -1,
      cy > 0 ? curr - width : -1,
      cy < height - 1 ? curr + width : -1,
    ];

    for (const n of neighbors) {
      if (n !== -1 && visited[n] === 0) {
        const idx = n * bpp;
        const bri = Math.max(data[idx], data[idx + 1], data[idx + 2]);
        if (bri <= bgThreshold) {
          visited[n] = 1;
          queue[qTail++] = n;
        }
      }
    }
  }

  // Count total pixels reached by flood fill vs total image pixels
  const exteriorCount = qTail;
  const hardwareCount = width * height - exteriorCount;

  // Check minimum brightness INSIDE the unvisited hardware area
  let minHwBri = 255;
  let hwBlackPixelsCount = 0;
  for (let i = 0; i < width * height; i++) {
    if (visited[i] === 0) {
      const idx = i * bpp;
      const bri = Math.max(data[idx], data[idx + 1], data[idx + 2]);
      if (bri < minHwBri) minHwBri = bri;
      if (bri <= bgThreshold) hwBlackPixelsCount++;
    }
  }

  console.log({
    file,
    bgThreshold,
    exteriorCount,
    hardwareCount,
    minHwBri,
    hwBlackPixelsCount,
    percentageHwBlackPreserved: ((hwBlackPixelsCount / hardwareCount) * 100).toFixed(2) + '%'
  });
}

console.log('Testing flood fill thresholds:');
analyzeContour('public/plates/pc-off.png', 10);
analyzeContour('public/plates/pc-off.png', 14);
analyzeContour('public/plates/mac-off.png', 3);
analyzeContour('public/plates/mac-off.png', 6);
