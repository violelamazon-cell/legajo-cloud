/**
 * capture-scene04.mjs — toma 5 capturas de la Escena 04 vía CDP
 */
import http from 'http';
import { writeFileSync } from 'fs';

const TARGET_URL = 'http://127.0.0.1:4173/';
const SCRATCH = 'C:/Users/Violeta/legado-cloud/scratch';

function cdpGet(path) {
  return new Promise((res, rej) => {
    http.get(`http://localhost:9222${path}`, r => {
      let d = '';
      r.on('data', c => d += c);
      r.on('end', () => { try { res(JSON.parse(d)); } catch(e) { rej(e); } });
    }).on('error', rej);
  });
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// WebSocket mínimo sobre net.Socket para CDP
function cdpConnect(wsUrl) {
  return new Promise((res, rej) => {
    import('net').then(({ default: net }) => {
      const url = new URL(wsUrl);
      const key = Buffer.from(Math.random().toString()).toString('base64');
      const sock = net.createConnection(Number(url.port) || 9222, url.hostname, () => {
        sock.write(
          `GET ${url.pathname} HTTP/1.1\r\n` +
          `Host: ${url.hostname}:${url.port}\r\n` +
          `Upgrade: websocket\r\n` +
          `Connection: Upgrade\r\n` +
          `Sec-WebSocket-Key: ${key}\r\n` +
          `Sec-WebSocket-Version: 13\r\n\r\n`
        );
      });

      let upgraded = false;
      let buf = Buffer.alloc(0);

      const send = (obj) => {
        const payload = Buffer.from(JSON.stringify(obj));
        const header = Buffer.alloc(10);
        header[0] = 0x81; // FIN + text frame
        let off = 2;
        if (payload.length < 126) {
          header[1] = 0x80 | payload.length;
        } else {
          header[1] = 0x80 | 126;
          header.writeUInt16BE(payload.length, 2);
          off = 4;
        }
        // mask
        const mask = Buffer.from([0x37, 0xfa, 0x21, 0x3d]);
        const masked = Buffer.alloc(payload.length);
        for (let i = 0; i < payload.length; i++) masked[i] = payload[i] ^ mask[i % 4];
        sock.write(Buffer.concat([header.slice(0, off), mask, masked]));
      };

      const callbacks = new Map();
      let msgId = 1;
      const cdp = {
        send(method, params = {}) {
          return new Promise((r, j) => {
            const id = msgId++;
            callbacks.set(id, { r, j });
            send({ id, method, params });
          });
        },
        close() { sock.destroy(); },
      };

      sock.on('data', chunk => {
        buf = Buffer.concat([buf, chunk]);
        if (!upgraded) {
          const str = buf.toString();
          if (str.includes('\r\n\r\n')) {
            upgraded = true;
            const headerEnd = buf.indexOf('\r\n\r\n') + 4;
            buf = buf.slice(headerEnd);
            res(cdp);
          }
        }
        // Parse WS frames
        while (upgraded && buf.length >= 2) {
          const fin = (buf[0] & 0x80) !== 0;
          const opcode = buf[0] & 0x0f;
          const masked = (buf[1] & 0x80) !== 0;
          let payLen = buf[1] & 0x7f;
          let off = 2;
          if (payLen === 126) { payLen = buf.readUInt16BE(2); off = 4; }
          else if (payLen === 127) { payLen = Number(buf.readBigUInt64BE(2)); off = 10; }
          if (buf.length < off + (masked ? 4 : 0) + payLen) break;
          if (masked) off += 4;
          const payload = buf.slice(off, off + payLen);
          buf = buf.slice(off + payLen);
          if (opcode === 1) { // text
            try {
              const msg = JSON.parse(payload.toString());
              if (msg.id && callbacks.has(msg.id)) {
                const { r, j } = callbacks.get(msg.id);
                callbacks.delete(msg.id);
                if (msg.error) j(new Error(msg.error.message));
                else r(msg.result);
              }
            } catch {}
          }
        }
      });

      sock.on('error', rej);
    });
  });
}

async function main() {
  // 1. Buscar tab con la URL del preview
  let tabs = await cdpGet('/json');
  let tab = tabs.find(t => t.type === 'page' && t.url && t.url.includes('4173'));

  if (!tab) {
    // Abrir nueva tab con la URL
    console.log('No hay tab con el preview. Abriendo...');
    await cdpGet('/json/new?' + encodeURIComponent(TARGET_URL));
    await sleep(3000);
    tabs = await cdpGet('/json');
    tab = tabs.find(t => t.type === 'page' && t.url && t.url.includes('4173'));
  }

  if (!tab) {
    // Usar cualquier tab disponible y navegar
    tab = tabs.find(t => t.type === 'page');
    if (!tab) throw new Error('Sin tabs de página disponibles');
    console.log('Usando tab existente:', tab.title);
  }

  console.log('Tab:', tab.title, '|', tab.url.slice(0, 60));

  const cdp = await cdpConnect(tab.webSocketDebuggerUrl);
  await cdp.send('Page.enable');
  await cdp.send('Runtime.enable');

  // Navegar si no está en la URL correcta
  if (!tab.url.includes('4173')) {
    console.log('Navegando a', TARGET_URL);
    await cdp.send('Page.navigate', { url: TARGET_URL });
    await sleep(4000);
  } else {
    await sleep(1500);
  }

  // Verificar que la app cargó
  const { result: check } = await cdp.send('Runtime.evaluate', {
    expression: 'typeof window.__legado_goToScene',
    returnByValue: true,
  });
  console.log('goToScene type:', check.value);

  // Obtener duración del timeline para calcular posiciones de scroll
  const { result: tlInfo } = await cdp.send('Runtime.evaluate', {
    expression: `JSON.stringify({
      dur: window.__legado_tl?.duration() ?? 0,
      labels: window.__legado_tl?.labels ?? {},
      stEnd: window.ScrollTrigger?.getAll()[0]?.end ?? 0,
      stStart: window.ScrollTrigger?.getAll()[0]?.start ?? 0,
    })`,
    returnByValue: true,
  });
  const info = JSON.parse(tlInfo.value || '{}');
  console.log('Timeline info:', JSON.stringify(info));

  const { stStart, stEnd, dur, labels } = info;
  const range = stEnd - stStart;

  function scrollToFraction(fraction) {
    return `window.scrollTo(0, ${stStart + range * fraction})`;
  }

  // Función de captura
  async function capture(label, path, expr, extraWait = 1200) {
    console.log(`\n📸 ${label}`);
    await cdp.send('Runtime.evaluate', { expression: expr, awaitPromise: false });
    await sleep(extraWait);
    const { data } = await cdp.send('Page.captureScreenshot', { format: 'png' });
    writeFileSync(path, Buffer.from(data, 'base64'));
    console.log(`   ✓ ${path}`);
  }

  // Calcular posiciones a partir de las labels del timeline
  // s3 = inicio de escena 04 reposo; la escena 04 dura DUR=2.5s
  const s3 = labels['s3'] ?? 0;
  const s4 = labels['s4'] ?? (s3 + 1);
  const DUR = 2.5;
  const sceneStart = s3 - DUR; // inicio del bloque de migración
  const totalDur = dur || 1;

  function tlFrac(t) {
    return scrollToFraction(Math.max(0, Math.min(1, t / totalDur)));
  }

  // ─── 1. MacBook apagada — inicio del paneo ─────────────────────────────
  await capture(
    '1. Inicio escena 04 — MacBook apagada',
    `${SCRATCH}/scene04-new-step1-start.png`,
    tlFrac(sceneStart + 0.1),
    1500
  );

  // ─── 2. Mitad de transferencia — haces conectando ──────────────────────
  await capture(
    '2. Mitad de transferencia — haces en recorrido',
    `${SCRATCH}/scene04-new-step2-midway.png`,
    tlFrac(sceneStart + DUR * 0.42),
    1200
  );

  // ─── 3. Llegada de haces — flash ───────────────────────────────────────
  await capture(
    '3. Llegada de los haces — arrival flash',
    `${SCRATCH}/scene04-new-step3-arrival.png`,
    tlFrac(sceneStart + DUR * 0.86),
    1200
  );

  // ─── 4. MacBook encendida al 100% ─────────────────────────────────────
  await capture(
    '4. MacBook encendida — 100%',
    `${SCRATCH}/scene04-new-step4-macbook-on.png`,
    tlFrac(s3),
    1500
  );

  // ─── 5. Transición a escena 05 — estrategias ──────────────────────────
  await capture(
    '5. Transición a escena 05 — estrategias',
    `${SCRATCH}/scene04-new-step5-strategies.png`,
    tlFrac(s4),
    1500
  );

  cdp.close();
  console.log('\n✅ Capturas completadas.');
}

main().catch(err => {
  console.error('❌ ERROR:', err.message);
  console.error(err.stack);
  process.exit(1);
});
