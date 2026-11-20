import fs from 'fs';
import path from 'path';
import http from 'http';
import { spawn } from 'child_process';

const PORT = 5192;
const DIST = path.resolve('dist');
const MIME = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' };

const server = http.createServer((req, res) => {
  let file = path.join(DIST, req.url === '/' ? 'index.html' : req.url.split('?')[0]);
  if (!fs.existsSync(file)) file = path.join(DIST, 'index.html');
  res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});
await new Promise(r => server.listen(PORT, r));

const userDataDir = path.resolve('scratch/chrome-test-profile');
fs.mkdirSync(userDataDir, { recursive: true });

const chromeProc = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
  '--headless=new',
  '--remote-debugging-port=9225',
  `--user-data-dir=${userDataDir}`,
  '--window-size=1587,900',
  'http://localhost:' + PORT
], { stdio: 'ignore' });

let targets = null;
for (let i = 0; i < 30; i++) {
  await new Promise(r => setTimeout(r, 300));
  try {
    const res = await fetch('http://127.0.0.1:9225/json/list');
    targets = await res.json();
    if (targets && targets.length) break;
  } catch {}
}

const pageTarget = targets.find(t => t.type === 'page');
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
await new Promise(r => (ws.onopen = r));
function send(method, params = {}) {
  return new Promise(r => {
    const cur = id++;
    cbs.set(cur, r);
    ws.send(JSON.stringify({ id: cur, method, params }));
  });
}

await send('Page.enable');
await send('Runtime.enable');
await new Promise(r => setTimeout(r, 1500));

// Click boot
await send('Runtime.evaluate', { expression: `window.dispatchEvent(new MouseEvent('click', { bubbles: true }));` });
await new Promise(r => setTimeout(r, 3600));

// Go to scene 03 / seek to label s2
await send('Runtime.evaluate', {
  expression: `
    (() => {
      const st = window.ScrollTrigger.getAll()[0];
      const tl = st.animation;
      const s2Time = tl.labels['s2'];
      tl.seek(s2Time, false);
      if (window.__legado_applyRig) window.__legado_applyRig();
      window.ScrollTrigger.refresh();
    })()
  `
});
await new Promise(r => setTimeout(r, 1200));

const shot = await send('Page.captureScreenshot', { format: 'png' });
const outPath = path.resolve('scratch/scene03-current.png');
fs.writeFileSync(outPath, Buffer.from(shot.data, 'base64'));
console.log('Saved', outPath);

ws.close();
chromeProc.kill();
server.close();
process.exit(0);
