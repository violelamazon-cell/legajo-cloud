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
        expression: `(() => {
          const canvas = document.querySelector('canvas');
          const r3fRoot = canvas ? canvas.__r3f : null;
          let cameraInfo = null;
          let sceneChildren = [];
          if (r3fRoot && r3fRoot.store) {
            const state = r3fRoot.store.getState();
            const cam = state.camera;
            cameraInfo = {
              fov: cam.fov,
              near: cam.near,
              far: cam.far,
              position: [cam.position.x, cam.position.y, cam.position.z],
              width: state.size.width,
              height: state.size.height
            };
            sceneChildren = state.scene.children.map(c => ({
              type: c.type,
              visible: c.visible,
              pos: [c.position.x, c.position.y, c.position.z],
              childrenCount: c.children ? c.children.length : 0
            }));
          }
          return JSON.stringify({
            cameraInfo,
            sceneChildren,
            rig: window.__legado_rig ? { tx: window.__legado_rig.tx, ty: window.__legado_rig.ty, s: window.__legado_rig.s, era: window.__legado_rig.era } : null
          });
        })()`,
      },
    })
  );
};

ws.onmessage = (e) => {
  console.log(e.data);
  ws.close();
};
