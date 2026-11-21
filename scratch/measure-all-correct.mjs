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
    if (pb <= pa && pb <= pc) return b;
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

function analyze(file, threshold = 20) {
  const { width, height, bpp, data } = unfilterPng(fs.readFileSync(file));
  let minX = width, maxX = 0, minY = height, maxY = 0;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * bpp;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      if (r > threshold || g > threshold || b > threshold) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  return {
    file,
    threshold,
    bbox: {
      left: minX,
      right: maxX,
      top: minY,
      bottom: maxY,
      width: maxX - minX + 1,
      height: maxY - minY + 1,
      centerX: +((minX + maxX) / 2).toFixed(1),
      centerY: +((minY + maxY) / 2).toFixed(1),
    }
  };
}

console.log(JSON.stringify(analyze('public/plates/pc-off.png', 12), null, 2));
console.log(JSON.stringify(analyze('public/plates/pc-off-original.png', 12), null, 2));
console.log(JSON.stringify(analyze('public/plates/mac-off.png', 12), null, 2));
