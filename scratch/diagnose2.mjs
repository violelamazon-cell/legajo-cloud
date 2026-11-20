/**
 * diagnose2.mjs — Busca la escena Three.js de múltiples maneras
 * para confirmar si R3F está realmente montado.
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
    if (r.exceptionDetails) {
      return 'EXCEPTION: ' + r.exceptionDetails.exception?.description;
    }
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

  // Seek timeline a t=6.62
  await cdp.eval(`
    (function() {
      const st = window.ScrollTrigger && window.ScrollTrigger.getAll()[0];
      const tl = st && st.animation;
      if (tl) tl.seek(6.62, false);
      if (window.__legado_applyRig) window.__legado_applyRig();
    })()
  `);
  await sleep(1000);

  console.log('\n========== DIAGNÓSTICO PROFUNDO ==========\n');

  // 1. Buscar canvas y sus propiedades simbólicas (R3F usa symbol keys)
  const canvasInfo = await cdp.eval(`
    (function() {
      const canvas = document.querySelector('canvas');
      if (!canvas) return 'NO CANVAS EN DOM';
      const info = {
        tagName: canvas.tagName,
        width: canvas.width,
        height: canvas.height,
        style_zIndex: canvas.style.zIndex,
        parent_id: canvas.parentElement?.id || '(no id)',
        parent_class: canvas.parentElement?.className || '(no class)',
        // Enumerar todas las keys incluyendo símbolos
        ownKeys: Object.getOwnPropertyNames(canvas).filter(k => k.startsWith('__')).slice(0, 20),
      };
      // Símbolos
      const symKeys = Object.getOwnPropertySymbols(canvas).map(s => s.toString()).slice(0, 10);
      info.symbolKeys = symKeys;
      return JSON.stringify(info);
    })()
  `);
  console.log('[ A ] Canvas DOM info:');
  try { const p = JSON.parse(canvasInfo); Object.entries(p).forEach(([k,v]) => console.log(`      ${k}:`, v)); }
  catch(e) { console.log('     ', canvasInfo); }

  // 2. Intentar acceder via __r3f con todas las variantes conocidas
  const r3fSearch = await cdp.eval(`
    (function() {
      const canvas = document.querySelector('canvas');
      if (!canvas) return 'NO CANVAS';
      // Intentar variantes de la API de R3F
      const variants = {
        '__r3f': !!canvas.__r3f,
        'canvas._r3f': !!(canvas._r3f),
      };
      // Buscar todos los keys con 'r3f' en el nombre
      const allKeys = Object.getOwnPropertyNames(canvas);
      variants.allUnderscoredKeys = allKeys.filter(k => k.startsWith('_') || k.startsWith('__'));
      // Comprobar si el renderLoop de R3F está activo vía raf
      variants.r3fStoreViaSymbol = 'searching...';
      const syms = Object.getOwnPropertySymbols(canvas);
      for (const s of syms) {
        const val = canvas[s];
        if (val && typeof val === 'object' && val.getState) {
          variants.r3fStoreViaSymbol = 'FOUND via symbol ' + s.toString();
          const state = val.getState();
          if (state && state.scene) {
            variants.sceneChildCount = state.scene.children.length;
          }
          break;
        }
        if (val && typeof val === 'object' && val.store) {
          variants.r3fStoreViaSymbol = 'FOUND .store via symbol ' + s.toString();
          const state = val.store?.getState?.();
          if (state && state.scene) variants.sceneChildCount = state.scene.children.length;
          break;
        }
      }
      return JSON.stringify(variants);
    })()
  `);
  console.log('\n[ B ] Búsqueda de R3F store:');
  try { const p = JSON.parse(r3fSearch); Object.entries(p).forEach(([k,v]) => console.log(`      ${k}:`, JSON.stringify(v))); }
  catch(e) { console.log('     ', r3fSearch); }

  // 3. ¿Está el #stage y el canvas ahí dentro?
  const stageInfo = await cdp.eval(`
    (function() {
      const stage = document.getElementById('stage');
      if (!stage) return 'NO #stage';
      const canvases = stage.querySelectorAll('canvas');
      return JSON.stringify({
        stageChildren: stage.children.length,
        canvasCount: canvases.length,
        stageHTML: stage.innerHTML.substring(0, 500),
      });
    })()
  `);
  console.log('\n[ C ] Estructura del #stage:');
  try { const p = JSON.parse(stageInfo); Object.entries(p).forEach(([k,v]) => console.log(`      ${k}:`, typeof v === 'string' && v.length > 100 ? v.substring(0,200)+'...' : v)); }
  catch(e) { console.log('     ', stageInfo); }

  // 4. Comprobar si el <canvas> tiene WebGL context
  const webglInfo = await cdp.eval(`
    (function() {
      const canvas = document.querySelector('canvas');
      if (!canvas) return 'NO CANVAS';
      const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
      if (!gl) return 'NO WEBGL CONTEXT';
      return JSON.stringify({
        renderer: gl.getParameter(gl.RENDERER),
        version: gl.getParameter(gl.VERSION),
        drawingBufferWidth: gl.drawingBufferWidth,
        drawingBufferHeight: gl.drawingBufferHeight,
      });
    })()
  `);
  console.log('\n[ D ] WebGL context del canvas:');
  try { const p = JSON.parse(webglInfo); Object.entries(p).forEach(([k,v]) => console.log(`      ${k}:`, v)); }
  catch(e) { console.log('     ', webglInfo); }

  // 5. Buscar la escena Three.js via THREE global (si está expuesto)
  const threeGlobal = await cdp.eval(`
    (function() {
      if (typeof THREE === 'undefined') return 'THREE no es global';
      const scenes = [];
      // Intentar encontrar la escena a través de registros globales
      return 'THREE existe globalmente - version: ' + (THREE.REVISION || '?');
    })()
  `);
  console.log('\n[ E ] THREE global:', threeGlobal);

  // 6. Leer el __legado_rig y el estado del DOM del wrapper/stage
  const domState = await cdp.eval(`
    (function() {
      const rig = window.__legado_rig;
      const scene3 = document.getElementById('scene-3');
      const scene3crt = document.getElementById('scene-3-crt');
      const wrapperLabel = document.getElementById('wrapper-label');
      return JSON.stringify({
        rig_s: rig ? +rig.s.toFixed(4) : 'NO RIG',
        rig_era: rig ? +rig.era.toFixed(4) : '?',
        scene3_visibility: scene3 ? window.getComputedStyle(scene3).visibility : 'NO scene3',
        scene3_opacity: scene3 ? window.getComputedStyle(scene3).opacity : '?',
        scene3crt_opacity: scene3crt ? window.getComputedStyle(scene3crt).opacity : 'NO scene3crt',
        wrapperLabel: wrapperLabel ? 'EXISTS, opacity=' + window.getComputedStyle(wrapperLabel).opacity : 'NO wrapper-label',
        worldTransform: (function() {
          const w = document.getElementById('world');
          return w ? w.style.transform : 'NO #world';
        })(),
      });
    })()
  `);
  console.log('\n[ F ] Estado del DOM (rig, escenas, labels):');
  try { const p = JSON.parse(domState); Object.entries(p).forEach(([k,v]) => console.log(`      ${k}:`, v)); }
  catch(e) { console.log('     ', domState); }

  // 7. ¿El HMR funcionó? Comprobar si el script bundle menciona "740" (nuevo) o "1260" (viejo)
  const hmrCheck = await cdp.eval(`
    (function() {
      // No podemos leer el source bundle directamente, pero podemos
      // buscar módulos Vite cargados en performance entries
      const resources = performance.getEntriesByType('resource');
      const jsChunks = resources
        .filter(r => r.name.includes('.js'))
        .map(r => ({ name: r.name.split('/').pop(), duration: +r.duration.toFixed(0) + 'ms' }));
      return JSON.stringify(jsChunks.slice(0, 10));
    })()
  `);
  console.log('\n[ G ] Chunks JS cargados (HMR check):');
  try {
    const chunks = JSON.parse(hmrCheck);
    chunks.forEach((c, i) => console.log(`      [${i}]`, JSON.stringify(c)));
  } catch(e) {
    console.log('     ', hmrCheck);
  }

  cdp.close();
  console.log('\n========== FIN ==========\n');
}

run().catch((e) => {
  console.error('ERROR:', e.message);
  process.exit(1);
});
