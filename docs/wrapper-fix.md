# Corrección Etapa 5 — Wrapper de vidrio dicroico (Escena 03)

Guardar como `docs/wrapper-fix.md` y la imagen de referencia como `docs/ref/wrapper-reference.jpg`.
Prompt para Antigravity: «Leé `docs/PLAN.md` (reglas globales) y `docs/wrapper-fix.md`. Reemplazá la implementación actual del wrapper por la de este documento. Comparalo contra `docs/ref/wrapper-reference.jpg` antes de dar la tarea por terminada.»

## 1. Diagnóstico de la implementación actual

1. **Cubo plano:** son dos rectángulos rellenos (turquesa y gris azulado). Un vidrio no tiene relleno: el centro es casi transparente y lo que se ve son bordes, reflejos y color iridiscente que cambia con el ángulo.
2. **Piso:** hay un polígono verde opaco. Debe ser un resplandor suave más un reflejo difuso del plate.
3. **Anillos:** son cian, enormes, sin brillo, sin nodos visibles y no pasan por detrás de la computadora. La referencia pide verde esmeralda, brillo, nodos luminosos y oclusión (el tramo de atrás queda tapado y más tenue).
4. **Pantalla:** el texto es chico, está pegado al borde izquierdo (se sale del marco) y no tiene brillo de fósforo. En la referencia el texto es grande, está centrado y brilla.
5. **Etiqueta:** «API WRAPPER // LAYER» debe ir sobre el borde superior del cubo, con la línea quebrada en diagonal de la referencia.
6. **Círculo con «X» sobre la barra de progreso:** probablemente es un overlay del agente de navegador de Antigravity y no parte de la app. Verificar que no exista en el DOM.

## 2. Objetivo visual (referencia)

- Cubo de bordes muy redondeados, visto levemente desde arriba y desde la izquierda, con la cara lateral izquierda visible.
- Interior casi transparente. Bordes y esquinas con iridiscencia tipo película delgada (magenta, verde, azul, amarillo) y una franja diagonal de reflejo sutil.
- Dos anillos esmeralda finos y luminosos, inclinados, con 5 nodos brillantes cada uno. Pasan por delante del cubo y por detrás de la computadora.
- Resplandor verde y violeta sobre el piso, con reflejo difuso de la computadora.
- Pantalla: texto grande verde fósforo con glow, scanlines y viñeta.

## 3. Archivos

Crear: `three/Wrapper/glassShader.ts`, `three/Wrapper/WrapperCube.tsx`, `three/Wrapper/WrapperRings.tsx`, `three/Wrapper/glowTexture.ts`, `components/Wrapper/WrapperLabel.tsx`, `styles/wrapper.css`.
Modificar: `three/fx.ts`, `config/calibration.ts`, `animations/scenes/wrapper.ts`, `animations/timeline.ts` (solo agregar `tl.set(fx, FX_INITIAL, 0)`), `components/CRTScreen/` (solo estilos de texto, ver 4.7).
Eliminar: el plano verde del piso, los rellenos del cubo y los anillos cian actuales.

**No tocar:** escenas 01, 02 y 04 a 07, `createMaster.ts`, navegación, barra de progreso, `rig.ts`.

## 4. Código

### 4.1 `config/calibration.ts` (agregar)

```ts
// bbox del plate de la PC en px de mundo (medirla con ?debug=screen y ajustar)
export const PC_BOX = { w: 760, h: 900 };

export const WRAP = {
  w: PC_BOX.w * 1.22,
  h: PC_BOX.h * 1.08,
  d: PC_BOX.w * 0.62,
  radius: 70,
  rotX: 0.10,   // se ve un poco la cara superior
  rotY: 0.30,   // se ve la cara lateral izquierda
  centerY: 0,
};

export const RING = {
  r1: WRAP.w * 0.80, tiltX1: 1.18, tiltZ1: -0.20, phase1: 0.0,
  r2: WRAP.w * 0.72, tiltX2: 1.05, tiltZ2: 0.24,  phase2: 1.1,
};
```

### 4.2 `three/fx.ts`

```ts
export const FX_INITIAL = {
  wrapY: 1100, wrapRotY: 1.1, wrapOpacity: 0, wrapGlow: 0,
  ringsScale: 0.6, ringsOpacity: 0, ringsT: 0,
};
export const fx = { ...FX_INITIAL };
```

