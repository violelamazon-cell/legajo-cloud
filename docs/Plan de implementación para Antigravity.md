# Plan de implementación para Antigravity

Experiencia web interactiva «Legado → Cloud» · Auditoría, arquitectura, código núcleo y prompts por etapa

> Nota: del material adjunto solo pude ver las imágenes embebidas en `flujo.pdf`. Las dos imágenes sueltas de la computadora retro no llegaron; si difieren del PDF, mandalas y ajusto la sección de plates.

## 0. Cómo usar este documento

1. Guardalo en el repo como `docs/PLAN.md` y poné `flujo.pdf` y los plates en `docs/ref/`.
2. Pegá la sección 4 (Reglas globales) como regla del workspace de Antigravity, o al inicio de cada prompt.
3. Ejecutá las etapas de la sección 5 **en orden y de a una**. No se avanza sin cumplir los criterios de aceptación.
4. En cada etapa pedile a Antigravity que verifique con su agente de navegador (capturas + recorrido adelante/atrás) y que te muestre el resultado antes de seguir.

## 1. Auditoría

### 1.1 Escenas y dependencias

| # | Escena | Naturaleza técnica | Depende de | Dificultad |
| --- | --- | --- | --- | --- |
| 01 | Boot CRT | Timeline por **tiempo** (una vez), no por scroll | plate PC | Baja |
| 02 | Matriz de decisión | Zoom de cámara al CRT + grilla 2×2 | 01 + calibración de pantalla | Media |
| 03 | Wrapper | Zoom out + cubo de vidrio 3D + anillos + nodos | 02, Three | Alta |
| 04 | Paneo de migración | Paneo horizontal gobernado por scroll vertical + haces | 03, plate MacBook | Muy alta |
| 05 | Estrategias | Zoom a pantalla MacBook + 3 tarjetas con diagramas SVG interactivos | 04 | Media |
| 06 | Métricas | Morph de tarjetas a Bento Grid + indicadores | 05 | Media |
| 07 | Cierre | Dolly back + apagado OLED | 06 | Baja-Media |

Dependencias transversales: 02→03→04 comparten el encuadre de la PC (continuidad de cámara); 05→06→07 comparten la pantalla de la MacBook; todas comparten **una sola cámara (rig)** y **un solo timeline maestro**.

### 1.2 Decisión: imágenes vs 3D (recomendación híbrida)

- **Imágenes (plates AVIF/WebP, 3840 px de ancho):** PC retro (apagada, encendida, LED), MacBook (apagada, encendida), reflejos de piso. El fotorrealismo del hardware es lo más caro de lograr en 3D y es justo lo que ya muestra el PDF.
- **3D real (R3F):** cubo de vidrio dicroico, anillos orbitales + nodos, haces de fibra, partículas, glow de piso. Solo donde aporta profundidad, transparencia y reflejos.
- **DOM/SVG:** todo el texto, terminal, grilla, tarjetas, bento, barras y curvas (nítido a cualquier zoom, accesible, fácil de animar).

**Riesgo crítico:** la pantalla del plate está en perspectiva (3/4). El contenido DOM debe encajar sobre ella con un `matrix3d` calculado desde 4 esquinas. La Etapa 2 es un *spike* que lo valida antes de construir nada más. Plan B: plates con el monitor frontal, o modelar la PC en 3D procedural.

**Assets que hay que conseguir antes de la Etapa 2** (generados con la misma dirección de arte del PDF, fondo negro o transparente):

1. `pc-off.avif`, `pc-on.avif` (PC retro, mismo encuadre pixel a pixel), `pc-led.avif` (opcional)
2. `mac-off.avif`, `mac-on.avif` (MacBook Pro, mismo encuadre)
3. Coordenadas de las 4 esquinas de cada pantalla (se miden en la Etapa 2 con un overlay de debug)

Mientras no existan, Antigravity usa placeholders (rectángulos con etiqueta) y no inventa imágenes.

