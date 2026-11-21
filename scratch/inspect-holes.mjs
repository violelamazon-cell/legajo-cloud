import fs from 'fs';
import { unfilterPng } from './measure-all-correct.mjs';

function inspectHoles(file, bgThreshold) {
  const { width, height, bpp, data } = unfilterPng(fs.readFileSync(file));
  const visited = new Uint8Array(width * height);
  const queue = new Int32Array(width * height);
  let qHead = 0, qTail = 0;

  // Exterior flood fill from borders
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
        if (bri <= bgThreshold) {
          visited[n] = 1;
          queue[qTail++] = n;
        }
      }
    }
  }

  // Now, look at unvisited pixels with bri <= bgThreshold (these are dark internal regions)
  const holeVisited = new Uint8Array(width * height);
  const pockets = [];

  for (let i = 0; i < width * height; i++) {
    if (visited[i] === 0 && holeVisited[i] === 0) {
      const idx = i * bpp;
      const bri = Math.max(data[idx], data[idx + 1], data[idx + 2]);
      if (bri <= bgThreshold) {
        // Found a dark pocket! Let's measure its size and bounding box
        let pocketSize = 0;
        let minX = width, maxX = 0, minY = height, maxY = 0;
        const hq = [i];
        holeVisited[i] = 1;
        let hHead = 0;
        while (hHead < hq.length) {
          const curr = hq[hHead++];
          pocketSize++;
          const cx = curr % width;
          const cy = (curr / width) | 0;
          if (cx < minX) minX = cx;
          if (cx > maxX) maxX = cx;
          if (cy < minY) minY = cy;
          if (cy > maxY) maxY = cy;

          const nbrs = [
            cx > 0 ? curr - 1 : -1,
            cx < width - 1 ? curr + 1 : -1,
            cy > 0 ? curr - width : -1,
            cy < height - 1 ? curr + width : -1,
          ];
          for (const n of nbrs) {
            if (n !== -1 && visited[n] === 0 && holeVisited[n] === 0) {
              const nIdx = n * bpp;
              const nBri = Math.max(data[nIdx], data[nIdx + 1], data[nIdx + 2]);
              if (nBri <= bgThreshold) {
                holeVisited[n] = 1;
                hq.push(n);
              }
            }
          }
        }
        pockets.push({ size: pocketSize, bbox: { minX, maxX, minY, maxY } });
      }
    }
  }

  // Sort pockets by size
  pockets.sort((a, b) => b.size - a.size);
  console.log(`=== ${file} (bgThreshold=${bgThreshold}) ===`);
  console.log(`Found ${pockets.length} internal dark pockets.`);
  console.log('Top 5 largest internal dark pockets:');
  console.log(pockets.slice(0, 5));
}

inspectHoles('public/plates/pc-off.png', 10);
inspectHoles('public/plates/mac-off.png', 3);