En `buildMaster` (timeline.ts), junto al `tl.set(rig, ...)`: `tl.set(fx, FX_INITIAL, 0);`

### 4.3 `three/Wrapper/glassShader.ts`

```ts
import { ShaderMaterial, FrontSide, BackSide, NormalBlending } from 'three';

const vert = /* glsl */ `
varying vec3 vN; varying vec3 vV; varying vec3 vWP;
void main() {
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vWP = wp.xyz;
  vN = normalize(mat3(modelMatrix) * normal);
  vV = normalize(cameraPosition - wp.xyz);
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;

const frag = /* glsl */ `
varying vec3 vN; varying vec3 vV; varying vec3 vWP;
uniform float uOpacity; uniform float uGlow; uniform float uBack; uniform float uShift;
vec3 pal(float t) { return 0.5 + 0.5 * cos(6.28318 * (t + vec3(0.00, 0.33, 0.67))); }
void main() {
  vec3 N = normalize(vN); vec3 V = normalize(vV);
  float ndv = abs(dot(N, V));
  float fres = pow(1.0 - ndv, 2.0);                       // fuerte en bordes y caras oblicuas
  float hue = fres * 1.3 + dot(vWP.xy, vec2(0.0011, 0.0008)) + uShift;
  vec3 film = pal(hue);                                    // película delgada: arcoíris según ángulo y posición
  float rim = smoothstep(0.25, 0.95, fres);
  float band = smoothstep(0.0, 0.03, 0.05 - abs(fract(dot(vWP.xy, vec2(0.0016, -0.0012)) + 0.3) - 0.5));
  vec3 tint = vec3(0.55, 0.85, 1.0);
  vec3 col = film * rim * (1.15 + uGlow) + tint * (0.05 + band * 0.35);
  float a = mix(0.025, 0.92, rim) + band * 0.10;           // centro casi transparente
  a *= uOpacity * mix(1.0, 0.5, uBack);                    // caras traseras más tenues
  gl_FragColor = vec4(col, clamp(a, 0.0, 1.0));
}`;

export function makeGlassMaterial(back: boolean) {
  return new ShaderMaterial({
    vertexShader: vert,
    fragmentShader: frag,
    uniforms: { uOpacity: { value: 0 }, uGlow: { value: 0 }, uBack: { value: back ? 1 : 0 }, uShift: { value: 0 } },
    transparent: true,
    depthWrite: false,
    side: back ? BackSide : FrontSide,
    blending: NormalBlending,
    toneMapped: false,
  });
}
```

### 4.4 `three/Wrapper/WrapperCube.tsx`

```tsx
import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBox } from '@react-three/drei';
import type { Group } from 'three';
import { fx } from '../fx';
import { WRAP } from '../../config/calibration';
import { makeGlassMaterial } from './glassShader';

export function WrapperCube() {
  const group = useRef<Group>(null!);
  const back = useMemo(() => makeGlassMaterial(true), []);
  const front = useMemo(() => makeGlassMaterial(false), []);
  useEffect(() => () => { back.dispose(); front.dispose(); }, [back, front]);

  useFrame(() => {
    const g = group.current;
    g.position.set(0, WRAP.centerY + fx.wrapY, 0);
    g.rotation.set(WRAP.rotX, WRAP.rotY + fx.wrapRotY, 0);
    for (const m of [back, front]) {
      m.uniforms.uOpacity.value = fx.wrapOpacity;
      m.uniforms.uGlow.value = fx.wrapGlow;
    }
  });

  // Dos pasadas: caras traseras (renderOrder 1) y delanteras (2) => se ve el interior del vidrio
  return (
    <group ref={group}>
      <RoundedBox args={[WRAP.w, WRAP.h, WRAP.d]} radius={WRAP.radius} smoothness={8} renderOrder={1} material={back} />
      <RoundedBox args={[WRAP.w, WRAP.h, WRAP.d]} radius={WRAP.radius} smoothness={8} renderOrder={2} material={front} />
    </group>
  );
}
```

### 4.5 `three/Wrapper/glowTexture.ts`

```ts
import { CanvasTexture } from 'three';

