import fs from 'fs';
import path from 'path';
import http from 'http';
import { spawn } from 'child_process';

const PORT = 5190;
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
await new Promise(r => server.listen(PORT, r));

const userDir = path.resolve('scratch/chrome-interact-' + Date.now());
fs.mkdirSync(userDir, { recursive: true });

const chromeProc = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
  '--headless=new',
  '--no-sandbox',
  '--remote-debugging-port=9298',
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

chromeProc.stderr.on('data', d => console.log('[Chrome err]', d.toString()));
chromeProc.stdout.on('data', d => console.log('[Chrome out]', d.toString()));
chromeProc.on('exit', code => console.log('[Chrome exited with]', code));

let targets = null;
for (let i = 0; i < 40; i++) {
  await new Promise(r => setTimeout(r, 400));
  try {
    const res = await fetch('http://127.0.0.1:9298/json/list');
    targets = await res.json();
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

// 0. Esperar que React y Three.js se monten
console.log('Esperando montaje de la aplicación...');
await new Promise(r => setTimeout(r, 2200));

// 1. Boot CRT (Escena 01)
console.log('Iniciando Boot CRT Escena 01...');
await send('Runtime.evaluate', { expression: `window.dispatchEvent(new MouseEvent('click', { bubbles: true }));` });

// Esperar activamente hasta que booted sea true
for (let i = 0; i < 40; i++) {
  await new Promise(r => setTimeout(r, 500));
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

async function getState() {
  const res = await send('Runtime.evaluate', {
    expression: `
      (() => {
        const off = document.querySelector('.mac-plate--off');
        const on = document.querySelector('.mac-plate--on');
        const prompt = document.querySelector('.mac-boot-prompt');
        const flash = document.querySelector('.mac-screen-flash');
        const glow = document.querySelector('.mac-floor-glow');
        const s4 = document.querySelector('#scene-4');
        const s5 = document.querySelector('#scene-5');

        const cs = el => el ? window.getComputedStyle(el) : null;
        const csOff = cs(off);
        const csOn = cs(on);
        const csPrompt = cs(prompt);
        const csFlash = cs(flash);
        const csGlow = cs(glow);
        const csS4 = cs(s4);
        const csS5 = cs(s5);

        return {
          store: window.__legado_sceneStore ? window.__legado_sceneStore.get() : null,
          rig: window.__legado_rig ? { tx: window.__legado_rig.tx, s: window.__legado_rig.s } : null,
          macOff: csOff ? { opacity: csOff.opacity, visibility: csOff.visibility } : null,
          macOn: csOn ? { opacity: csOn.opacity, visibility: csOn.visibility } : null,
          prompt: csPrompt ? { opacity: csPrompt.opacity, display: csPrompt.display, text: prompt ? prompt.innerText : null } : null,
          flash: csFlash ? { opacity: csFlash.opacity, transform: csFlash.transform } : null,
          glow: csGlow ? { opacity: csGlow.opacity } : null,
          scene4: csS4 ? { opacity: csS4.opacity, visibility: csS4.visibility } : null,
          scene5: csS5 ? { opacity: csS5.opacity, visibility: csS5.visibility } : null,
        };
      })()
    `,
    returnByValue: true,
  });
  return res.result.value;
}

async function captureShot(filename) {
  await new Promise(r => setTimeout(r, 500));
  const shot = await send('Page.captureScreenshot', { format: 'png' });
  const p = path.resolve(`scratch/${filename}`);
  fs.writeFileSync(p, Buffer.from(shot.data, 'base64'));
  console.log(`Saved scratch/${filename}`);
}

console.log('\n=== TEST 1: Navegar a Escena 04 (Llegada a la MacBook) ===');
await send('Runtime.evaluate', { expression: `window.__legado_goToScene(3)` });
await new Promise(r => setTimeout(r, 1800));

let st1 = await getState();
console.log('Estado al llegar a s3 (espera interactiva):');
console.log(JSON.stringify(st1, null, 2));
await captureShot('test-1-arrival-waiting.png');

console.log('\n=== TEST 2: Esperar 2.5 segundos — debe seguir apagada ===');
await new Promise(r => setTimeout(r, 2500));
let st2 = await getState();
console.log('macOn opacity después de esperar:', st2.macOn.opacity, 'visibility:', st2.macOn.visibility);
console.log('Prompt visible:', st2.prompt ? st2.prompt.text : 'no prompt');
if (st2.macOn.opacity === '0' && st2.macOn.visibility === 'hidden') {
  console.log('✓ PASS: La MacBook permanece apagada sin timeouts');
} else {
  console.log('✗ FAIL: La MacBook se encendió sola');
}

console.log('\n=== TEST 3: Intento de avanzar a Escena 05 bloqueado ===');
await send('Runtime.evaluate', { expression: `window.__legado_goToScene(4)` });
await new Promise(r => setTimeout(r, 1200));
let st3 = await getState();
console.log('Escena actual tras intentar ir a 05:', st3.store.scene);
console.log('Escena 05 visibilidad:', st3.scene5.visibility, 'opacity:', st3.scene5.opacity);
if (st3.store.scene === 3 && st3.scene5.visibility === 'hidden') {
  console.log('✓ PASS: Bloqueo hacia Escena 05 funcionando selectivamente');
} else {
  console.log('✗ FAIL: Se pudo avanzar a Escena 05 sin encender');
}

console.log('\n=== TEST 4: Permitir retroceder a Escena 03 libremente ===');
await send('Runtime.evaluate', { expression: `window.__legado_goToScene(2)` });
await new Promise(r => setTimeout(r, 1500));
let st4 = await getState();
console.log('Escena actual tras retroceder a 03:', st4.store.scene);
if (st4.store.scene === 2) {
  console.log('✓ PASS: Retroceso a Escena 03 permitido');
}
await captureShot('test-4-reversed-to-s2.png');

console.log('\n=== TEST 5: Regresar a Escena 04 — debe seguir apagada esperando clic ===');
await send('Runtime.evaluate', { expression: `window.__legado_goToScene(3)` });
await new Promise(r => setTimeout(r, 1500));
let st5 = await getState();
console.log('macOn tras regresar:', st5.macOn.opacity, 'prompt:', st5.prompt?.text);
if (st5.macOn.opacity === '0' && st5.prompt) {
  console.log('✓ PASS: Al regresar a Escena 04 sigue apagada esperando clic');
}

console.log('\n=== TEST 6: HACER CLIC para iniciar encendido interactivo ===');
// Hacemos clic sobre el prompt o la MacBook
await send('Runtime.evaluate', {
  expression: `
    (() => {
      const prompt = document.querySelector('.mac-boot-prompt') || document.querySelector('#scene-4 .mac-plate--off');
      if (prompt) {
        prompt.dispatchEvent(new MouseEvent('click', { bubbles: true }));
        return true;
      }
      return false;
    })()
  `
});

// Capturar momento de destello en pantalla (flash)
await new Promise(r => setTimeout(r, 220));
let stFlash = await getState();
console.log('Flash en pantalla durante encendido:', stFlash.flash);
await captureShot('test-6-screen-flash.png');

// Esperar a que culmine la animación de encendido (~900ms)
await new Promise(r => setTimeout(r, 900));
let stBooted = await getState();
console.log('Estado final tras boot:', {
  migrationBooted: stBooted.store.migrationBooted,
  macOn: stBooted.macOn,
  glow: stBooted.glow,
  prompt: stBooted.prompt
});
await captureShot('test-6-booted-100pct.png');

if (stBooted.store.migrationBooted && stBooted.macOn.opacity === '1' && stBooted.macOn.visibility === 'visible') {
  console.log('✓ PASS: Encendido interactivo completado al 100%');
} else {
  console.log('✗ FAIL: Encendido interactivo incompleto');
}

console.log('\n=== TEST 7: Desbloqueo y avance natural hacia Escena 05 ===');
await send('Runtime.evaluate', { expression: `window.__legado_goToScene(4)` });
await new Promise(r => setTimeout(r, 1600));
let stStrategies = await getState();
console.log('Escena actual tras boot:', stStrategies.store.scene);
console.log('Escena 05 visible:', stStrategies.scene5);
await captureShot('test-7-strategies-scene05.png');

if (stStrategies.store.scene === 4 && stStrategies.scene5.visibility === 'visible') {
  console.log('✓ PASS: Avance a Escena 05 completado naturalmente');
} else {
  console.log('✗ FAIL: No se pudo avanzar a Escena 05');
}

console.log('\n=== TEST 8: Persistencia: volver a Escena 04 y debe continuar encendida ===');
await send('Runtime.evaluate', { expression: `window.__legado_goToScene(3)` });
await new Promise(r => setTimeout(r, 1500));
let stReturn = await getState();
console.log('macOn tras volver a escena 04:', stReturn.macOn);
console.log('Prompt tras volver:', stReturn.prompt);
await captureShot('test-8-persist-scene04.png');

if (stReturn.macOn.opacity === '1' && stReturn.store.migrationBooted && (!stReturn.prompt || stReturn.prompt.display === 'none')) {
  console.log('✓ PASS: Persistencia perfecta (la MacBook sigue encendida al 100% sin repetir)');
} else {
  console.log('✗ FAIL: La persistencia falló');
}

ws.close();
chromeProc.kill();
server.close();
process.exit(0);