### 1.3 Riesgos y mitigaciones

| Riesgo | Mitigación |
| --- | --- |
| Reversibilidad | Estado = f(progreso del scroll). Un solo timeline maestro con `scrub`. Cero `setState` por frame. Excepción acotada: el boot (time-based) no se reproduce de nuevo. |
| Paneo de la escena 4 | Sin scroll horizontal nativo. El scroll vertical anima `rig.tx`. Ese tramo queda **sin snap** (scroll continuo). |
| Sincronía cámara-scroll | Un único `rig {tx, ty, s}` que se aplica a la capa DOM y a la cámara Three en el mismo `onUpdate`. |
| Rendimiento Three | Un solo `Canvas`, `frameloop='demand'`, sin postprocesado, `dpr` limitado, instancing, shaders livianos, tiers de calidad. |
| Proyector | Contraste y tamaños mínimos de texto probados a 1280×720, 1920×1080 y 1024×768. Fuentes autoalojadas (puede no haber internet). |
| Teclado | Un único `goToScene(i)` compartido con scroll y barra de progreso; ignora inputs; no pelea con el scroll nativo. |
| StrictMode / HMR | `gsap.context()` + `ctx.revert()` en cada montaje; verificación de conteo de triggers. |

## 2. Arquitectura

### 2.1 Stack y dependencias

```bash
npm create vite@latest legado-cloud -- --template react-ts
npm i gsap three @react-three/fiber @react-three/drei lucide-react
npm i -D tailwindcss @tailwindcss/vite @types/three
```

Sin Zustand, sin Lenis, sin postprocessing, sin Howler. GSAP incluye gratis `ScrollTrigger` y `ScrollToPlugin`. Compresión de modelos/texturas con `npx @gltf-transform/cli` (no es dependencia del proyecto). Fuentes: JetBrains Mono (terminal) e Inter (mundo moderno), en `public/fonts` como woff2.

### 2.2 Estructura

```
src/
  animations/  rig.ts  timeline.ts  createMaster.ts  typeInto.ts  qa.ts
               scenes/ decision.ts wrapper.ts migration.ts strategies.ts metrics.ts closing.ts
  components/  Navigation/ (navigation.ts, useKeyboardNav.ts)  ProgressIndicator/  Terminal/  CRTScreen/  GlassCard/
  scenes/      BootScene/ DecisionScene/ WrapperScene/ MigrationScene/ StrategiesScene/ MetricsScene/ ClosingScene/  (solo JSX + CSS de cada escena)
  three/       Stage3D.tsx  CameraSync.tsx  Wrapper/  FiberOptics/  fx.ts  quality.ts
  config/      calibration.ts (esquinas de pantallas, zooms)  metrics.data.ts
  styles/      global.css  crt.css  effects.css  tokens.css
  App.tsx
```

La lógica de animación vive en `animations/scenes/*.ts` (una función por escena); los componentes de `scenes/` solo renderizan el DOM que esas funciones animan.

### 2.3 Principios rectores

1. **El scroll es la única fuente de verdad.** Un solo `ScrollTrigger` maestro con `pin` y `scrub`.
2. **Un solo timeline maestro**, armado con un builder por escena. Cada builder termina con el label `s{i}` (estado de reposo de la escena).
3. **Teclado, barra de progreso y botones solo llaman a `goToScene(i)`**, que hace scroll programático. Nunca tocan el timeline ni el estado visual.
4. **Reglas de GSAP para reversibilidad:** el estado inicial se fija con `tl.set(..., 0)` al crear el master; después todos los tramos usan `tl.to(...)`. Nada de `gsap.from` suelto, nada de `onComplete` que cambie estado.
5. **Una sola cámara:** `rig {tx, ty, s}` mueve la capa DOM `#world` y la cámara de Three. 1 unidad Three = 1 px CSS en el plano z=0, así plates, DOM y 3D comparten coordenadas.
6. **Continuidad estética:** una variable `--era` (0 = retro, 1 = moderno) animada en el mismo timeline. Scanlines, glow fósforo, blur de vidrio y tipografía se interpolan con ella; no hay «tres diseños» pegados.
7. **Escena 7:** la «breve pausa» del PDF se implementa como tramo muerto de scroll seguido del apagado OLED, también scrubbed (reversible y determinista). **Decisión a aprobar.**

