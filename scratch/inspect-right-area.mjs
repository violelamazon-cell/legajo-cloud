import fs from 'fs';
import { unfilterPng } from './analyze-plates.mjs';

for (const file of ['public/plates/pc-off.png', 'public/plates/mac-off.png']) {
  const { width, height, bpp, data } = unfilterPng(fs.readFileSync(file));
  console.log('===', file, '===');
  // Check y=100, 300, 500, 700, 900 across x=1360..1535
  for (const y of [100, 300, 500, 700, 900]) {
    const idx1360 = (y * width + 1360) * bpp;
    const idx1400 = (y * width + 1400) * bpp;
    const idx1530 = (y * width + 1530) * bpp;
    console.log(`y=${y}: 1360:[${data[idx1360]},${data[idx1360+1]},${data[idx1360+2]}] 1400:[${data[idx1400]},${data[idx1400+1]},${data[idx1400+2]}] 1530:[${data[idx1530]},${data[idx1530+1]},${data[idx1530+2]}]`);
  }
}
