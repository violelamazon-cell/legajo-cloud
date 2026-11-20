import fs from 'fs';
import path from 'path';
import http from 'http';
import { spawn } from 'child_process';

const PORT = 5191;
const server = http.createServer((req, res) => {
  const p = path.resolve('public/plates/pc-off.png');
  res.writeHead(200, { 'Content-Type': 'image/png' });
  fs.createReadStream(p).pipe(res);
}).listen(PORT, async () => {
  const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    '--remote-debugging-port=9225',
    'http://localhost:' + PORT
  ]);
  await new Promise(r => setTimeout(r, 1500));
  const res = await fetch('http://127.0.0.1:9225/json/list');
  const targets = await res.json();
  const page = targets.find(t => t.type === 'page');
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise(r => ws.onopen = r);
  let id = 1;
  const send = (m, p = {}) => new Promise(r => {
    const cur = id++;
    const handler = (e) => {
      const data = JSON.parse(e.data);
      if (data.id === cur) { ws.removeEventListener('message', handler); r(data.result); }
    };
    ws.addEventListener('message', handler);
    ws.send(JSON.stringify({ id: cur, method: m, params: p }));
  });
  await send('Runtime.enable');
  const expr = `new Promise(resolve => {
    const img = new Image();
    img.src = 'http://localhost:${PORT}';
    img.onload = () => {
      const c = document.createElement('canvas');
      c.width = img.width; c.height = img.height;
      const ctx = c.getContext('2d');
      ctx.drawImage(img, 0, 0);
      const d = ctx.getImageData(0, 0, c.width, c.height).data;
      let minX = c.width, maxX = 0, minY = c.height, maxY = 0;
      for (let y = 0; y < c.height; y++) {
        for (let x = 0; x < c.width; x++) {
          const a = d[(y * c.width + x) * 4 + 3];
          const r = d[(y * c.width + x) * 4];
          const g = d[(y * c.width + x) * 4 + 1];
          const b = d[(y * c.width + x) * 4 + 2];
          if (a > 30 && (r > 15 || g > 15 || b > 15)) {
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;
          }
        }
      }
      resolve({ w: img.width, h: img.height, minX, maxX, minY, maxY, pw: maxX - minX, ph: maxY - minY, cy: (minY + maxY) / 2 });
    };
  })`;
  const out = await send('Runtime.evaluate', {
    expression: expr,
    awaitPromise: true,
    returnByValue: true
  });
  console.log('EXACT PC BOUNDS:', JSON.stringify(out.result.value));
  chrome.kill();
  server.close();
  process.exit(0);
});
