import fs from 'fs';
import path from 'path';
import http from 'http';
import { spawn } from 'child_process';

const PORT = 5199;
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

const userDir = path.resolve('scratch/chrome-test-mig-' + Date.now());
fs.mkdirSync(userDir, { recursive: true });

const chromeProc = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
  '--headless=new',
  '--no-sandbox',
  '--remote-debugging-port=9288',
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
    const res = await fetch('http://127.0.0.1:9288/json/list');
    targets = await res.json();
    if (targets && targets.length) break;
  } catch {}
}

const pageTarget = targets.find(t => t.type === 'page');
const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);
let id = 1;
const cbs = new Map();
const consoleErrors = [];

ws.onmessage = e => {
  const m = JSON.parse(e.data);
  if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') {
    consoleErrors.push(m.params.args.map(a => a.value || a.description).join(' '));
  }
  if (m.method === 'Runtime.exceptionThrown') {
    consoleErrors.push(m.params.exceptionDetails.text);
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

// Boot
await send('Runtime.evaluate', { expression: `window.dispatchEvent(new MouseEvent('click', { bubbles: true }));` });
await new Promise(r => setTimeout(r, 3600));

async function captureStep(timeExpr, outName) {
  await send('Runtime.evaluate', {
    expression: `
      (() => {
        const st = window.ScrollTrigger.getAll()[0];
        const tl = st.animation;
        const targetTime = ${timeExpr};
        tl.seek(targetTime, false);
        if (window.__legado_applyRig) window.__legado_applyRig();
        return {
          seekedTo: targetTime,
          rig: { ...window.__legado_rig, _gsap: undefined },
          labels: tl.labels,
        };
      })()
    `,
    returnByValue: true,
  });
  await new Promise(r => setTimeout(r, 1000));
  const shot = await send('Page.captureScreenshot', { format: 'png' });
  const p = path.resolve(`scratch/${outName}`);
  fs.writeFileSync(p, Buffer.from(shot.data, 'base64'));
  console.log(`Saved ${outName}`);
}

// 1. Reposo escena 03 (inicio paneo)
await captureStep(`tl.labels['s2']`, 'scene04-step1-start.png');

// 2. Mitad de camino (paneo en progreso, haces de fibra avanzando, partículas)
await captureStep(`tl.labels['s2'] + 1.25`, 'scene04-step2-midway.png');

// 3. Arribo a la MacBook (encendido de pantalla)
await captureStep(`tl.labels['s2'] + 2.0`, 'scene04-step3-arrival.png');

// 4. Reposo escena 04 (MacBook centrada con barra al 100%)
await captureStep(`tl.labels['s3']`, 'scene04-step4-final.png');

// 5. Test de reversibilidad: volver a s2
await captureStep(`tl.labels['s2']`, 'scene04-step5-reversed.png');

// 6. Test de reversibilidad: volver a s3
await captureStep(`tl.labels['s3']`, 'scene04-step6-re-arrival.png');

// Chequeo de triggers y stress
const qaResult = await send('Runtime.evaluate', {
  expression: `
    (() => {
      const triggersCount = window.ScrollTrigger.getAll().length;
      return {
        triggersCount,
        hasCanvas: !!document.querySelector('canvas'),
        hasMacOff: !!document.querySelector('.mac-plate--off'),
        hasMacOn: !!document.querySelector('.mac-plate--on'),
        rig: window.__legado_rig,
      };
    })()
  `,
  returnByValue: true,
});

console.log('QA state:', qaResult.result.value);
console.log('Console errors:', consoleErrors);

ws.close();
chromeProc.kill();
server.close();
process.exit(0);
