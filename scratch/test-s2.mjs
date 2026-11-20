import fs from 'fs';
import path from 'path';
import http from 'http';
import { spawn } from 'child_process';

const PORT = 5189;
const DIST = path.resolve('dist');
const MIME = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css', '.png': 'image/png', '.woff2': 'font/woff2' };

const server = http.createServer((req, res) => {
  let file = path.join(DIST, req.url === '/' ? 'index.html' : req.url.split('?')[0]);
  if (!fs.existsSync(file)) file = path.join(DIST, 'index.html');
  res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});
await new Promise((r) => server.listen(PORT, r));

const userDir = path.resolve('scratch/chrome-test-' + Date.now());
fs.mkdirSync(userDir, { recursive: true });

const chromeProc = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
  '--headless=new',
  '--no-sandbox',
  '--remote-debugging-port=9223',
  '--remote-debugging-address=127.0.0.1',
  '--user-data-dir=' + userDir,
  '--no-first-run',
  '--no-default-browser-check',
  '--disable-gpu-sandbox',
  '--enable-webgl',
  '--ignore-gpu-blocklist',
  '--window-size=1587,900',
  'http://127.0.0.1:' + PORT,
]);

let targets = null;
for (let i = 0; i < 30; i++) {
  await new Promise((r) => setTimeout(r, 500));
  try {
    const res = await fetch('http://127.0.0.1:9223/json/list');
    targets = await res.json();
    if (targets && targets.length) {
      console.log('Got targets:', targets.length);
      break;
    }
  } catch (err) {
    // waiting
  }
}

const pageTarget = targets.find((t) => t.type === 'page');
const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);
let id = 1;
const cbs = new Map();
ws.onmessage = (e) => {
  const m = JSON.parse(e.data);
  if (m.id && cbs.has(m.id)) {
    cbs.get(m.id)(m.result);
    cbs.delete(m.id);
  }
};
await new Promise((r) => (ws.onopen = r));
function send(method, params = {}) {
  return new Promise((r) => {
    const cur = id++;
    cbs.set(cur, r);
    ws.send(JSON.stringify({ id: cur, method, params }));
  });
}

await send('Page.enable');
await send('Runtime.enable');
await new Promise((r) => setTimeout(r, 2000));

// Click boot
await send('Runtime.evaluate', {
  expression: `window.dispatchEvent(new MouseEvent('click', { bubbles: true }));`,
});
await new Promise((r) => setTimeout(r, 3500));

// Seek master timeline to label 's2'
const debugInfo = await send('Runtime.evaluate', {
  expression: `
    (() => {
      const st = window.ScrollTrigger.getAll()[0];
      const tl = st.animation;
      const s2Time = tl.labels['s2'];
      // seek exactly to label s2 reposo
      tl.seek(s2Time - 0.05, false);
      if (window.__legado_applyRig) window.__legado_applyRig();

      // force invalidate R3F
      const canvas = document.querySelector('canvas');
      return JSON.stringify({
        labels: tl.labels,
        duration: tl.duration(),
        s2Time,
        rig: window.__legado_rig,
        pcBounds: document.querySelector('#pc-scalable-frame')?.getBoundingClientRect(),
        labelBounds: document.querySelector('.wrap-label')?.getBoundingClientRect(),
        wrapperFloor: document.querySelector('.wrapper-floor')?.getBoundingClientRect(),
        hasCanvas: !!canvas,
      });
    })()
  `,
  returnByValue: true,
});
console.log('Debug info at s2:', debugInfo.result.value);

await new Promise((r) => setTimeout(r, 500));

// Screenshot at s2
const shot = await send('Page.captureScreenshot', { format: 'png' });
fs.writeFileSync(
  'scratch/scene03-seek-s2.png',
  Buffer.from(shot.data, 'base64')
);
console.log('Saved scene03-seek-s2.png');

ws.close();
chromeProc.kill();
server.close();
process.exit(0);

