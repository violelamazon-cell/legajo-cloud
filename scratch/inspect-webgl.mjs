const res = await fetch('http://127.0.0.1:9222/json/list');
const targets = await res.json();
const p = targets.find((t) => t.type === 'page');
const ws = new WebSocket(p.webSocketDebuggerUrl);

ws.onopen = () => {
  ws.send(
    JSON.stringify({
      id: 1,
      method: 'Runtime.evaluate',
      params: {
        returnByValue: true,
        expression: `({
          webgl2: !!document.createElement('canvas').getContext('webgl2'),
          webgl: !!document.createElement('canvas').getContext('webgl'),
          canvasExists: !!document.querySelector('canvas'),
          canvasDims: document.querySelector('canvas') ? {
            w: document.querySelector('canvas').width,
            h: document.querySelector('canvas').height,
            style: document.querySelector('canvas').style.cssText
          } : null,
          fx: window.__legado_fx ? window.__legado_fx : 'no-fx',
          sceneStore: window.__legado_sceneStore ? window.__legado_sceneStore.get() : null
        })`,
      },
    })
  );
};

ws.onmessage = (e) => {
  console.log(JSON.stringify(JSON.parse(e.data).result.result.value, null, 2));
  ws.close();
};
