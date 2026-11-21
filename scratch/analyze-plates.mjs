import fs from 'fs';
import zlib from 'zlib';

export function unfilterPng(buf) {
  let pos = 8, width, height, bpp, idats = [];
  while (pos < buf.length) {
    const len = buf.readUInt32BE(pos);
    const type = buf.toString('ascii', pos + 4, pos + 8);
    if (type === 'IHDR') {
      width = buf.readUInt32BE(pos + 8);
      height = buf.readUInt32BE(pos + 12);
      bpp = buf[pos + 17] === 6 ? 4 : 3;
    } else if (type === 'IDAT') idats.push(buf.subarray(pos + 8, pos + 8 + len));
    pos += 12 + len;
  }
  const decomp = zlib.inflateSync(Buffer.concat(idats));
  const raw = Buffer.alloc(width * height * bpp);
  const srcStride = 1 + width * bpp;
  const dstStride = width * bpp;

  function paeth(a, b, c) {
    const p = a + b - c;
    const pa = Math.abs(p - a);
    const pb = Math.abs(p - b);
    const pc = Math.abs(p - c);
    if (pa <= pb && pa <= pc) return a;
    if (pb <= pb && pa <= pc) return b;
    return c;
  }

  for (let y = 0; y < height; y++) {
    const filter = decomp[y * srcStride];
    const srcRow = y * srcStride + 1;
    const dstRow = y * dstStride;
    const prevDstRow = (y - 1) * dstStride;

    for (let x = 0; x < width * bpp; x++) {
      const xByte = decomp[srcRow + x];
      const a = x >= bpp ? raw[dstRow + x - bpp] : 0;
      const b = y > 0 ? raw[prevDstRow + x] : 0;
      const c = (y > 0 && x >= bpp) ? raw[prevDstRow + x - bpp] : 0;

      let val = xByte;
      if (filter === 1) val = (xByte + a) & 0xff;
      else if (filter === 2) val = (xByte + b) & 0xff;
      else if (filter === 3) val = (xByte + Math.floor((a + b) / 2)) & 0xff;
      else if (filter === 4) val = (xByte + paeth(a, b, c)) & 0xff;

      raw[dstRow + x] = val;
    }
  }

  return { width, height, bpp, data: raw };
}

for (const file of ['public/plates/pc-off.png', 'public/plates/mac-off.png']) {
  const { width, height, bpp, data } = unfilterPng(fs.readFileSync(file));
  console.log('===', file, '===');
  
  // Check borders: top, bottom, left, right
  let topNonZero = 0, bottomNonZero = 0, leftNonZero = 0, rightNonZero = 0;
  for (let x = 0; x < width; x++) {
    const topIdx = (0 * width + x) * bpp;
    const botIdx = ((height - 1) * width + x) * bpp;
    if (Math.max(data[topIdx], data[topIdx + 1], data[topIdx + 2]) > 20) topNonZero++;
    if (Math.max(data[botIdx], data[botIdx + 1], data[botIdx + 2]) > 20) bottomNonZero++;
  }
  for (let y = 0; y < height; y++) {
    const leftIdx = (y * width + 0) * bpp;
    const rightIdx = (y * width + (width - 1)) * bpp;
    if (Math.max(data[leftIdx], data[leftIdx + 1], data[leftIdx + 2]) > 20) leftNonZero++;
    if (Math.max(data[rightIdx], data[rightIdx + 1], data[rightIdx + 2]) > 20) rightNonZero++;
  }
  console.log('Non-black pixels (>20) on border:');
  console.log({ topNonZero, bottomNonZero, leftNonZero, rightNonZero });

  // Find bounding box of pixels > 20
  let minX = width, maxX = 0, minY = height, maxY = 0;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * bpp;
      if (Math.max(data[idx], data[idx + 1], data[idx + 2]) > 20) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  console.log('BBox (>20):', { minX, maxX, minY, maxY, w: maxX - minX + 1, h: maxY - minY + 1 });
}