let tex: CanvasTexture | null = null;
export function getGlowTexture() {
  if (tex) return tex;
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d')!;
  const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, 'rgba(255,255,255,1)');
  gr.addColorStop(0.18, 'rgba(160,255,200,0.95)');
  gr.addColorStop(0.45, 'rgba(25,245,140,0.35)');
  gr.addColorStop(1, 'rgba(25,245,140,0)');
  g.fillStyle = gr;
  g.fillRect(0, 0, 64, 64);
  tex = new CanvasTexture(c);
  return tex;
}
```

### 4.6 `three/Wrapper/WrapperRings.tsx`

```tsx
import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import {
  AdditiveBlending, BufferAttribute, CatmullRomCurve3, Color, Group, NormalBlending,
  Points, PointsMaterial, ShaderMaterial, TubeGeometry, Vector3,
} from 'three';
import { fx } from '../fx';
import { PC_BOX, RING } from '../../config/calibration';
import { getGlowTexture } from './glowTexture';

function ringMaterial(additive: boolean, range: number) {
  return new ShaderMaterial({
    uniforms: { uOpacity: { value: 0 }, uColor: { value: new Color('#19f58c') }, uRange: { value: range } },
    vertexShader: `varying float vZ;
      void main() { vec4 wp = modelMatrix * vec4(position, 1.0); vZ = wp.z; gl_Position = projectionMatrix * viewMatrix * wp; }`,
    fragmentShader: `varying float vZ; uniform float uOpacity; uniform vec3 uColor; uniform float uRange;
      void main() { float f = smoothstep(-uRange, uRange, vZ);              // tramo trasero más tenue
        gl_FragColor = vec4(uColor, uOpacity * mix(0.35, 1.0, f)); }`,
    transparent: true, depthWrite: false, depthTest: true, toneMapped: false,
    blending: additive ? AdditiveBlending : NormalBlending,
  });
}

function Ring({ radius, tiltX, tiltZ, phase, nodes = 5 }: { radius: number; tiltX: number; tiltZ: number; phase: number; nodes?: number }) {
  const grp = useRef<Group>(null!);
  const pts = useRef<Points>(null!);
  const curve = useMemo(() => new CatmullRomCurve3(
    Array.from({ length: 96 }, (_, i) => { const a = (i / 96) * Math.PI * 2; return new Vector3(Math.cos(a) * radius, 0, Math.sin(a) * radius); }), true), [radius]);
  const core = useMemo(() => new TubeGeometry(curve, 240, 1.6, 6, true), [curve]);
  const halo = useMemo(() => new TubeGeometry(curve, 240, 7, 6, true), [curve]);
  const mCore = useMemo(() => ringMaterial(false, radius * 0.5), [radius]);
  const mHalo = useMemo(() => ringMaterial(true, radius * 0.5), [radius]);
  const nodePos = useMemo(() => new Float32Array(nodes * 3), [nodes]);

  useFrame(() => {
    grp.current.scale.setScalar(fx.ringsScale);
    mCore.uniforms.uOpacity.value = fx.ringsOpacity * 0.95;
    mHalo.uniforms.uOpacity.value = fx.ringsOpacity * 0.16;
    for (let i = 0; i < nodes; i++) {                      // los nodos orbitan según el scroll (reversible)
      const a = phase + (i / nodes) * Math.PI * 2 + fx.ringsT * Math.PI * 1.2;
      nodePos[i * 3] = Math.cos(a) * radius; nodePos[i * 3 + 1] = 0; nodePos[i * 3 + 2] = Math.sin(a) * radius;
    }
    (pts.current.geometry.attributes.position as BufferAttribute).needsUpdate = true;
    (pts.current.material as PointsMaterial).opacity = fx.ringsOpacity;
  });

  return (
    <group ref={grp} rotation={[tiltX, 0, tiltZ]} renderOrder={3}>
      <mesh geometry={halo} material={mHalo} />
      <mesh geometry={core} material={mCore} />
      <points ref={pts}>
        <bufferGeometry><bufferAttribute attach='attributes-position' args={[nodePos, 3]} /></bufferGeometry>
        <pointsMaterial map={getGlowTexture()} size={26} sizeAttenuation={false} transparent depthWrite={false}
          blending={AdditiveBlending} color='#7dffb8' />
      </points>
    </group>
  );
}

