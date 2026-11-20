import fs from 'fs';
import path from 'path';
import http from 'http';
import { spawn } from 'child_process';

const PORT = 5195;
const DIST = path.resolve('dist');
const MIME = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' };

const server = http.createServer((req, res) => {
  let file = path.join(DIST, req.url === '/' ? 'index.html' : req.url.split('?')[0]);
  if (!fs.existsSync(file)) file = path.join(DIST, 'index.html');
  res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});
await new Promise(r => server.listen(PORT, r));

const userDir = path.resolve('scratch/chrome-err-test');
fs.mkdirSync(userDir, { recursive: true });

const chromeProc = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
  '--headless=new',
  '--no-sandbox',
  '--remote-debugging-port=9229',
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
  await new Promise(r => setTimeout(r, 400));
  try {
    const res = await fetch('http://127.0.0.1:9229/json/list');
    targets = await res.json();
    if (targets && targets.length) break;
  } catch {}
}

const pageTarget = targets.find(t => t.type === 'page');
const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);
let id = 1;
const cbs = new Map();
const consoleLogs = [];

ws.onmessage = (e) => {
  const m = JSON.parse(e.data);
  if (m.method === 'Runtime.consoleAPICalled') {
    consoleLogs.push({ type: m.params.type, text: m.params.args.map(a => a.value || a.description).join(' ') });
  }
  if (m.method === 'Runtime.exceptionThrown') {
    consoleLogs.push({ type: 'error', text: m.params.exceptionDetails.text });
  }
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
await send('Page.enable');

// Click boot
await send('Runtime.evaluate', { expression: `window.dispatchEvent(new MouseEvent('click', { bubbles: true }));` });
await new Promise(r => setTimeout(r, 3600));

// Seek to s2
await send('Runtime.evaluate', {
  expression: `
    (() => {
      const st = window.ScrollTrigger.getAll()[0];
      const tl = st.animation;
      const s2Time = tl.labels['s2'];
      tl.seek(s2Time - 0.05, false);
      if (window.__legado_applyRig) window.__legado_applyRig();
    })()
  `
});
await new Promise(r => setTimeout(r, 1000));

console.log('Console logs captured:', consoleLogs.length);
const errors = consoleLogs.filter(l => l.type === 'error');
console.log('Console errors found:', errors.length);
if (errors.length) console.log(errors);

ws.close();
chromeProc.kill();
server.close();
process.exit(0);
