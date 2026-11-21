import fs from 'fs';
import path from 'path';
import http from 'http';
import { spawn } from 'child_process';

const PORT = 5198;
const DIST = path.resolve('dist');
const MIME = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css', '.png': 'image/png', '.woff2': 'font/woff2' };

const server = http.createServer((req, res) => {
  let file = path.join(DIST, req.url === '/' ? 'index.html' : req.url.split('?')[0]);
  if (!fs.existsSync(file)) file = path.join(DIST, 'index.html');
  res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});
await new Promise((r) => server.listen(PORT, r));

const userDir = path.resolve('scratch/chrome-test-scenes');
fs.mkdirSync(userDir, { recursive: true });

const chromeProc = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
  '--headless=new',
  '--no-sandbox',
  '--remote-debugging-port=9226',
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
    const res = await fetch('http://127.0.0.1:9226/json/list');
    targets = await res.json();
    if (targets && targets.length) break;
  } catch (err) {}
}

const pageTarget = targets.find((t) => t.type === 'page');
const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);
let id = 1;
const cbs = new Map();
const exceptions = [];
ws.onmessage = (e) => {
  const m = JSON.parse(e.data);
  if (m.method === 'Runtime.exceptionThrown') {
    exceptions.push(m);
  }
  if (m.id && cbs.has(m.id)) {
    cbs.get(m.id)(m.result || m.error || m);
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
await new Promise((r) => setTimeout(r, 1500));

// Test each scene
const scenesToTest = ['s0', 's1', 's2', 's3', 's4', 's5', 's6'];
const sceneResults = {};

for (const label of scenesToTest) {
  const res = await send('Runtime.evaluate', {
    expression: `(() => {
      const st = window.ScrollTrigger.getAll()[0];
      const tl = st.animation;
      const targetTime = tl.labels['${label}'];
      tl.seek(targetTime, false);
      if (window.__legado_applyRig) window.__legado_applyRig();

      const getStyle = (sel) => {
        const el = document.querySelector(sel);
        if (!el) return null;
        const cs = window.getComputedStyle(el);
        return { opacity: cs.opacity, visibility: cs.visibility, display: cs.display };
      };

      return {
        label: '${label}',
        time: targetTime,
        rig: { ...window.__legado_rig },
        scene1: getStyle('#scene-1'),
        scene2: getStyle('#scene-2'),
        scene3: getStyle('#scene-3'),
        scene4: getStyle('#scene-4'),
        scene5: getStyle('#scene-5'),
        scene6: getStyle('#scene-6'),
        scene7: getStyle('#scene-7'),
        stratLayer: getStyle('.strat-layer'),
        cloudWrapper: getStyle('#cloud-screen-wrapper')
      };
    })()`,
    returnByValue: true
  });
  sceneResults[label] = res;

  const shot = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(`scratch/scene-${label}.png`, Buffer.from(shot.data, 'base64'));
}

console.log('SCENE RESULTS:', JSON.stringify(sceneResults, null, 2));
console.log('EXCEPTIONS:', JSON.stringify(exceptions));

ws.close();
chromeProc.kill();
server.close();
process.exit(0);
