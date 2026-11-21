import fs from 'fs';
import { unfilterPng } from './measure-all-correct.mjs';

const { width, height, bpp, data } = unfilterPng(fs.readFileSync('public/plates/pc-off.png'));
const visited = new Uint8Array(width * height);
const queue = new Int32Array(width * height);
let qHead = 0, qTail = 0;

for (let x = 0; x < width; x++) {
  queue[qTail++] = 0 * width + x; visited[0 * width + x] = 1;
  queue[qTail++] = (height - 1) * width + x; visited[(height - 1) * width + x] = 1;
}
for (let y = 1; y < height - 1; y++) {
  queue[qTail++] = y * width + 0; visited[y * width + 0] = 1;
  queue[qTail++] = y * width + (width - 1); visited[y * width + (width - 1)] = 1;
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
    if (n !== -1 && visited[n] === 0) {
      const idx = n * bpp;
      const bri = Math.max(data[idx], data[idx + 1], data[idx + 2]);
      if (bri <= 12) {
        visited[n] = 1;
        queue[qTail++] = n;
      }
    }
  }
}

// Check if visited (exterior background) enters rows around y=500..600 (between monitor and keyboard)
console.log('Exterior visited pixels between x=300..1200 at y=520, 550, 580:');
for (const y of [520, 550, 580]) {
  let count = 0;
  for (let x = 300; x <= 1200; x++) {
    if (visited[y * width + x] === 1) count++;
  }
  console.log(`y=${y}: ${count} exterior pixels between 300 and 1200`);
}