## 3. Código núcleo (Antigravity lo implementa tal cual y lo adapta)

### 3.1 Store de escena y rig de cámara

```ts
// src/animations/rig.ts
import { invalidate } from '@react-three/fiber';

type Listener = () => void;
let state = { scene: 0, progress: 0, booted: false };
const listeners = new Set<Listener>();
export const sceneStore = {
  get: () => state,
  set(p: Partial<typeof state>) { state = { ...state, ...p }; listeners.forEach((l) => l()); },
  subscribe(l: Listener) { listeners.add(l); return () => listeners.delete(l); },
};
// En React: useSyncExternalStore(sceneStore.subscribe, () => sceneStore.get().scene)
// El progreso NO es estado de React: se lee con sceneStore.get().progress.

export const rig = { tx: 0, ty: 0, s: 1, era: 0 };
let worldEl: HTMLElement | null = null;
export const bindWorld = (el: HTMLElement | null) => { worldEl = el; };

export function applyRig() {
  if (worldEl) {
    worldEl.style.transform = `translate3d(${rig.tx}px, ${rig.ty}px, 0) scale(${rig.s})`;
    document.documentElement.style.setProperty('--era', String(rig.era));
  }
  invalidate(); // R3F: re-render solo cuando algo cambió
}
```

### 3.2 Timeline maestro (un builder por escena)

```ts
// src/animations/timeline.ts
import gsap from 'gsap';
import { rig, applyRig } from './rig';

export const SCENE_COUNT = 7;
export type SceneBuilder = (tl: gsap.core.Timeline) => void;

export function buildMaster(builders: SceneBuilder[]) {
  const tl = gsap.timeline({ paused: true, defaults: { ease: 'none' }, onUpdate: applyRig });
  tl.set(rig, { tx: 0, ty: 0, s: 1, era: 0 }, 0); // estado inicial único
  tl.addLabel('s0', 0);
  builders.forEach((b) => b(tl));                  // escenas 02..07, en orden
  return tl;
}

// src/animations/scenes/decision.ts  (ejemplo de builder)
import { SCREEN_ZOOM, SCREEN_TX, SCREEN_TY } from '../../config/calibration';
export const buildDecision: SceneBuilder = (tl) => {
  const t = tl.duration();                       // 1 unidad de tiempo = 1 viewport de scroll
  tl.to(rig, { s: SCREEN_ZOOM, tx: SCREEN_TX, ty: SCREEN_TY, duration: 1, ease: 'power2.inOut' }, t);
  tl.to('.decision-line', { scaleX: 1, scaleY: 1, duration: 0.3 }, t + 0.55);
  tl.to('.decision-cell', { autoAlpha: 1, y: 0, stagger: 0.12, duration: 0.25 }, t + 0.7);
  tl.to('.decision-migrar-frame', { autoAlpha: 1, duration: 0.2 }, t + 1.15);
  tl.addLabel('s1', t + 1.4);                    // reposo de la escena 02
};
```

Los elementos que aparecen arrancan ocultos por CSS (`opacity:0; visibility:hidden`) y se revelan con `tl.to`. Los builders se ejecutan dentro de `gsap.context()` con scope al contenedor raíz.

### 3.3 ScrollTrigger maestro con snap por escena

