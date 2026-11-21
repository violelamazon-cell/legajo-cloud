import fs from 'fs';
import zlib from 'zlib';

function unfilterPng(buf) {
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
    if (pb <= pc) return b;
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

function findFeatures(file) {
  const { width, height, bpp, data } = unfilterPng(fs.readFileSync(file));

  let frontLipY = 0;
  const midX = Math.floor(width / 2);
  for (let y = height - 1; y >= 0; y--) {
    const idx = (y * width + midX) * bpp;
    if (data[idx] > 40 || data[idx+1] > 40 || data[idx+2] > 40) {
      frontLipY = y;
      break;
    }
  }

  let topLidY = 0;
  for (let y = 0; y < height; y++) {
    const idx = (y * width + midX) * bpp;
    if (data[idx] > 30 || data[idx+1] > 30 || data[idx+2] > 30) {
      topLidY = y;
      break;
    }
  }

  return { file, frontLipY, topLidY, laptopHeight: frontLipY - topLidY };
}

console.log(findFeatures('public/plates/mac-off.png.png'));
console.log(findFeatures('public/plates/mac-on.png.png'));
