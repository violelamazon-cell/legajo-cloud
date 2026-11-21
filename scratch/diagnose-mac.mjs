import fs from 'fs';
import path from 'path';
import http from 'http';
import { spawn } from 'child_process';

const PORT = 5194;
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

const userDir = path.resolve('scratch/chrome-diag-' + Date.now());
fs.mkdirSync(userDir, { recursive: true });

const chromeProc = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
  '--headless=new',
  '--no-sandbox',
  '--remote-debugging-port=9294',
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
    const res = await fetch('http://127.0.0.1:9294/json/list');
    targets = await res.json();
    if (targets && targets.length) break;
  } catch {}
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

// Boot
await send('Runtime.evaluate', { expression: `window.dispatchEvent(new MouseEvent('click', { bubbles: true }));` });
await new Promise(r => setTimeout(r, 3600));

async function inspectAndCapture(label, timeExpr, filename) {
  const res = await send('Runtime.evaluate', {
    expression: `
      (() => {
        const st = window.ScrollTrigger.getAll()[0];
        const tl = st.animation;
        const targetTime = ${timeExpr};
        tl.seek(targetTime, false);
        if (window.__legado_applyRig) window.__legado_applyRig();

        const s4 = document.querySelector('#scene-4');
        const off = document.querySelector('.mac-plate--off');
        const on = document.querySelector('.mac-plate--on');
        const flash = document.querySelector('.mac-arrival-flash');
        const glow = document.querySelector('.mac-floor-glow');
        const bg = document.querySelector('#migration-bg-overlay');

        const cs = el => el ? window.getComputedStyle(el) : null;
        const csS4 = cs(s4);
        const csOff = cs(off);
        const csOn = cs(on);
        const csFlash = cs(flash);
        const csBg = cs(bg);

        return {
          label: "${label}",
          time: targetTime,
          rig: { tx: window.__legado_rig.tx, ty: window.__legado_rig.ty, s: window.__legado_rig.s, era: window.__legado_rig.era },
          scene4: csS4 ? { opacity: csS4.opacity, visibility: csS4.visibility } : null,
          macOff: csOff ? { opacity: csOff.opacity, visibility: csOff.visibility, mixBlendMode: csOff.mixBlendMode } : null,
          macOn: csOn ? { opacity: csOn.opacity, visibility: csOn.visibility, mixBlendMode: csOn.mixBlendMode } : null,
          arrivalFlash: csFlash ? { opacity: csFlash.opacity } : null,
          bgOverlay: csBg ? { opacity: csBg.opacity, background: csBg.background } : null,
        };
      })()
    `,
    returnByValue: true,
  });

  console.log('--- ' + label + ' ---');
  console.log(JSON.stringify(res.result.value, null, 2));

  await new Promise(r => setTimeout(r, 600));
  const shot = await send('Page.captureScreenshot', { format: 'png' });
  const p = path.resolve(`scratch/${filename}`);
  fs.writeFileSync(p, Buffer.from(shot.data, 'base64'));
  console.log(`Saved scratch/${filename}\n`);
}

// Obtenemos las labels del timeline
const tlInfo = await send('Runtime.evaluate', {
  expression: `(() => {
    const tl = window.ScrollTrigger.getAll()[0].animation;
    return { labels: tl.labels, duration: tl.duration() };
  })()`,
  returnByValue: true,
});
console.log('Timeline info:', tlInfo.result.value);

const { labels } = tlInfo.result.value;
const tS2 = labels['s2']; // Reposo de escena 03 (inicio de paneo de migración)
const tS3 = labels['s3']; // Final de escena 04 (MacBook encendida al 100%)
const dur = tS3 - tS2;

console.log(`Scene 04 starts at ${tS2}, ends at ${tS3}, duration=${dur}`);

// Estado A: inicio de escena 04, MacBook apagada (tS2 + 0.1)
await inspectAndCapture('Estado A - Inicio escena 04', `${tS2} + 0.1`, 'state-A-start.png');

// Estado B: 40% del recorrido, MacBook todavía apagada y haces avanzando
await inspectAndCapture('Estado B - 40% recorrido', `${tS2} + ${dur} * 0.40`, 'state-B-40pct.png');

// Estado C: 80% del recorrido, haces llegando, pantalla todavía apagada
await inspectAndCapture('Estado C - 80% recorrido', `${tS2} + ${dur} * 0.80`, 'state-C-80pct.png');

// Estado D: momento del destello
await inspectAndCapture('Estado D - Destello', `${tS2} + 2.30`, 'state-D-flash.png');

// Estado E: pantalla encendida al 100%
await inspectAndCapture('Estado E - Encendido 100%', `${tS3}`, 'state-E-on-100pct.png');

// Estado F adicional: transición a Escena 05 (estrategias)
const tS4 = labels['s4'];
await inspectAndCapture('Estado F - Transición Escena 05', `${tS4}`, 'state-F-strategies.png');

ws.close();
chromeProc.kill();
server.close();
process.exit(0);