```ts
// src/animations/createMaster.ts
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ScrollToPlugin } from 'gsap/ScrollToPlugin';
import { sceneStore } from './rig';
import { SCENE_COUNT } from './timeline';
gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

const FREE_RANGES: Array<[number, number]> = [[2, 3]]; // entre s2 y s3: paneo de la escena 04, sin snap

export function createMaster(stage: HTMLElement, tl: gsap.core.Timeline) {
  const stops = () => Array.from({ length: SCENE_COUNT }, (_, i) => tl.labels['s' + i] / tl.duration());
  const nearest = (p: number) => stops().reduce((best, s, i, a) => (Math.abs(s - p) < Math.abs(a[best] - p) ? i : best), 0);

  return ScrollTrigger.create({
    animation: tl,
    trigger: stage,
    start: 'top top',
    end: () => '+=' + tl.duration() * window.innerHeight,
    pin: true,
    scrub: 0.6,
    anticipatePin: 1,
    invalidateOnRefresh: true,
    snap: {
      snapTo: (v: number, self?: ScrollTrigger) => {
        const s = stops();
        for (const [a, b] of FREE_RANGES) if (v > s[a] && v < s[b]) return v;
        const dir = self?.direction ?? 1;
        const next = dir > 0 ? s.find((x) => x >= v - 1e-4) : [...s].reverse().find((x) => x <= v + 1e-4);
        return next ?? v;
      },
      duration: { min: 0.25, max: 0.8 },
      delay: 0.08,
      ease: 'power2.inOut',
    },
    onUpdate: (self) => sceneStore.set({ progress: self.progress, scene: nearest(self.progress) }),
  });
}
```

### 3.4 Navegación unificada (scroll + teclado + barra de progreso)

```ts
// src/components/Navigation/navigation.ts
import gsap from 'gsap';
import type { ScrollTrigger } from 'gsap/ScrollTrigger';
import { sceneStore } from '../../animations/rig';
import { SCENE_COUNT } from '../../animations/timeline';

let st: ScrollTrigger; let tlRef: gsap.core.Timeline; let pending: number | null = null;
export const bindNavigation = (trigger: ScrollTrigger, tl: gsap.core.Timeline) => { st = trigger; tlRef = tl; };

export function goToScene(i: number) {
  if (!sceneStore.get().booted) return;            // bloqueado hasta terminar el encendido
  const idx = Math.max(0, Math.min(SCENE_COUNT - 1, i));
  pending = idx;
  const p = tlRef.labels['s' + idx] / tlRef.duration();
  const y = st.start + p * (st.end - st.start);
  gsap.to(window, {
    scrollTo: { y, autoKill: true }, duration: 1.1, ease: 'power2.inOut', overwrite: true,
    onComplete: () => { pending = null; }, onInterrupt: () => { pending = null; },
  });
}
export const stepScene = (d: 1 | -1) => goToScene((pending ?? sceneStore.get().scene) + d);

// src/components/Navigation/useKeyboardNav.ts
import { useEffect } from 'react';
export function useKeyboardNav() {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t.closest('input, textarea, select, [contenteditable=true], [data-no-nav]')) return;
      if (e.altKey || e.ctrlKey || e.metaKey) return;
      const map: Record<string, () => void> = {
        ArrowDown: () => stepScene(1), ArrowRight: () => stepScene(1),
        ArrowUp: () => stepScene(-1), ArrowLeft: () => stepScene(-1),
        Home: () => goToScene(0), End: () => goToScene(SCENE_COUNT - 1),
      };
      const fn = map[e.key];
      if (!fn) return;
      e.preventDefault();
      fn();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
}
```

La barra de progreso lee `sceneStore` y cada segmento llama `goToScene(i)`.

### 3.5 Tipeo reversible (derivado del progreso, sin `setInterval`)

```ts
// src/animations/typeInto.ts
export function typeInto(tl: gsap.core.Timeline, el: Element, text: string, at: number, dur: number) {
  const o = { n: 0 };
  tl.to(o, { n: text.length, duration: dur, ease: 'none',
    onUpdate: () => { el.textContent = text.slice(0, Math.round(o.n)); },
    onReverseComplete: () => { el.textContent = ''; } }, at);
}
```

