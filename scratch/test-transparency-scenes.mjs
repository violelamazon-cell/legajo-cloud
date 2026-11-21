import fs from 'fs';
import path from 'path';
import http from 'http';
import { spawn } from 'child_process';

const PORT = 5188;
const DIST = path.resolve('dist');
const MIME = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
};

const server = http.createServer((req, res) => {
  let file = path.join(DIST, req.url === '/' ? 'index.html' : req.url.split('?')[0]);
  if (!fs.existsSync(file)) file = path.join(DIST, 'index.html');
  res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});
await new Promise(r => server.listen(PORT, '127.0.0.1', r));

const userDir = path.resolve('scratch/chrome-transparency-' + Date.now());
fs.mkdirSync(userDir, { recursive: true });

const CDP_PORT = 9295;
const chromeProc = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
  '--headless=new',
  '--no-sandbox',
  `--remote-debugging-port=${CDP_PORT}`,
  '--remote-debugging-address=127.0.0.1',
  '--remote-allow-origins=*',
  '--user-data-dir=' + userDir,
  '--no-first-run',
  '--no-default-browser-check',
  '--disable-gpu-sandbox',
  '--enable-webgl',
  '--ignore-gpu-blocklist',
  '--window-size=1587,900',
  `http://127.0.0.1:${PORT}`,
]);

function getJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch (e) { reject(e); }
      });
    }).on('error', reject);
  });
}

let targets = null;
for (let i = 0; i < 40; i++) {
  await new Promise(r => setTimeout(r, 400));
  try {
    targets = await getJson(`http://127.0.0.1:${CDP_PORT}/json/list`);
    if (targets && targets.length) break;
  } catch (err) {
    if (i % 10 === 0) console.log(`Waiting for CDP (attempt ${i}):`, err.message);
  }
}

const pageTarget = targets.find(t => t.type === 'page');
const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);
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
await send('Page.enable');

console.log('Esperando carga y montaje...');
await new Promise(r => setTimeout(r, 2200));

// 1. Boot CRT (Escena 01)
console.log('Iniciando Boot CRT Escena 01...');
await send('Runtime.evaluate', { expression: `window.dispatchEvent(new MouseEvent('click', { bubbles: true }));` });

for (let i = 0; i < 40; i++) {
  await new Promise(r => setTimeout(r, 400));
  const chk = await send('Runtime.evaluate', {
    expression: `window.__legado_sceneStore ? window.__legado_sceneStore.get().booted : false`,
    returnByValue: true,
  });
  if (chk.result.value === true) {
    console.log(`✓ Boot CRT completado (iteración ${i})`);
    break;
  }
}
await new Promise(r => setTimeout(r, 800));

async function captureStep(timeExpr, outName) {
  await send('Runtime.evaluate', {
    expression: `
      (() => {
        const st = window.ScrollTrigger.getAll()[0];
        const tl = st.animation;
        const targetTime = ${timeExpr};
        tl.seek(targetTime, false);
        if (window.__legado_applyRig) window.__legado_applyRig();
      })()
    `,
  });
  await new Promise(r => setTimeout(r, 1200));
  const shot = await send('Page.captureScreenshot', { format: 'png' });
  const p = path.resolve(`scratch/${outName}`);
  fs.writeFileSync(p, Buffer.from(shot.data, 'base64'));
  console.log(`✓ Saved ${outName}`);
}

// Captura 1: Escena 01 (Boot completado)
await captureStep(`0`, 'transp-scene01-boot.png');

// Captura 2: Escena 02 (Matriz de decisión)
await captureStep(`tl.labels['s1']`, 'transp-scene02-decision.png');

// Captura 3: Escena 03 (Wrapper: cápsula dicroica 3D y anillos esmeralda alrededor de la PC)
await captureStep(`tl.labels['s2']`, 'transp-scene03-wrapper.png');

// Captura 4: Escena 04 (Mitad de paneo: haces de fibra óptica y partículas cruzando)
await captureStep(`tl.labels['s2'] + 1.25`, 'transp-scene04-midway.png');

// Captura 5: Escena 04 (Llegada a la MacBook apagada con haces conectando a USB-C)
await captureStep(`tl.labels['s3']`, 'transp-scene04-macbook-off.png');

console.log('Todas las capturas completadas con éxito.');

ws.close();
chromeProc.kill();
server.close();
process.exit(0);
