import fs from 'fs';
import path from 'path';
import http from 'http';
import { spawn } from 'child_process';

const PORT = 5188;
const DIST = path.resolve('dist');

// Servidor estático para dist/
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
  if (!fs.existsSync(file)) {
    // Si no existe, servir index.html (SPA)
    file = path.join(DIST, 'index.html');
  }
  const ext = path.extname(file);
  res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});

await new Promise((resolve) => server.listen(PORT, resolve));
console.log(`Servidor local listo en http://localhost:${PORT}`);

// Lanzar Chrome headless con CDP
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const userDataDir = path.resolve('scratch/chrome-profile');
fs.mkdirSync(userDataDir, { recursive: true });

const chromeProc = spawn(chromePath, [
  '--headless=new',
  '--remote-debugging-port=9222',
  `--user-data-dir=${userDataDir}`,
  '--no-first-run',
  '--no-default-browser-check',
  '--disable-gpu-sandbox',
  '--enable-webgl',
  '--ignore-gpu-blocklist',
  '--window-size=1587,900',
  `http://localhost:${PORT}`,
], { stdio: 'ignore' });

// Esperar a que CDP esté activo
let targets = null;
for (let i = 0; i < 20; i++) {
  await new Promise((r) => setTimeout(r, 500));
  try {
    const res = await fetch('http://127.0.0.1:9222/json/list');
    targets = await res.json();
    if (targets && targets.length > 0) break;
  } catch {}
}

if (!targets || targets.length === 0) {
  chromeProc.kill();
  server.close();
  throw new Error('No se pudo conectar a Chrome CDP');
}

const pageTarget = targets.find((t) => t.type === 'page');

class CDPClient {
  constructor(wsUrl) {
    this.ws = new WebSocket(wsUrl);
    this.id = 1;
    this.callbacks = new Map();
  }

  init() {
    return new Promise((resolve, reject) => {
      this.ws.onopen = () => resolve();
      this.ws.onerror = (err) => reject(err);
      this.ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        if (msg.id && this.callbacks.has(msg.id)) {
          const cb = this.callbacks.get(msg.id);
          this.callbacks.delete(msg.id);
          if (msg.error) cb.reject(new Error(msg.error.message));
          else cb.resolve(msg.result);
        }
      };
    });
  }

  send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = this.id++;
      this.callbacks.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  close() {
    this.ws.close();
  }
}

const client = new CDPClient(pageTarget.webSocketDebuggerUrl);
await client.init();
await client.send('Page.enable');
await client.send('Runtime.enable');

console.log('Esperando carga de la aplicación...');
await new Promise((r) => setTimeout(r, 2500));

// Disparar click de arranque
console.log('Ejecutando boot click...');
await client.send('Runtime.evaluate', {
  expression: `window.dispatchEvent(new MouseEvent('click', { bubbles: true }));`,
});
await new Promise((r) => setTimeout(r, 3600));

// Función para probar resoluciones
async function captureAtViewport(w, h, filename) {
  console.log(`Ajustando viewport a ${w}x${h}...`);
  await client.send('Emulation.setDeviceMetricsOverride', {
    width: w,
    height: h,
    deviceScaleFactor: 1,
    mobile: false,
  });

  // Ir a la escena 03 reposo (s2)
  await client.send('Runtime.evaluate', {
    expression: `
      if (window.__legado_goToScene) {
        window.__legado_goToScene(2);
      }
    `,
  });
  await new Promise((r) => setTimeout(r, 2200));

  // Medir en el DOM dimensiones reales
  const evalResult = await client.send('Runtime.evaluate', {
    expression: `
      (() => {
        const pc = document.querySelector('#pc-scalable-frame')?.getBoundingClientRect();
        const stage = document.querySelector('#stage')?.getBoundingClientRect();
        const label = document.querySelector('.wrap-label')?.getBoundingClientRect();
        return JSON.stringify({
          stage: stage ? { w: stage.width, h: stage.height } : null,
          pc: pc ? { w: pc.width, h: pc.height, top: pc.top, left: pc.left } : null,
          label: label ? { w: label.width, h: label.height, top: label.top, left: label.left } : null,
        });
      })()
    `,
    returnByValue: true,
  });

  console.log(`Mediciones DOM en ${w}x${h}:`, evalResult.result.value);

  // Capturar screenshot
  const shot = await client.send('Page.captureScreenshot', { format: 'png' });
  const outPath = path.resolve(`scratch/${filename}`);
  fs.writeFileSync(outPath, Buffer.from(shot.data, 'base64'));
  console.log(`Screenshot guardado en ${outPath}`);
}

// Probar en 1587x900 y 1920x1080
await captureAtViewport(1587, 900, 'scene03-1587x900.png');
await captureAtViewport(1920, 1080, 'scene03-1920x1080.png');

client.close();
chromeProc.kill();
server.close();
console.log('Validación finalizada con éxito.');
process.exit(0);
