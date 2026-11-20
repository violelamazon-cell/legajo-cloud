import fs from 'fs';
import path from 'path';

const SCREENSHOT_DIR = 'C:\\Users\\Violeta\\.gemini\\antigravity\\brain\\f222dfda-4b1f-4382-b86e-3374dd540ce6';

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

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

async function run() {
  console.log('1. Conectando a Chrome...');
  const targetsRes = await fetch('http://127.0.0.1:9222/json/list');
  const targets = await targetsRes.json();
  const pageTarget = targets.find((t) => t.type === 'page');

  if (!pageTarget) {
    throw new Error('No se encontró página activa en Chrome');
  }

  const client = new CDPClient(pageTarget.webSocketDebuggerUrl);
  await client.init();

  await client.send('Page.enable');
  await client.send('Runtime.enable');
  await client.send('DOM.enable');

  console.log('2. Recargando página para garantizar estado limpio...');
  await client.send('Page.reload');
  await sleep(3500);

  console.log('3. Ejecutando click de boot inicial...');
  await client.send('Runtime.evaluate', {
    expression: `window.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));`,
  });
  await sleep(3800);

  // Instalar helper de navegación precisa en timeline maestro
  await client.send('Runtime.evaluate', {
    expression: `
      window.__seekTimeline = function(tVal) {
        const st = window.ScrollTrigger.getAll()[0];
        const tl = st.animation;
        tl.seek(tVal, false);
        if (window.__legado_applyRig) window.__legado_applyRig();
      };
    `,
  });

  // =========================================================================
  // ESTADO 1: Cámara alejada, computadora completa (FASE A - t = 2.65)
  // =========================================================================
  console.log('4. Capturando Estado 1: Cámara alejada, computadora completa (t=2.65)...');
  await client.send('Runtime.evaluate', {
    expression: `window.__seekTimeline(2.65);`,
  });
  await sleep(1500);
  const shot1 = await client.send('Page.captureScreenshot', { format: 'png' });
  const p1 = path.join(SCREENSHOT_DIR, 'estado-1-zoom-out.png');
  fs.writeFileSync(p1, Buffer.from(shot1.data, 'base64'));
  console.log('-> Guardado:', p1);

  // =========================================================================
  // ESTADO 2: Wrapper descendiendo (FASE B - t = 3.25)
  // =========================================================================
  console.log('5. Capturando Estado 2: Wrapper descendiendo (t=3.25)...');
  await client.send('Runtime.evaluate', {
    expression: `window.__seekTimeline(3.25);`,
  });
  await sleep(1500);
  const shot2 = await client.send('Page.captureScreenshot', { format: 'png' });
  const p2 = path.join(SCREENSHOT_DIR, 'estado-2-wrapper-descendiendo.png');
  fs.writeFileSync(p2, Buffer.from(shot2.data, 'base64'));
  console.log('-> Guardado:', p2);

  // =========================================================================
  // ESTADO 3: Wrapper acoplado, bordes iridiscentes iluminados, antes de órbitas (FASE C - t = 4.45)
  // =========================================================================
  console.log('6. Capturando Estado 3: Wrapper acoplado (t=4.45)...');
  await client.send('Runtime.evaluate', {
    expression: `window.__seekTimeline(4.45);`,
  });
  await sleep(1500);
  const shot3 = await client.send('Page.captureScreenshot', { format: 'png' });
  const p3 = path.join(SCREENSHOT_DIR, 'estado-3-wrapper-acoplado.png');
  fs.writeFileSync(p3, Buffer.from(shot3.data, 'base64'));
  console.log('-> Guardado:', p3);

  // =========================================================================
  // ESTADO 4: Estado final completo con órbitas, etiqueta y texto CRT verde (FASE D + E - t = 6.62)
  // =========================================================================
  console.log('7. Capturando Estado 4: Estado final completo (t=6.62)...');
  await client.send('Runtime.evaluate', {
    expression: `window.__seekTimeline(6.62);`,
  });
  await sleep(1800);
  const shot4 = await client.send('Page.captureScreenshot', { format: 'png' });
  const p4 = path.join(SCREENSHOT_DIR, 'estado-4-final.png');
  fs.writeFileSync(p4, Buffer.from(shot4.data, 'base64'));
  console.log('-> Guardado:', p4);

  // =========================================================================
  // PRUEBA DE REVERSIBILIDAD: Regreso a Escena 02 y regreso a Escena 03
  // =========================================================================
  console.log('8. Verificando reversibilidad: Regreso a Escena 02 (t=1.45)...');
  await client.send('Runtime.evaluate', {
    expression: `window.__seekTimeline(1.45);`,
  });
  await sleep(1500);
  const shotRev = await client.send('Page.captureScreenshot', { format: 'png' });
  const pRev = path.join(SCREENSHOT_DIR, 'reversibilidad-escena-02.png');
  fs.writeFileSync(pRev, Buffer.from(shotRev.data, 'base64'));
  console.log('-> Guardado:', pRev);

  // Re-avanzar a Estado 4
  console.log('9. Re-avanzando hacia Escena 03 completa...');
  await client.send('Runtime.evaluate', {
    expression: `window.__seekTimeline(6.62);`,
  });
  await sleep(1500);

  client.close();
  console.log('Todas las capturas se completaron correctamente.');
}

run().catch((err) => {
  console.error('Error durante la verificación:', err);
  process.exit(1);
});
