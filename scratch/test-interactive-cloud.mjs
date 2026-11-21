import fs from 'fs';
import path from 'path';
import http from 'http';
import { spawn } from 'child_process';

const PORT = 5183;
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

const userDir = path.resolve('scratch/chrome-cloud-' + Date.now());
fs.mkdirSync(userDir, { recursive: true });

const CDP_PORT = 9297;
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

console.log('1. Esperando montaje inicial...');
await new Promise(r => setTimeout(r, 2200));

// 1. Boot CRT (Escena 01)
console.log('2. Booting CRT Escena 01...');
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
await new Promise(r => setTimeout(r, 600));

async function capture(outName) {
  await new Promise(r => setTimeout(r, 400));
  const shot = await send('Page.captureScreenshot', { format: 'png' });
  const p = path.resolve(`scratch/${outName}`);
  fs.writeFileSync(p, Buffer.from(shot.data, 'base64'));
  console.log(`✓ Saved ${outName}`);
}

async function getState() {
  const res = await send('Runtime.evaluate', {
    expression: `
      (() => {
        const off = document.querySelector('.mac-plate--off');
        const cs = document.querySelector('#cloud-screen');
        const prompt = document.querySelector('.mac-boot-prompt');
        const s4 = document.querySelector('#scene-4');
        const s5 = document.querySelector('#scene-5');
        const pct = document.querySelector('.cloud-progress-percent');
        const fill = document.querySelector('.cloud-progress-fill');
        const title = document.querySelector('.cloud-title');
        const glow = document.querySelector('.mac-floor-glow');

        const csStyle = el => el ? window.getComputedStyle(el) : null;
        const csCS = csStyle(cs);
        const csPrompt = csStyle(prompt);
        const csS4 = csStyle(s4);
        const csS5 = csStyle(s5);

        return {
          store: window.__legado_sceneStore ? window.__legado_sceneStore.get() : null,
          hasOffPlate: !!off,
          cs: csCS ? { visibility: csCS.visibility, opacity: csCS.opacity } : null,
          prompt: csPrompt ? { display: csPrompt.display, opacity: csPrompt.opacity, text: prompt.innerText } : null,
          scene4: csS4 ? { visibility: csS4.visibility, opacity: csS4.opacity } : null,
          scene5: csS5 ? { visibility: csS5.visibility, opacity: csS5.opacity } : null,
          percentText: pct ? pct.innerText : null,
          fillWidth: fill ? fill.style.width : null,
          titleText: title ? title.innerText : null,
          glowOpacity: glow ? window.getComputedStyle(glow).opacity : null,
        };
      })()
    `,
    returnByValue: true,
  });
  return res.result.value;
}

// 3. Navegar con goToScene(3) hacia Escena 04
console.log('3. Navegando a Escena 04 con __legado_goToScene(3)...');
await send('Runtime.evaluate', { expression: `window.__legado_goToScene(3)` });
await new Promise(r => setTimeout(r, 2200));

let st1 = await getState();
console.log('Estado al llegar a Escena 04 (reposo de espera):', st1);
await capture('cloud-1-arrived-off.png');

// 4. Intento de avance a Escena 05 bloqueado antes del boot
console.log('4. Intentando avanzar a Escena 05 (debe estar bloqueado)...');
await send('Runtime.evaluate', { expression: `window.__legado_goToScene(4)` });
await new Promise(r => setTimeout(r, 1200));
let stBlocked = await getState();
console.log('Escena tras intento bloqueado a 05 (debe ser 3):', stBlocked.store.scene);

// 5. Clic para encender la MacBook
console.log('5. Haciendo clic para encender la MacBook...');
await send('Runtime.evaluate', {
  expression: `
    (() => {
      const target = document.querySelector('.mac-boot-prompt') || document.querySelector('#scene-4 .mac-plate--off');
      if (target) target.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    })()
  `,
});

// Captura Fase 1: Flash inicial (a los 200ms)
await new Promise(r => setTimeout(r, 200));
await capture('cloud-2-phase1-flash.png');

// Captura Fase 2 / 3: Construcción y progreso (a los 1000ms adicionales)
await new Promise(r => setTimeout(r, 1000));
let stProgress = await getState();
console.log('Progreso intermedio:', { pct: stProgress.percentText, fill: stProgress.fillWidth });
await capture('cloud-3-phase3-progress.png');

// Captura Fase 4: Estado final completo (a los 1700ms adicionales)
await new Promise(r => setTimeout(r, 1700));
let stFinal = await getState();
console.log('Estado final tras boot:', stFinal);
await capture('cloud-4-phase4-final.png');

// 6. Test de reversibilidad: Retroceder a Escena 03 (s2)
console.log('6. Retrocediendo a Escena 03 (__legado_goToScene(2))...');
await send('Runtime.evaluate', { expression: `window.__legado_goToScene(2)` });
await new Promise(r => setTimeout(r, 1800));
await capture('cloud-5-reversed-to-s2.png');

// 7. Volver a Escena 04: Comprobar persistencia (la notebook debe permanecer encendida con interfaz completa)
console.log('7. Volviendo a Escena 04 (__legado_goToScene(3))...');
await send('Runtime.evaluate', { expression: `window.__legado_goToScene(3)` });
await new Promise(r => setTimeout(r, 1800));
let stPersist = await getState();
console.log('Estado tras regresar a Escena 04 (persistencia):', {
  migrationBooted: stPersist.store.migrationBooted,
  cs: stPersist.cs,
  percent: stPersist.percentText,
  fillWidth: stPersist.fillWidth
});
await capture('cloud-6-persisted-on.png');

// 8. Continuidad: Avanzar a Escena 05 (__legado_goToScene(4))
console.log('8. Avanzando a Escena 05 (__legado_goToScene(4))...');
await send('Runtime.evaluate', { expression: `window.__legado_goToScene(4)` });
await new Promise(r => setTimeout(r, 1800));
let stScene5 = await getState();
console.log('Estado en Escena 05:', {
  scene: stScene5.store.scene,
  scene5: stScene5.scene5
});
await capture('cloud-7-scene05-strategies.png');

console.log('✓ Validaciones automatizadas completadas.');

ws.close();
chromeProc.kill();
server.close();
process.exit(0);