export function WrapperRings() {
  return (
    <>
      {/* Oclusor: escribe profundidad sin pintar; tapa el tramo trasero de los anillos detrás de la PC */}
      <mesh renderOrder={0}>
        <planeGeometry args={[PC_BOX.w * 0.92, PC_BOX.h * 0.95]} />
        <meshBasicMaterial colorWrite={false} />
      </mesh>
      <Ring radius={RING.r1} tiltX={RING.tiltX1} tiltZ={RING.tiltZ1} phase={RING.phase1} />
      <Ring radius={RING.r2} tiltX={RING.tiltX2} tiltZ={RING.tiltZ2} phase={RING.phase2} />
    </>
  );
}
```

Dentro de `Stage3D` renderizar `<WrapperCube />` y `<WrapperRings />` dentro del `Suspense`. Mantener `frameloop='demand'`: no agregar animaciones por tiempo.

### 4.7 DOM: etiqueta, piso y pantalla

`components/Wrapper/WrapperLabel.tsx`:

```tsx
export function WrapperLabel() {
  return (
    <div className='wrap-label' aria-hidden>
      <span>API WRAPPER // LAYER</span>
      <svg viewBox='0 0 760 44' preserveAspectRatio='none'>
        <path d='M0 38 H 330 L 368 8 H 760' fill='none' stroke='currentColor' strokeWidth='1.5' vectorEffect='non-scaling-stroke' />
      </svg>
    </div>
  );
}
```

Dentro de la capa `#world`, junto al plate de la PC (que debe estar en un contenedor `position: relative`), agregar `<WrapperLabel />`, `<div className='wrapper-floor' />` y una copia del plate con la clase `plate--reflection`. Definir en el contenedor las variables `--wrap-w` y `--wrap-h` con los valores de `WRAP.w` y `WRAP.h` en px.

`styles/wrapper.css`:

```css
.wrap-label {
  position: absolute;
  left: calc(50% - var(--wrap-w) / 2 + 6%);
  top: calc(50% - var(--wrap-h) / 2 + 4%);
  width: calc(var(--wrap-w) * 0.78);
  color: #e9fff3; opacity: 0; visibility: hidden; pointer-events: none;
  font: 500 16px/1 'JetBrains Mono', monospace; letter-spacing: 0.14em;
  text-shadow: 0 0 8px rgba(120, 255, 190, 0.6);
}
.wrap-label svg { display: block; width: 100%; height: 44px; margin-top: 10px; opacity: 0.85; }

.wrapper-floor {
  position: absolute; left: 50%; top: calc(50% + var(--wrap-h) / 2 - 30px);
  width: calc(var(--wrap-w) * 1.1); height: 220px; transform: translateX(-50%);
  background: radial-gradient(ellipse at 50% 0%, rgba(25, 245, 140, 0.45), rgba(120, 70, 255, 0.18) 45%, transparent 70%);
  filter: blur(18px); mix-blend-mode: screen; opacity: 0; pointer-events: none;
}
.plate--reflection {
  position: absolute; left: 0; top: 100%; width: 100%;
  transform: scaleY(-1); opacity: 0.35; filter: blur(2px); pointer-events: none;
  -webkit-mask-image: linear-gradient(to bottom, rgba(0, 0, 0, 0.5), transparent 35%);
          mask-image: linear-gradient(to bottom, rgba(0, 0, 0, 0.5), transparent 35%);
}

/* Pantalla CRT: el tamaño del texto depende del ancho de la pantalla (container query units) */
.crt { container-type: size; position: absolute; overflow: hidden; border-radius: 6% / 8%;
  background: radial-gradient(ellipse at 50% 45%, rgba(20, 90, 45, 0.55), rgba(2, 18, 8, 0.92) 75%); }
.crt::before { content: ''; position: absolute; inset: 0; pointer-events: none; mix-blend-mode: multiply;
  background: repeating-linear-gradient(to bottom, rgba(0, 0, 0, 0.28) 0 1px, transparent 1px 3px); }
.crt::after { content: ''; position: absolute; inset: 0; pointer-events: none;
  background: radial-gradient(ellipse at center, transparent 55%, rgba(0, 0, 0, 0.65) 100%); }
.crt-text { position: absolute; inset: 14% 8% 12% 9%; display: flex; flex-direction: column; justify-content: center; gap: 7cqh;
  color: #3dff8a; font-family: 'JetBrains Mono', monospace; font-weight: 600;
  text-shadow: 0 0 6px rgba(61, 255, 138, 0.85), 0 0 18px rgba(61, 255, 138, 0.4); }
.crt-title { font-size: 7.4cqw; letter-spacing: 0.02em; }
.crt-line  { font-size: 6.4cqw; }
```

