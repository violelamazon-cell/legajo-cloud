const res = await fetch('http://127.0.0.1:9222/json/list');
const targets = await res.json();
const p = targets.find((t) => t.type === 'page');
const ws = new WebSocket(p.webSocketDebuggerUrl);

function send(method, params = {}) {
  return new Promise((resolve) => {
    const id = Math.floor(Math.random() * 1000000);
    const handler = (e) => {
      const msg = JSON.parse(e.data);
      if (msg.id === id) {
        ws.removeEventListener('message', handler);
        resolve(msg.result);
      }
    };
    ws.addEventListener('message', handler);
    ws.send(JSON.stringify({ id, method, params }));
  });
}

ws.onopen = async () => {
  console.log('Navegando directamente con __legado_goToScene(2)...');
  await send('Runtime.evaluate', {
    expression: 'window.__legado_goToScene(2);',
  });

  console.log('Esperando 2 segundos a que el scroll de GSAP termine...');
  await new Promise((r) => setTimeout(r, 2000));

  const hudRes = await send('Runtime.evaluate', {
    returnByValue: true,
    expression:
      '({ scene: window.__legado_sceneStore.get(), rig: { ...window.__legado_rig, _gsap: undefined } })',
  });
  console.log('Estado actual:', hudRes.result.value);

  const shot = await send('Page.captureScreenshot', { format: 'png' });
  const fs = await import('fs');
  fs.writeFileSync('C:\\Users\\Violeta\\.gemini\\antigravity\\brain\\f222dfda-4b1f-4382-b86e-3374dd540ce6\\scene-03-goto-result.png', Buffer.from(shot.data, 'base64'));
  console.log('Captura guardada en scene-03-goto-result.png');
  ws.close();
};