El cursor parpadeante es CSS puro. Para cambiar el contenido de la pantalla entre escenas se hace **crossfade entre capas** (boot / grilla / wrapper), no reescritura de texto.

### 3.6 Cámara Three alineada a píxeles

```tsx
// src/three/CameraSync.tsx
import { useFrame, useThree } from '@react-three/fiber';
import type { PerspectiveCamera } from 'three';
import { rig } from '../animations/rig';

export function CameraSync() {
  const { camera, size } = useThree();
  useFrame(() => {
    const fov = ((camera as PerspectiveCamera).fov * Math.PI) / 180;
    const baseZ = size.height / (2 * Math.tan(fov / 2));      // 1 unidad = 1 px en z=0
    camera.position.set(-rig.tx / rig.s, rig.ty / rig.s, baseZ / rig.s);
  });
  return null;
}

// Stage3D: <Canvas frameloop='demand' dpr={[1, quality.maxDpr]} camera={{ fov: 35, near: 1, far: 6000 }}
//   gl={{ antialias: false, alpha: true, powerPreference: 'high-performance' }}>
// Los efectos 3D leen un objeto mutable `fx` (wrapperY, ringsT, beamsT, particlesT) que GSAP anima en el timeline.
```

### 3.7 Test de estrés de reversibilidad (solo con `?debug`)

```ts
// src/animations/qa.ts
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { goToScene } from '../components/Navigation/navigation';
import { SCENE_COUNT } from './timeline';
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

export function installQA() {
  (window as any).__qa = {
    async stress(ms = 30000) {
      const triggers0 = ScrollTrigger.getAll().length;
      const t0 = performance.now();
      while (performance.now() - t0 < ms) { goToScene(Math.floor(Math.random() * SCENE_COUNT)); await wait(80 + Math.random() * 500); }
      goToScene(0); await wait(2000);
      console.log('triggers', triggers0, '->', ScrollTrigger.getAll().length,
                  '| tweens activos', gsap.globalTimeline.getChildren(true, true, false).length);
    },
  };
}
```

## 4. Reglas globales (pegar como regla del workspace)

- Este repo implementa una presentación frontend autocontenida. `docs/ref/flujo.pdf` es la fuente de verdad visual y narrativa. No cambiar secuencia, textos, colores ni transiciones sin justificarlo y esperar aprobación.
- Stack fijo: React + TypeScript + Vite, GSAP (+ ScrollTrigger, ScrollToPlugin), Three.js + R3F + Drei, Tailwind, Lucide. **No instalar otras dependencias** sin pedir permiso. Sin audio, sin backend, sin Next.js.
- Arquitectura: seguir las reglas de la sección 2.3 y el código de la sección 3. Un solo ScrollTrigger maestro, un solo timeline, una sola cámara (`rig`), un solo `Canvas`.
- GSAP: todo dentro de `gsap.context()` con `revert()` al desmontar; estado inicial con `tl.set` y luego solo `tl.to`; sin `onComplete` que mute estado; sin timelines fuera del maestro salvo boot y diagramas de la escena 5 (pausados, reversibles, destruidos en el cleanup).
- Prohibido: `localStorage`, `setInterval` para animar, `setState` por frame, manipular el DOM fuera de refs/GSAP, componentes de más de \~200 líneas, código duplicado.
- Cambios mínimos: no reescribir archivos completos para cambios pequeños, no tocar escenas ya aprobadas, no eliminar código funcional, no agregar funcionalidades no pedidas.
- Tokens: fondo `#050505`; fósforo `#3dff8a`; cian `#22e6d8`; violeta `#a56bff`; titanio `#1b1d22` (afinar por muestreo del PDF y centralizar en `tokens.css`). Fuentes autoalojadas, sin CDN.
- Cierre de cada etapa, sin excepción: `tsc --noEmit` y `vite build` sin errores; consola limpia; recorrido completo adelante, atrás y con cambios de dirección a mitad de transición; flechas, Home y End; `__qa.stress()` sin crecimiento de triggers; capturas por escena; reporte de FPS.

