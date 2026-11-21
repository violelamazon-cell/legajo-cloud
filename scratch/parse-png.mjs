import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

function parsePng(filePath) {
  const buf = fs.readFileSync(filePath);
  let pos = 8;
  let width, height, bitDepth, colorType;
  const idatChunks = [];

  while (pos < buf.length) {
    const len = buf.readUInt32BE(pos);
    const type = buf.toString('ascii', pos + 4, pos + 8);
    if (type === 'IHDR') {
      width = buf.readUInt32BE(pos + 8);
      height = buf.readUInt32BE(pos + 12);
      bitDepth = buf[pos + 16];
      colorType = buf[pos + 17];
    } else if (type === 'IDAT') {
      idatChunks.push(buf.subarray(pos + 8, pos + 8 + len));
    } else if (type === 'IEND') {
      break;
    }
    pos += 12 + len;
  }

  const compressed = Buffer.concat(idatChunks);
  const decompressed = zlib.inflateSync(compressed);

  // Bytes per pixel: colorType 6 is RGBA (4 bytes), 2 is RGB (3 bytes)
  const bpp = colorType === 6 ? 4 : 3;
  const stride = 1 + width * bpp;

  let minX = width, maxX = 0, minY = height, maxY = 0;

  for (let y = 0; y < height; y++) {
    const rowStart = y * stride + 1; // skip filter byte
    for (let x = 0; x < width; x++) {
      const idx = rowStart + x * bpp;
      const r = decompressed[idx];
      const g = decompressed[idx + 1];
      const b = decompressed[idx + 2];
      const a = bpp === 4 ? decompressed[idx + 3] : 255;
      if (a > 15 && (r > 15 || g > 15 || b > 15)) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  return {
    file: path.basename(filePath),
    width,
    height,
    bpp,
    laptop: {
      minX, maxX, minY, maxY,
      w: maxX - minX + 1,
      h: maxY - minY + 1,
      centerX: (minX + maxX) / 2,
      centerY: (minY + maxY) / 2,
    }
  };
}

console.log(JSON.stringify(parsePng('public/plates/mac-off.png.png'), null, 2));
console.log(JSON.stringify(parsePng('public/plates/mac-on.png.png'), null, 2));