Verificar que el texto de las capas de pantalla (boot, decisión y wrapper) use `.crt-text`, `.crt-title` y `.crt-line` para que escale igual en las tres.

### 4.8 `animations/scenes/wrapper.ts`

```ts
import { rig } from '../rig';
import { fx } from '../../three/fx';
import { typeInto } from '../typeInto';
import type { SceneBuilder } from '../timeline';

const q = (s: string) => document.querySelector(s)!;

export const buildWrapper: SceneBuilder = (tl) => {
  const t = tl.duration();
  // 1. zoom out al plano completo de la PC
  tl.to(rig, { s: 1, tx: 0, ty: 0, era: 0.3, duration: 0.9, ease: 'power2.inOut' }, t);
  tl.to('.crt-layer--decision', { autoAlpha: 0, duration: 0.25 }, t + 0.5);
  // 2. el cubo desciende girando y se acopla
  tl.to(fx, { wrapOpacity: 1, duration: 0.25 }, t + 0.75);
  tl.to(fx, { wrapY: 0, wrapRotY: 0, duration: 1.0, ease: 'power3.out' }, t + 0.75);
  tl.to(fx, { wrapGlow: 1.0, duration: 0.12, ease: 'power2.out' }, t + 1.65);   // destello al acoplar
  tl.to(fx, { wrapGlow: 0.25, duration: 0.35 }, t + 1.77);
  // 3. anillos, nodos, piso y etiqueta
  tl.to(fx, { ringsOpacity: 1, ringsScale: 1, duration: 0.6, ease: 'power2.out' }, t + 1.7);
  tl.to(fx, { ringsT: 1, duration: 1.2 }, t + 1.7);
  tl.to('.wrapper-floor', { opacity: 1, duration: 0.5 }, t + 1.7);
  tl.to('.wrap-label', { autoAlpha: 1, duration: 0.2 }, t + 1.8);
  // 4. la pantalla cambia de contenido (crossfade + tipeo derivado del scroll)
  tl.to('.crt-layer--wrapper', { autoAlpha: 1, duration: 0.2 }, t + 1.9);
  typeInto(tl, q('.wr-title'), '// API WRAPPER v2.0', t + 1.9, 0.25);
  typeInto(tl, q('.wr-l1'), '> CORE: UNTOUCHED', t + 2.15, 0.25);
  typeInto(tl, q('.wr-l2'), '> INTERFACE: MODERNIZED', t + 2.4, 0.3);
  tl.addLabel('s2', t + 2.9);
};
```

## 5. Criterios de aceptación

1. A 1920×1080, captura de reposo de la escena 03 lado a lado con la referencia: el cubo tiene el centro casi transparente y bordes iridiscentes multicolor, sin rellenos planos.
2. No existe el polígono verde del piso. Hay resplandor esmeralda/violeta y un reflejo difuso del plate.
3. Anillos esmeralda finos con halo, 5 nodos luminosos por anillo. El tramo trasero queda detrás de la PC y más tenue; el delantero pasa sobre el cubo.
4. El texto de la pantalla es grande, centrado dentro del marco, con glow, scanlines y viñeta. Ocupa proporciones similares a la referencia.
5. La etiqueta «API WRAPPER // LAYER» está sobre el borde superior del cubo con la línea quebrada.
6. Reversibilidad: avanzar y retroceder por la escena 03 deja cubo, anillos, piso, etiqueta y textos en el estado correcto, sin duplicados. `__qa.stress()` mantiene constante el conteo de triggers.
7. Rendimiento: sin `transmission`, sin postprocesado, `frameloop='demand'` (sin renders con la escena quieta). 45 fps o más en tier medium.
8. Consola sin errores.

## 6. Cómo iterar sin rediseñar

Si algo no queda igual a la referencia, **ajustar solo constantes**: `WRAP` (tamaño y rotación), `RING` (radios e inclinaciones), el exponente de `fres` y el rango de `smoothstep` del shader, `uShift` (corre el arcoíris), los valores de `alpha` y los tiempos del timeline. No reemplazar el enfoque ni agregar librerías.

Mejora opcional: si el plate de la PC tiene fondo transparente, usarlo como `alphaMap` del oclusor para que la oclusión siga la silueta real de la computadora y no un rectángulo.