## 5. Etapas y prompts

Cada etapa lista: objetivo, archivos, qué hacer, aceptación y qué NO tocar. Las reglas globales (sección 4) aplican siempre.

### Etapa 0 — Scaffold, tokens y contratos

- **Objetivo:** proyecto base y contratos compartidos, sin ninguna escena.
- **Archivos:** estructura de 2.2 (carpetas y archivos vacíos con tipos), `tokens.css`, `global.css`, `config/calibration.ts` (constantes placeholder), `three/quality.ts` (tiers `high/medium/low/fallback`, flag `?quality=`), `rig.ts` y `timeline.ts` de la sección 3.
- **Hacer:** instalar solo las dependencias de 2.1, registrar fuentes autoalojadas, fondo `#050505`, `prefers-reduced-motion` detectado en un solo módulo.
- **Aceptación:** `npm run dev` y `npm run build` limpios; página negra sin errores.
- **No tocar:** nada (proyecto nuevo).

### Etapa 1 — Núcleo de navegación con 7 escenas placeholder

- **Objetivo:** validar scroll + teclado + reversibilidad **antes** de tener arte.
- **Archivos:** `createMaster.ts`, `navigation.ts`, `useKeyboardNav.ts`, `ProgressIndicator/`, `qa.ts`, `App.tsx`, builders mínimos por escena (un rectángulo con el nombre de la escena que entra/sale y un `rig.s` de prueba).
- **Hacer:** implementar las secciones 3.1–3.4 y 3.7. La escena 4 debe tener 2.5 viewports de scroll sin snap. Indicador superior con 7 segmentos clicables. Mini HUD de debug (`?debug`): escena, progreso, cantidad de triggers.
- **Aceptación:** una rueda de scroll = una escena (salvo escena 4, continua); flechas/Home/End funcionan, incluso spameadas; cambiar de dirección a mitad de tramo no produce saltos; recargar a mitad de página restaura el estado; `__qa.stress()` mantiene constante el conteo de triggers; sin scroll bloqueado.
- **No tocar:** tokens y config de la Etapa 0 (salvo bugs).

### Etapa 2 — Spike de plates y calibración de pantalla

- **Objetivo:** probar que el overlay DOM encaja sobre la pantalla del plate y que el zoom se siente como cámara.
- **Archivos:** `components/CRTScreen/`, `config/calibration.ts`, utilidad `quadToMatrix3d(corners)` (homografía 4 puntos → `matrix3d`, sin librerías), capa `#world` ligada a `bindWorld`.
- **Hacer:** cargar `pc-off/pc-on`, mostrar un panel `?debug=screen` con 4 esquinas arrastrables que imprime las coordenadas para guardarlas en `calibration.ts`; texto de prueba sobre la pantalla; zoom de `rig` hasta ocupar el cristal; calcular `SCREEN_ZOOM/TX/TY` a partir de las esquinas (no a ojo).
- **Aceptación:** a 1920×1080 y 1280×720 el texto queda pegado a la pantalla en reposo y a 4× de zoom, sin deformarse ni desfasarse; el zoom no pixela (plates a 3840 px). Si falla, reportar y proponer Plan B antes de seguir.
- **No tocar:** el núcleo de navegación.

### Etapa 3 — Escena 01: encendido CRT

- **Objetivo:** hero con arranque cinematográfico.
- **Archivos:** `BootScene/`, `Terminal/`, `crt.css`, `animations/bootAnimations.ts`.
- **Hacer:** estado inicial PC apagada sobre negro con indicación discreta «PRESIONÁ UNA TECLA O HACÉ CLICK» (cumple el «primer toque» del PDF y evita problemas de autoplay). Al activarse: timeline por tiempo con destello horizontal (línea que se abre en vertical), encendido del fósforo, LED verde y tipeo de las 4 líneas exactas con `typeInto` y cursor CSS. Al terminar, `sceneStore.booted = true`. Volver a la escena 01 muestra el estado final, **sin repetir** el arranque. `prefers-reduced-motion`: estado final inmediato.
- **Aceptación:** textos idénticos al PDF; scroll y teclado bloqueados solo hasta `booted`; sin replay al volver; sin elementos duplicados.
- **No tocar:** Etapas 0–2.

