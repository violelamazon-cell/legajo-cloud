import http from 'http';
import path from 'path';
import fs from 'fs';
import { spawn } from 'child_process';

const PORT = 5187;
const DIST = path.resolve('dist');
const MIME = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css', '.png': 'image/png' };
const server = http.createServer((req, res) => {
  let file = path.join(DIST, req.url === '/' ? 'index.html' : req.url.split('?')[0]);
  if (!fs.existsSync(file)) file = path.join(DIST, 'index.html');
  res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});
await new Promise(r => server.listen(PORT, r));

const userDir = path.resolve('scratch/chrome-hit-' + Date.now());
fs.mkdirSync(userDir, { recursive: true });

const chromeProc = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
  '--headless=new', '--no-sandbox', '--remote-debugging-port=9285',
  '--remote-debugging-address=127.0.0.1', '--user-data-dir=' + userDir,
  '--window-size=1587,900', 'http://127.0.0.1:' + PORT,
]);

function getTargets(port) {
  return new Promise((resolve) => {
    http.get(`http://127.0.0.1:${port}/json/list`, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        try { resolve(JSON.parse(d)); } catch { resolve(null); }
      });
    }).on('error', () => resolve(null));
  });
}

let targets = null;
for (let i = 0; i < 30; i++) {
  await new Promise(r => setTimeout(r, 400));
  targets = await getTargets(9285);
  if (targets && targets.length) break;
}
const pageTarget = targets.find(t => t.type === 'page');
const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);
let id = 1;
const cbs = new Map();
ws.onmessage = e => {
  const m = JSON.parse(e.data);
  if (m.id && cbs.has(m.id)) { cbs.get(m.id)(m.result); cbs.delete(m.id); }
};
await new Promise(r => (ws.onopen = r));
function send(m, p = {}) {
  return new Promise(r => { const c = id++; cbs.set(c, r); ws.send(JSON.stringify({ id: c, method: m, params: p })); });
}
await send('Runtime.enable');
await new Promise(r => setTimeout(r, 2200));
await send('Runtime.evaluate', { expression: `window.dispatchEvent(new MouseEvent('click', { bubbles: true }));` });

for (let i = 0; i < 30; i++) {
  await new Promise(r => setTimeout(r, 400));
  const chk = await send('Runtime.evaluate', {
    expression: `window.__legado_sceneStore ? window.__legado_sceneStore.get().booted : false`,
    returnByValue: true,
  });
  if (chk.result.value === true) break;
}
await new Promise(r => setTimeout(r, 500));

// Ir a escena 04
await send('Runtime.evaluate', { expression: 'window.__legado_goToScene(3);' });
await new Promise(r => setTimeout(r, 1800));

// Evaluar elementFromPoint en el centro de la pantalla
const hitRes = await send('Runtime.evaluate', {
  expression: `(() => {
    const cx = Math.floor(window.innerWidth / 2);
    const cy = Math.floor(window.innerHeight / 2);
    const el = document.elementFromPoint(cx, cy);
    const prompt = document.querySelector('.mac-boot-prompt');
    const promptHit = prompt ? document.elementFromPoint(cx, Math.floor(window.innerHeight * 0.46)) : null;

    function describe(e) {
      if (!e) return null;
      return {
        tag: e.tagName,
        id: e.id,
        className: e.className,
        styleCursor: window.getComputedStyle(e).cursor,
        stylePointerEvents: window.getComputedStyle(e).pointerEvents,
      };
    }

    return {
      center: describe(el),
      atPrompt: describe(promptHit),
      promptPresent: !!prompt,
      store: window.__legado_sceneStore.get(),
    };
  })()`,
  returnByValue: true,
});
console.log('Hit test results:', JSON.stringify(hitRes.result.value, null, 2));

ws.close();
chromeProc.kill();
server.close();
process.exit(0);
