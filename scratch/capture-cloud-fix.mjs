/**
 * Captura rápida del estado final de la Escena 04 — Cloud Screen corregida
 * Basado en test-interactive-mac.mjs (infraestructura ya probada)
 */
import fs from 'fs';
import path from 'path';
import http from 'http';
import { spawn } from 'child_process';

const CDP_PORT = 9302;
const APP_PORT = 5192;
const DIST = path.resolve('dist');
const MIME = {
  '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
};

const server = http.createServer((req, res) => {
  let file = path.join(DIST, req.url === '/' ? 'index.html' : req.url.split('?')[0]);
  if (!fs.existsSync(file)) file = path.join(DIST, 'index.html');
  res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});
await new Promise(r => server.listen(APP_PORT, r));
console.log('HTTP server on port', APP_PORT);

const userDir = path.resolve('scratch/chrome-cloud-fix-' + Date.now());
fs.mkdirSync(userDir, { recursive: true });

const chromeProc = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
  '--headless=new', '--no-sandbox',
  '--remote-debugging-port=' + CDP_PORT,
  '--remote-debugging-address=127.0.0.1', '--user-data-dir=' + userDir,
  '--no-first-run', '--no-default-browser-check',
  '--disable-gpu-sandbox', '--enable-webgl', '--ignore-gpu-blocklist',
  '--window-size=1540,900',
  'http://127.0.0.1:' + APP_PORT,
]);
chromeProc.stderr.on('data', d => process.stderr.write(d));

let targets = null;
for (let i = 0; i < 50; i++) {
  await new Promise(r => setTimeout(r, 400));
  try {
    const res = await fetch('http://127.0.0.1:' + CDP_PORT + '/json/list');
    targets = await res.json();
    if (targets && targets.length) { console.log('CDP connected at attempt', i); break; }
  } catch (e) {
    if (i % 10 === 0) console.log('Waiting CDP attempt', i, e.message);
  }
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
function send(method, params = {}) {
  return new Promise(r => { const cur = id++; cbs.set(cur, r); ws.send(JSON.stringify({ id: cur, method, params })); });
}

await send('Runtime.enable');
await send('Page.enable');

console.log('Esperando montaje...');
await new Promise(r => setTimeout(r, 2500));

// Boot escena 01
console.log('Boot Escena 01...');
await send('Runtime.evaluate', { expression: `window.dispatchEvent(new MouseEvent('click', { bubbles: true }));` });
for (let i = 0; i < 40; i++) {
  await new Promise(r => setTimeout(r, 500));
  const chk = await send('Runtime.evaluate', {
    expression: `window.__legado_sceneStore ? window.__legado_sceneStore.get().booted : false`,
    returnByValue: true,
  });
  if (chk.result.value === true) { console.log('✓ Boot CRT ok'); break; }
}
await new Promise(r => setTimeout(r, 800));

// Navegar a Escena 04
console.log('Navegando a Escena 04...');
await send('Runtime.evaluate', {
  expression: `
    const store = window.__legado_sceneStore;
    if (store) { store.set({ scene: 3 }); }
  `,
});
await new Promise(r => setTimeout(r, 3500)); // Esperar paneo horizontal

// Click para encender la MacBook — clic en el centro de la pantalla
console.log('Encendiendo MacBook...');
await send('Input.dispatchMouseEvent', {
  type: 'mousePressed', x: 752, y: 350, button: 'left', clickCount: 1,
});
await send('Input.dispatchMouseEvent', {
  type: 'mouseReleased', x: 752, y: 350, button: 'left', clickCount: 1,
});
await new Promise(r => setTimeout(r, 4500)); // Esperar animación completa

// Screenshot
console.log('Capturando screenshot...');
const shot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
fs.writeFileSync('scratch/cloud-screen-corrected.png', Buffer.from(shot.data, 'base64'));
console.log('✓ Guardado: scratch/cloud-screen-corrected.png');

ws.close();
chromeProc.kill();
server.close();