### Etapa 4 — Escena 02: zoom al CRT y matriz de decisión

- **Archivos:** `DecisionScene/`, `animations/scenes/decision.ts`.
- **Hacer:** builder del 3.2: zoom de `rig` al cristal, scanlines y viñeta curva sobre la pantalla, grilla 2×2 que se «dibuja» (líneas con `scaleX/scaleY`), celdas con stagger: \[01\] DESCARTAR (Trash2), \[02\] MANTENER (Wrench), \[03\] REINGENIERÍA (Layers), \[04\] MIGRAR (CloudUpload) con marco de esquinas y glow. La pulsación del glow es CSS activada solo cuando la escena está activa.
- **Aceptación:** zoom suave con ease (no salto); ida y vuelta idénticas; MIGRAR resaltada; legible en proyector.
- **No tocar:** boot, núcleo.

### Etapa 5 — Escena 03: wrapper de vidrio dicroico

- **Archivos:** `WrapperScene/`, `three/Stage3D.tsx`, `three/CameraSync.tsx`, `three/Wrapper/`, `three/fx.ts`, `animations/scenes/wrapper.ts`.
- **Hacer:** `Canvas` único (3.6). Cubo con `RoundedBox` + `MeshPhysicalMaterial` (iridescence, roughness bajo, `transmission: 0`, transparencia por opacidad) + entorno procedural liviano (`Environment` con `Lightformer`) + fresnel de borde. **Evitar transmission real y bloom**; si el cubo se ve plano, agregar sprites aditivos de reflejo. Descenso y acople animados por `fx.wrapperY`. Anillos (3 órbitas finas emisivas) y nodos con `InstancedMesh` moviéndose por `fx.ringsT`. Etiqueta DOM «API WRAPPER // LAYER» anclada al cubo. En pantalla: crossfade a «// API WRAPPER v2.0 / > CORE: UNTOUCHED / > INTERFACE: MODERNIZED» con `typeInto`. `--era` sube a \~0.3.
- **Aceptación:** transparencia, profundidad y reflejos creíbles (no un rectángulo de colores); ≥45 fps en tier medium; sin renders con la escena quieta (verificar `frameloop`).
- **No tocar:** escenas 01–02.

### Etapa 6 — Escena 04: paneo de migración (la más delicada)

- **Archivos:** `MigrationScene/`, `three/FiberOptics/`, `animations/scenes/migration.ts`.
- **Hacer:** ampliar el mundo: PC a la izquierda, MacBook a x = +N px. El paneo es `rig.tx` de 0 a -N animado por el timeline (scroll vertical, sin scroll horizontal nativo; tramo en `FREE_RANGES`). Haces: 3–5 `CatmullRomCurve3` con `TubeGeometry` fino y `ShaderMaterial` (degradé cian→violeta por UV, cabeza de avance con `uProgress` de `fx.beamsT`, sin uniform de tiempo continuo). Partículas (≤600, `Points`) sobre las curvas. Parallax sutil por capas. Al llegar al puerto lateral: encender `mac-on`, texto «// NUEVO SISTEMA: CLOUD / > MIGRACIÓN: EN PROGRESO» y barra de progreso al 100%. `--era` sube a \~0.8.
- **Aceptación:** recorrido continuo sin cortes en ambos sentidos; detener el scroll a mitad del paneo mantiene la posición (sin snap); la PC vieja queda atrás sin saltos; sin fugas de geometría al ir y volver.
- **No tocar:** `createMaster.ts` salvo ajustar `FREE_RANGES`.

### Etapa 7 — Escena 05: estrategias de migración

