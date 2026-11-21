import fs from 'fs';
import path from 'path';
import http from 'http';
import { spawn } from 'child_process';

const PORT = 5198;
const server = http.createServer((req, res) => {
  const p = path.resolve(req.url.replace(/^\//, ''));
  if (fs.existsSync(p)) {
    res.writeHead(200, { 'Content-Type': 'image/png' });
    fs.createReadStream(p).pipe(res);
  } else {
    res.writeHead(404);
    res.end();
  }
});
await new Promise(r => server.listen(PORT, r));

const chromeProc = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
  '--headless=new',
  '--no-sandbox',
  '--remote-debugging-port=9299',
  '--remote-debugging-address=127.0.0.1',
  '--user-data-dir=' + path.resolve('scratch/chrome-measure-mac'),
  'about:blank'
]);

let targets = null;
for (let i = 0; i < 30; i++) {
  await new Promise(r => setTimeout(r, 400));
  try {
    const res = await fetch('http://127.0.0.1:9299/json/list');
    targets = await res.json();
    if (targets && targets.length) break;
  } catch {}
}

const page = targets.find(t => t.type === 'page');
const ws = new WebSocket(page.webSocketDebuggerUrl);
let id = 1;
const cbs = new Map();
ws.onmessage = e => {
  const m = JSON.parse(e.data);
  if (m.id && cbs.has(m.id)) {
    cbs.get(m.id)(m.result);
    cbs.delete(m.id);
  }
};
await new Promise(r => (ws.onopen = r));
function send(method, params = {}) {
  return new Promise(r => {
    const cur = id++;
    cbs.set(cur, r);
    ws.send(JSON.stringify({ id: cur, method, params }));
  });
}

await send('Runtime.enable');

const measureResult = await send('Runtime.evaluate', {
  expression: `
    (async () => {
      async function inspectImage(url) {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = url;
        await new Promise(r => img.onload = r);
        const w = img.naturalWidth;
        const h = img.naturalHeight;
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        const data = ctx.getImageData(0, 0, w, h).data;
        
        let minX = w, maxX = 0, minY = h, maxY = 0;
        for (let y = 0; y < h; y++) {
          for (let x = 0; x < w; x++) {
            const idx = (y * w + x) * 4;
            const r = data[idx];
            const g = data[idx + 1];
            const b = data[idx + 2];
            const a = data[idx + 3];
            // If pixel is non-black (intensity > 15 and alpha > 20)
            if (a > 20 && (r > 15 || g > 15 || b > 15)) {
              if (x < minX) minX = x;
              if (x > maxX) maxX = x;
              if (y < minY) minY = y;
              if (y > maxY) maxY = y;
            }
          }
        }
        return {
          imageWidth: w,
          imageHeight: h,
          aspectRatio: (w / h).toFixed(4),
          laptopBBox: {
            minX, maxX, minY, maxY,
            width: maxX - minX + 1,
            height: maxY - minY + 1,
            centerX: ((minX + maxX) / 2).toFixed(1),
            centerY: ((minY + maxY) / 2).toFixed(1),
          }
        };
      }

      const off = await inspectImage('http://127.0.0.1:${PORT}/public/plates/mac-off.png.png');
      const on = await inspectImage('http://127.0.0.1:${PORT}/public/plates/mac-on.png.png');
      return JSON.stringify({ off, on });
    })()
  `,
  awaitPromise: true,
  returnByValue: true,
});

console.log(measureResult.result.value);

ws.close();
chromeProc.kill();
server.close();
process.exit(0);
