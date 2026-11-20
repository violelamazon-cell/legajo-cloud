/**
 * diagnose.mjs — Diagnóstico sin modificar código.
 * Responde los 6 puntos del usuario con evidencia del runtime real.
 */

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

class CDP {
  constructor(wsUrl) {
    this.ws = new WebSocket(wsUrl);
    this.id = 1;
    this.callbacks = new Map();
  }
  init() {
    return new Promise((resolve, reject) => {
      this.ws.onopen = () => resolve();
      this.ws.onerror = (e) => reject(e);
      this.ws.onmessage = (ev) => {
        const msg = JSON.parse(ev.data);
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
  async eval(expr) {
    const r = await this.send('Runtime.evaluate', {
      expression: expr,
      returnByValue: true,
      awaitPromise: false,
    });
    return r.result?.value;
  }
  close() { this.ws.close(); }
}

async function run() {
  const res = await fetch('http://127.0.0.1:9222/json/list');
  const targets = await res.json();
  const page = targets.find((t) => t.type === 'page');
  if (!page) throw new Error('No Chrome page found');

  const cdp = new CDP(page.webSocketDebuggerUrl);
  await cdp.init();
  await cdp.send('Runtime.enable');

  console.log('\n========== DIAGNÓSTICO WRAPPER ==========\n');

  // ── PUNTO 5: URL de la página ─────────────────────────────────────────────
  const pageUrl = await cdp.eval('window.location.href');
  console.log('[ P5 ] URL actual en el navegador:');
  console.log('       ', pageUrl);

  // ── Avanzar timeline a t=6.62 (estado final Escena 03) ───────────────────
  await cdp.send('Runtime.evaluate', {
    expression: `
      (function() {
        const st = window.ScrollTrigger && window.ScrollTrigger.getAll()[0];
        const tl = st && st.animation;
        if (tl) { tl.seek(6.62, false); }
        if (window.__legado_applyRig) window.__legado_applyRig();
        return !!tl;
      })()
    `,
    returnByValue: true,
  });
  await sleep(1200);

  // ── PUNTO 1: Qué Wrapper importa Stage3D ─────────────────────────────────
  // Verificamos si Stage3D existe en el DOM canvas y cuál es el módulo activo
  const stageCanvas = await cdp.eval(`
    (function() {
      const canvas = document.querySelector('canvas');
      return canvas ? canvas.closest('div')?.className || 'found-no-class' : 'NO CANVAS FOUND';
    })()
  `);
  console.log('\n[ P1 ] Canvas Three.js en DOM:');
  console.log('       ', stageCanvas);

  // ── PUNTO 2: Wrapper renderizándose (checar si hay objetos en la escena) ──
  const threeInfo = await cdp.eval(`
    (function() {
      // Acceder a la instancia Three.js a través del canvas
      const canvas = document.querySelector('canvas');
      if (!canvas) return 'NO CANVAS';
      // R3F expone __r3f en el canvas
      const r3f = canvas.__r3f;
      if (!r3f) return 'NO __r3f (R3F no montado)';
      const scene = r3f.store?.getState?.()?.scene;
      if (!scene) return 'NO scene in store';
      let meshCount = 0;
      let groupCount = 0;
      let names = [];
      scene.traverse((obj) => {
        if (obj.isMesh) meshCount++;
        if (obj.isGroup) { groupCount++; }
        if (obj.name) names.push(obj.name);
      });
      return JSON.stringify({ meshCount, groupCount, namedObjects: names.slice(0,20) });
    })()
  `);
  console.log('\n[ P2 ] Objetos Three.js en la escena:');
  console.log('       ', threeInfo);

  // ── PUNTO 3: Escala, posición y rotación del Wrapper ─────────────────────
  const wrapperTransform = await cdp.eval(`
    (function() {
      const canvas = document.querySelector('canvas');
      if (!canvas) return 'NO CANVAS';
      const r3f = canvas.__r3f;
      if (!r3f) return 'NO __r3f';
      const scene = r3f.store?.getState?.()?.scene;
      if (!scene) return 'NO scene';
      let result = { groups: [], meshes: [] };
      scene.traverse((obj) => {
        if (obj.isGroup) {
          result.groups.push({
            name: obj.name || '(unnamed group)',
            pos: { x: +obj.position.x.toFixed(2), y: +obj.position.y.toFixed(2), z: +obj.position.z.toFixed(2) },
            scale: { x: +obj.scale.x.toFixed(4), y: +obj.scale.y.toFixed(4), z: +obj.scale.z.toFixed(4) },
            visible: obj.visible,
            childCount: obj.children.length,
          });
        }
        if (obj.isMesh) {
          const geo = obj.geometry;
          result.meshes.push({
            type: geo?.type || '?',
            params: geo?.parameters ? JSON.stringify(geo.parameters).substring(0, 120) : 'no-params',
            matType: obj.material?.type || '?',
            matOpacity: obj.material?.opacity ?? 'N/A',
            matSide: obj.material?.side ?? 'N/A',
            visible: obj.visible,
          });
        }
      });
      return JSON.stringify(result);
    })()
  `);
  console.log('\n[ P3 ] Geometría y transform del Wrapper (estado t=6.62):');
  try {
    const parsed = JSON.parse(wrapperTransform);
    console.log('  Grupos:');
    parsed.groups.forEach((g, i) => console.log(`    [${i}]`, JSON.stringify(g)));
    console.log('  Meshes:');
    parsed.meshes.forEach((m, i) => console.log(`    [${i}]`, JSON.stringify(m)));
  } catch(e) {
    console.log('       ', wrapperTransform);
  }

  // ── PUNTO 4: Valores reales de fx ─────────────────────────────────────────
  const fxValues = await cdp.eval(`
    (function() {
      // fx no está expuesto globalmente; buscamos vía __legado_rig que sí lo está
      // y luego leemos el rig
      const rig = window.__legado_rig;
      return JSON.stringify({
        rig_s: rig ? +rig.s.toFixed(4) : 'NO RIG',
        rig_tx: rig ? +rig.tx.toFixed(2) : '?',
        rig_ty: rig ? +rig.ty.toFixed(2) : '?',
        rig_era: rig ? +rig.era.toFixed(4) : '?',
      });
    })()
  `);
  console.log('\n[ P4-rig ] Valores reales del rig:');
  console.log('       ', fxValues);

  // Para fx, lo intentamos inyectar con un módulo helper que reporta desde el bundle
  // No podemos importar directamente el módulo, pero podemos checar el estado de los
  // materiales del Wrapper para inferir si fx llegó (opacity, uniforms)
  const matUniforms = await cdp.eval(`
    (function() {
      const canvas = document.querySelector('canvas');
      if (!canvas) return 'NO CANVAS';
      const r3f = canvas.__r3f;
      if (!r3f) return 'NO __r3f';
      const scene = r3f.store?.getState?.()?.scene;
      if (!scene) return 'NO scene';
      const result = [];
      scene.traverse((obj) => {
        if (!obj.isMesh) return;
        const mat = obj.material;
        if (!mat) return;
        const entry = { matType: mat.type, opacity: mat.opacity, side: mat.side, visible: obj.visible };
        if (mat.uniforms) {
          entry.uniforms = {};
          for (const [k, v] of Object.entries(mat.uniforms)) {
            entry.uniforms[k] = typeof v.value === 'number' ? +v.value.toFixed(4) : v.value;
          }
        }
        if (mat.iridescence !== undefined) entry.iridescence = mat.iridescence;
        result.push(entry);
      });
      return JSON.stringify(result);
    })()
  `);
  console.log('\n[ P4-fx ] Estado real de materiales (opacity, uniforms, side):');
  try {
    const mats = JSON.parse(matUniforms);
    mats.forEach((m, i) => console.log(`    [${i}]`, JSON.stringify(m)));
  } catch(e) {
    console.log('       ', matUniforms);
  }

  // ── PUNTO 5: HMR — revisar si el módulo cargado tiene las dimensiones nuevas ──
  // Verificamos las dimensiones reales de las geometrías (si son 740 o 1260)
  const geoParams = await cdp.eval(`
    (function() {
      const canvas = document.querySelector('canvas');
      if (!canvas) return 'NO CANVAS';
      const r3f = canvas.__r3f;
      if (!r3f) return 'NO __r3f';
      const scene = r3f.store?.getState?.()?.scene;
      if (!scene) return 'NO scene';
      const widths = [];
      scene.traverse((obj) => {
        if (obj.isMesh && obj.geometry) {
          const p = obj.geometry.parameters;
          if (p && p.width !== undefined) {
            widths.push({ geoType: obj.geometry.type, width: +p.width.toFixed(2), height: +p.height?.toFixed(2), depth: +p.depth?.toFixed(2) });
          }
          if (p && p.radius !== undefined && p.tube !== undefined) {
            widths.push({ geoType: obj.geometry.type, radius: +p.radius.toFixed(2), tube: +p.tube.toFixed(4) });
          }
        }
      });
      return JSON.stringify(widths);
    })()
  `);
  console.log('\n[ P5-HMR ] Dimensiones reales de las geometrías (¿740 o 1260?):');
  try {
    const dims = JSON.parse(geoParams);
    dims.forEach((d, i) => console.log(`    [${i}]`, JSON.stringify(d)));
  } catch(e) {
    console.log('       ', geoParams);
  }

  // ── PUNTO 6: Verificar si hay 2 o 3 RoundedBox y si son concéntricos ──────
  const boxCount = await cdp.eval(`
    (function() {
      const canvas = document.querySelector('canvas');
      if (!canvas) return 'NO CANVAS';
      const r3f = canvas.__r3f;
      if (!r3f) return 'NO __r3f';
      const scene = r3f.store?.getState?.()?.scene;
      if (!scene) return 'NO scene';
      let roundedBoxCount = 0;
      let shaderMats = 0;
      let physicalMats = 0;
      let backSideCount = 0;
      let doubleSideCount = 0;
      scene.traverse((obj) => {
        if (!obj.isMesh) return;
        // RoundedBox produce BufferGeometry sin tipo específico — checar si tiene > 100 vértices y es una caja
        const geo = obj.geometry;
        if (geo && geo.type === 'BufferGeometry') roundedBoxCount++;
        const mat = obj.material;
        if (!mat) return;
        if (mat.type === 'ShaderMaterial') shaderMats++;
        if (mat.type === 'MeshPhysicalMaterial') physicalMats++;
        if (mat.side === 1) backSideCount++;  // THREE.BackSide = 1
        if (mat.side === 2) doubleSideCount++; // THREE.DoubleSide = 2
      });
      return JSON.stringify({ roundedBoxCount, shaderMats, physicalMats, backSideCount, doubleSideCount });
    })()
  `);
  console.log('\n[ P6 ] Capas del Wrapper (RoundedBox, shaders, BackSide, DoubleSide):');
  console.log('       ', boxCount);
  console.log('\n  Esperado: { roundedBoxCount: 3, shaderMats: 2, physicalMats: 1, backSideCount: 1, doubleSideCount: 1 }');
  console.log('  (3 RoundedBox: exterior glass + fresnel shader + interior BackSide)');

  cdp.close();
  console.log('\n========== FIN DEL DIAGNÓSTICO ==========\n');
}

run().catch((e) => {
  console.error('ERROR:', e.message);
  process.exit(1);
});