- **Archivos:** `StrategiesScene/`, `GlassCard/`, `animations/scenes/strategies.ts`.
- **Hacer:** zoom a la pantalla de la MacBook; la estética retro desaparece (scanlines off, plates retro a opacidad 0). Tres `GlassCard` (`backdrop-filter`) con diagramas SVG: BIG BANG (A→B en un paso), PARALELO (dos carriles sincronizados), STRANGLER FIG (monolito que cede módulos hacia nuevos servicios, resaltada como recomendada). Cada diagrama: timeline propio **pausado**, `play()` al hover/click/focus y `reverse()` al salir; al abandonar la escena todos vuelven a `progress(0)`. Los diagramas no usan flechas del teclado.
- **Aceptación:** diagramas explican la diferencia sin texto extra; interrumpir una animación no deja estados rotos; STRANGLER FIG destacada.
- **No tocar:** escenas 01–04.

### Etapa 8 — Escena 06: métricas (bento de 5 módulos)

- **Archivos:** `MetricsScene/`, `config/metrics.data.ts`, `animations/scenes/metrics.ts`.
- **Hacer:** las 3 tarjetas se transforman en slots del bento con valores calculados por función (`x: () => slot.left - card.left`) para que sobrevivan al resize (`invalidateOnRefresh`). Módulos: 01 Integridad (100%), 02 Paridad funcional (checks + barra), 03 Rendimiento (2 curvas SVG que se dibujan con `pathLength=1`), 04 Desviación cronograma/presupuesto (±0% y +2%), 05 Adopción (24 min → 8 min). Contadores con objeto tweenado. Todos los valores en `metrics.data.ts` y un pie visible: «Datos ilustrativos de ejemplo académico».
- **Aceptación:** el morph se ve como transformación, no como corte; revertir deja las 3 tarjetas intactas; sin duplicados.
- **No tocar:** escena 05 (solo exponer refs necesarias).

### Etapa 9 — Escena 07: cierre y apagado OLED

- **Archivos:** `ClosingScene/`, `animations/scenes/closing.ts`.
- **Hacer:** dolly back del `rig` hasta la MacBook centrada, módulos fuera, «GRACIAS.» y «MIGRACIÓN COMPLETADA CON ÉXITO», tramo muerto de scroll (la «pausa»), y luego apagado: pantalla, ondas iridiscentes y retroiluminación del teclado a 0 hasta `#050505` puro. Todo scrubbed.
- **Aceptación:** el final cierra el ciclo con la escena 01; volver desde el apagado restaura todo; sin parpadeos.
- **No tocar:** escenas 01–06.

### Etapa 10 — Endurecimiento: rendimiento, fallback y proyector

- **Hacer:** `PerformanceMonitor` de Drei para bajar de tier automáticamente; `dpr` y partículas por tier; `React.lazy` para `Stage3D` y precarga de la siguiente escena; **fallback sin WebGL** (plates + DOM, misma narrativa); `prefers-reduced-motion` con crossfades en lugar de zooms; revisión de contraste y tamaños de texto a 1280×720, 1920×1080 y 1024×768; `npm run build` + `vite preview` verificados sin internet; guía de ejecución en `README` (navegador, modo pantalla completa F11, flags `?quality=`).
- **Aceptación:** recorrido completo 3 veces seguidas sin degradación; memoria estable (sin crecimiento tras ir y volver 10 veces); consola limpia; fallback verificado forzando `?quality=fallback`.

## 6. Protocolo de QA por etapa

1. Recorrido completo hacia adelante y hacia atrás, lento y rápido.
2. Cambios de dirección a mitad de transición, con rueda y con flechas.
3. Home y End desde cualquier escena; clic en la barra de progreso.
4. `__qa.stress(30000)`: el conteo de triggers no crece.
5. Redimensionar la ventana en cada escena: sin saltos ni desalineación plate/DOM/3D.
6. Consola sin errores ni warnings de GSAP/Three; FPS medidos en tier medium.
7. Capturas de reposo de cada escena comparadas con el PDF.
