import fs from 'fs';
import path from 'path';
import http from 'http';
import { spawn } from 'child_process';

const PORT = 5199;
const DIST = path.resolve('dist');
const MIME = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css', '.png': 'image/png', '.woff2': 'font/woff2' };

const server = http.createServer((req, res) => {
  let file = path.join(DIST, req.url === '/' ? 'index.html' : req.url.split('?')[0]);
  if (!fs.existsSync(file)) file = path.join(DIST, 'index.html');
  res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});
await new Promise((r) => server.listen(PORT, r));

const userDir = path.resolve('scratch/chrome-test-eval');
fs.mkdirSync(userDir, { recursive: true });

const chromeProc = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
  '--headless=new',
  '--no-sandbox',
  '--remote-debugging-port=9225',
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
  await new Promise((r) => setTimeout(r, 400));
  try {
    const res = await fetch('http://127.0.0.1:9225/json/list');
    targets = await res.json();
    if (targets && targets.length) break;
  } catch (err) {}
}

const pageTarget = targets.find((t) => t.type === 'page');
const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);
let id = 1;
const cbs = new Map();
const consoleLogs = [];
ws.onmessage = (e) => {
  const m = JSON.parse(e.data);
  if (m.method === 'Runtime.consoleAPICalled' || m.method === 'Runtime.exceptionThrown') {
    consoleLogs.push(m);
  }
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

const evalResult = await send('Runtime.evaluate', {
  expression: `(() => {
    const bodyChildren = document.body.innerHTML.length;
    const scene1 = document.querySelector('#scene-1');
    const pcFrame = document.querySelector('#pc-scalable-frame');
    const nav = document.querySelector('header') || document.querySelector('[class*="progress"]');
    const st = window.ScrollTrigger ? window.ScrollTrigger.getAll().length : 0;
    return {
      bodyLength: bodyChildren,
      hasScene1: !!scene1,
      scene1Visible: scene1 ? window.getComputedStyle(scene1).visibility : null,
      scene1Opacity: scene1 ? window.getComputedStyle(scene1).opacity : null,
      hasPcFrame: !!pcFrame,
      hasNav: !!nav,
      scrollTriggersCount: st,
      title: document.title
    };
  })()`,
  returnByValue: true
});

console.log('EVAL RESULT:', JSON.stringify(evalResult.result.value));
console.log('CONSOLE LOGS:', JSON.stringify(consoleLogs));

// Capture screenshot to scratch/recovery-check.png
const shot = await send('Page.captureScreenshot', { format: 'png' });
fs.writeFileSync('scratch/recovery-check.png', Buffer.from(shot.data, 'base64'));
console.log('Saved scratch/recovery-check.png');

ws.close();
chromeProc.kill();
server.close();
process.exit(0);
