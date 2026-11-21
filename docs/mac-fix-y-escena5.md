# Plan: encuadre de la MacBook + Escena 05 (estrategias), sin quemar cuota

Guardar como `docs/mac-fix-y-escena5.md`. Cada prompt le dice a Antigravity que lea la sección que corresponde; el código ya está escrito, así que el agente solo lo pega y lo conecta.

## 0. Diagnóstico del encuadre (con medidas de tus capturas)

| | Pantalla real del plate | Overlay actual |
|---|---|---|
| Tamaño | ~779 × 471 px (relación **1.65**) | ~828 × 438 px (relación **1.89**) |
| Posición | empieza ~27 px debajo del borde del lid | ~17 px **más arriba** y termina ~50 px antes del borde inferior |

Conclusión: el overlay no tiene la proporción de la pantalla (parece pensado para 16:9), es más ancho que el cristal, no tiene esquinas redondeadas y deja una franja negra abajo. No se arregla «ajustando un poco» sin una referencia: hay que **medir la pantalla una vez** y definir el overlay en **porcentajes del plate**, para que escale igual con zoom, paneo y cualquier resolución.

Dos decisiones que te recomiendo:

1. **Sacar el botón «HACÉ CLICK PARA INICIAR» de la MacBook.** El plan dice que la pantalla se enciende cuando llegan los haces, controlada por el scroll. Un click no es reversible: al volver atrás, el estado queda inconsistente. Si lo querés conservar, avisame y lo tratamos como excepción documentada.
2. **El encendido de la MacBook va dentro del timeline** (tweens con scrub), no con un `onClick`.

## 1. Protocolo anti-cuota (pegar al inicio de cada conversación con el agente)

Por qué se agota la cuota: cada pedido de «arreglalo» hace que el agente explore el repo, abra el navegador, saque capturas, reescriba archivos y escriba reportes. Todo eso consume. Reglas:

1. **Git antes de cada prompt:** `git add -A && git commit -m "antes de <paso>"`. Si sale mal: `git restore .` (gratis) en vez de pedirle al agente que deshaga.
2. **Una conversación nueva por paso**, con un prompt corto que apunta a este archivo. Contexto corto = menos consumo.
3. **Modo rápido, sin planificación extensa**, y si tu cuenta permite elegir modelo, usá el más liviano para cambios mecánicos (pegar código, convertir unidades).
4. **Prohibido en cada prompt:** explorar el repo completo, abrir el agente de navegador, sacar capturas, reescribir archivos completos, escribir informes o walkthroughs.
5. **Verificación mínima del agente:** solo `npx tsc --noEmit`. La verificación visual la hacés vos en un minuto.
6. **Los números (posiciones, tamaños, tiempos) los ajustás vos** en `config/calibration.ts`, sin agente.
7. **Si algo falla:** pegá el error de consola, el archivo y la línea. Nunca «no funciona, arreglalo».
8. **Sin cuota:** todo el código de este documento se puede pegar a mano en tu editor (VS Code o el editor de Antigravity), sin usar el agente.

Fragmento fijo para cada prompt:

> Reglas: no explores el repo, no uses el navegador ni hagas capturas, no reescribas archivos completos (solo cambios mínimos en los archivos que te nombro), no instales dependencias, no escribas informes. Al terminar corré `npx tsc --noEmit` y respondé solo con la lista de archivos tocados.

## 2. Fase A — Arreglar el encuadre de la MacBook

### A1 — Overlay porcentual + herramienta de calibración (agente, 1 prompt)

**Prompt:**
> Leé la sección A1 de `docs/mac-fix-y-escena5.md`. Hacé lo siguiente: (1) agregá `MAC_SCREEN` a `config/calibration.ts`; (2) creá `components/MacScreen/MacScreen.tsx` y `components/MacScreen/CalibMac.tsx`; (3) mové el contenido actual de «// NUEVO SISTEMA: CLOUD» (nube, barra, ondas, textos) para que sea hijo de `<MacScreen>`, dentro del contenedor del plate de la MacBook; (4) convertí **todos** los `px` de ese contenido a `cqw` con la regla `cqw = px / 780 * 100` (incluye tamaños de fuente, paddings, gaps, bordes de 1px se quedan en px); (5) en `useKeyboardNav` ignorá las teclas si la URL tiene `?calib`. Pegá el fragmento fijo de reglas.

**`config/calibration.ts` (agregar):**

```ts
// Fracciones del plate de la MacBook (0..1). Punto de partida estimado desde una captura: se afina con ?calib=mac
export const MAC_SCREEN = { l: 0.113, t: 0.041, w: 0.777, h: 0.716 };
// Control: (MAC_PLATE.w * w) / (MAC_PLATE.h * h) debe dar ~1.65

export function macScreenZoom() {
  const w = MAC_PLATE.w * MAC_SCREEN.w;
  const h = MAC_PLATE.h * MAC_SCREEN.h;
  // centro de la pantalla en coordenadas de mundo (px, y hacia abajo), relativo al centro de #world
  const cx = MAC_PLATE.x + (MAC_SCREEN.l + MAC_SCREEN.w / 2 - 0.5) * MAC_PLATE.w;
  const cy = MAC_PLATE.y + (MAC_SCREEN.t + MAC_SCREEN.h / 2 - 0.5) * MAC_PLATE.h;
  const s = Math.min((window.innerWidth * 0.94) / w, (window.innerHeight * 0.94) / h);
  return { s, tx: -cx * s, ty: -cy * s };
}
```

`MAC_PLATE = { x, y, w, h }` es el centro y el tamaño en px del plate de la MacBook dentro de `#world`. Si ya existe con otros nombres, reutilizarlo.

**`components/MacScreen/MacScreen.tsx`:**

```tsx
import type { ReactNode } from 'react';
import { MAC_SCREEN } from '../../config/calibration';

export function MacScreen({ children }: { children: ReactNode }) {
  const { l, t, w, h } = MAC_SCREEN;
  return (
    <div
      className='mac-screen'
      style={{ left: `${l * 100}%`, top: `${t * 100}%`, width: `${w * 100}%`, height: `${h * 100}%` }}
    >
      {children}
    </div>
  );
}
```

```css
/* styles/effects.css */
.mac-plate { position: relative; }              /* contenedor del plate de la MacBook */
.mac-screen {
  position: absolute; overflow: hidden; container-type: size;
  border-radius: 1.4% / 2.3%; background: #04050a;
}
.mac-ui { position: absolute; inset: 0; padding: 4cqw 4.5cqw; }   /* UI «NUEVO SISTEMA: CLOUD» */
/* IMPORTANTE: no usar will-change: transform en #world ni en .mac-screen (el zoom se ve borroso) */
```

**`components/MacScreen/CalibMac.tsx`** (se renderiza solo con `?calib=mac`, dentro de `.mac-plate`):

```tsx
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { MAC_SCREEN } from '../../config/calibration';

export function CalibMac() {
  const [v, setV] = useState({ ...MAC_SCREEN });
  useEffect(() => {
    const dirs: Record<string, [number, number]> = {
      ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1],
    };
    const on = (e: KeyboardEvent) => {
      const d = dirs[e.key];
      if (!d) return;
      e.preventDefault();
      const step = e.ctrlKey ? 0.005 : 0.001;               // Ctrl = paso grande
      setV((p) => e.shiftKey
        ? { ...p, w: p.w + d[0] * step, h: p.h + d[1] * step }   // Shift + flechas = tamaño
        : { ...p, l: p.l + d[0] * step, t: p.t + d[1] * step }); // flechas = posición
    };
    window.addEventListener('keydown', on);
    return () => window.removeEventListener('keydown', on);
  }, []);

  const line = `MAC_SCREEN = { l: ${v.l.toFixed(4)}, t: ${v.t.toFixed(4)}, w: ${v.w.toFixed(4)}, h: ${v.h.toFixed(4)} };`;
  return (
    <>
      <div style={{ position: 'absolute', left: `${v.l * 100}%`, top: `${v.t * 100}%`, width: `${v.w * 100}%`, height: `${v.h * 100}%`,
        outline: '2px solid #ff2bd6', background: 'rgba(255,43,214,.08)', pointerEvents: 'none', zIndex: 50 }} />
      {createPortal(
        <pre style={{ position: 'fixed', left: 12, bottom: 12, zIndex: 9999, margin: 0, padding: '8px 12px', color: '#ff2bd6',
          background: '#000c', font: '14px monospace' }}>{line}</pre>, document.body)}
    </>
  );
}
```

Se usa con un `createPortal` al body para que el texto no quede dentro del `transform` de `#world` (un `position: fixed` dentro de un elemento transformado deja de ser fijo a la pantalla).

### A2 — Calibrar a mano (vos, 1 minuto, sin agente)

1. Abrí `http://localhost:5173/?calib=mac`, hacé scroll hasta que la MacBook esté a la vista.
2. El rectángulo magenta es la pantalla. Flechas = mover. **Shift + flechas** = cambiar tamaño. **Ctrl** = paso grande.
3. Alineá el rectángulo con el cristal oscuro (esquinas internas del marco). Copiá la línea `MAC_SCREEN = {...}` que aparece abajo a la izquierda y pegala en `config/calibration.ts`.
4. Control: el ancho/alto en px debe dar ~1.65. Si da ~1.89, el rectángulo sigue mal.
5. Commit: `git commit -am "calibración MacBook"`.

### A3 — Encendido por scroll (agente, 1 prompt)

**Prompt:**
> Leé la sección A3 de `docs/mac-fix-y-escena5.md`. Eliminá el botón «HACÉ CLICK PARA INICIAR» de la MacBook y su estado asociado. Reemplazalo por los tweens de abajo dentro del builder de la escena 04 (`animations/scenes/migration.ts`), sin tocar el paneo ni los haces. Pegá el fragmento fijo de reglas.

```ts
// al final del builder de migration.ts, cuando los haces llegan al puerto (usar el tiempo ya existente: tArrive)
const tArrive = /* tiempo en el que los haces llegan a la MacBook */ 0;

tl.fromTo('.mac-ui', { clipPath: 'inset(50% 0 50% 0)', autoAlpha: 0 },
                      { clipPath: 'inset(0% 0 0% 0)', autoAlpha: 1, duration: 0.35, ease: 'power2.out' }, tArrive);
tl.fromTo('.mac-bar-fill', { scaleX: 0 }, { scaleX: 1, duration: 0.9, ease: 'none', transformOrigin: 'left center' }, tArrive + 0.2);
const pct = { v: 0 };
tl.to(pct, { v: 100, duration: 0.9, ease: 'none',
  onUpdate: () => { const el = document.querySelector('.mac-pct'); if (el) el.textContent = Math.round(pct.v) + ' %'; } }, tArrive + 0.2);
```

Nota: es la excepción a «solo `tl.to`»: son `fromTo` de elementos que aparecen una sola vez, sin otro tween previo sobre las mismas propiedades. Si el agente ya usa `tl.set` + `tl.to`, mantener ese estilo.

**Criterio de aceptación de la Fase A (lo verificás vos):**
- La pantalla encendida cubre exactamente el cristal, con esquinas redondeadas, sin franja negra abajo ni invasión del marco.
- Con el paneo, el overlay no se desfasa del plate.
- Al volver atrás, la MacBook vuelve a apagada sin quedar medio encendida.

## 3. Fase B — Escena 05: las 3 tarjetas de estrategias

### B1 — Zoom + tarjetas + diagramas (agente, 1 prompt)

**Prompt:**
> Leé la sección B1 de `docs/mac-fix-y-escena5.md`. Creá los archivos indicados con el código exacto, agregá `<StrategiesLayer />` dentro de `<MacScreen>` (hermano de `.mac-ui`), registrá `buildStrategies` como builder de la escena 05 en el master (label `s4`) y agregá `import './strategies.css'`. No modifiques las escenas 01 a 04. Pegá el fragmento fijo de reglas.

**`animations/scenes/strategies.ts`:**

```ts
import { rig } from '../rig';
import { macScreenZoom } from '../../config/calibration';
import type { SceneBuilder } from '../timeline';

export const buildStrategies: SceneBuilder = (tl) => {
  const t = tl.duration();
  // zoom al interior de la pantalla; con funciones se recalcula en resize (invalidateOnRefresh)
  tl.to(rig, { s: () => macScreenZoom().s, tx: () => macScreenZoom().tx, ty: () => macScreenZoom().ty,
    era: 1, duration: 1, ease: 'power2.inOut' }, t);
  tl.to('.retro-layer', { autoAlpha: 0, duration: 0.4 }, t + 0.3);   // PC vieja, haces y scanlines fuera
  tl.to('.mac-ui', { autoAlpha: 0, duration: 0.3 }, t + 0.5);        // sale la UI «NUEVO SISTEMA»
  tl.to('.strat-layer', { autoAlpha: 1, duration: 0.01 }, t + 0.7);
  tl.to('.strat-card', { autoAlpha: 1, y: 0, stagger: 0.15, duration: 0.35 }, t + 0.8);
  tl.addLabel('s4', t + 1.7);
};
```

Marcar con la clase `retro-layer` el plate/elementos de la PC vieja y las escenas Three que ya no se ven (si el agente no la tiene, agregarla donde corresponda).

**`scenes/StrategiesScene/StrategiesLayer.tsx`:**

```tsx
import { useRef } from 'react';
import { useDiagram } from './useDiagram';
import { BigBang, Paralelo, Strangler } from './diagrams';
import type { diagramBuilders } from './diagramTimelines';

const CARDS = [
  { id: 'bigbang',   n: '01', title: 'BIG BANG',      cap: 'Reemplazo directo en un solo paso',        D: BigBang },
  { id: 'paralelo',  n: '02', title: 'PARALELO',      cap: 'Dos sistemas operando y sincronizados',    D: Paralelo },
  { id: 'strangler', n: '03', title: 'STRANGLER FIG', cap: 'Reemplazo modular y progresivo', D: Strangler, reco: true },
] as const;

function Card({ id, n, title, cap, D, reco }: {
  id: keyof typeof diagramBuilders; n: string; title: string; cap: string; D: () => JSX.Element; reco?: boolean;
}) {
  const root = useRef<HTMLDivElement>(null);
  const { enter, leave, toggle } = useDiagram(root, id);
  return (
    <div ref={root} className={`strat-card${reco ? ' is-reco' : ''}`} tabIndex={0}
      onPointerEnter={enter} onPointerLeave={leave} onFocus={enter} onBlur={leave} onClick={toggle}>
      <span className='strat-n'>[{n}]</span>
      <h3>{title}</h3>
      {reco && <em className='strat-badge'>RECOMENDADA</em>}
      <D />
      <p>{cap}</p>
    </div>
  );
}

export function StrategiesLayer() {
  return (
    <div className='strat-layer'>
      <div className='strat-grid'>{CARDS.map((c) => <Card key={c.id} {...c} />)}</div>
    </div>
  );
}
```

**`scenes/StrategiesScene/diagrams.tsx`:**

```tsx
export const BigBang = () => (
  <svg className='diag' viewBox='0 0 200 120'>
    <rect className='old bb-old' x='22' y='36' width='48' height='48' rx='8' />
    <path className='arrow bb-arrow' d='M78 60 H 120' pathLength={1} />
    <rect className='new bb-new' x='130' y='36' width='48' height='48' rx='8' />
  </svg>
);

export const Paralelo = () => (
  <svg className='diag' viewBox='0 0 200 120'>
    <rect className='old' x='20' y='28' width='160' height='22' rx='11' />
    <rect className='new lane' x='20' y='70' width='160' height='22' rx='11' />
    <path className='sync pr-sync' d='M70 50 V70' /><path className='sync pr-sync' d='M110 50 V70' /><path className='sync pr-sync' d='M150 50 V70' />
    <circle className='dot pr-dot' cx='34' cy='39' r='4.5' />
    <circle className='dot pr-dot' cx='34' cy='81' r='4.5' />
  </svg>
);

export const Strangler = () => (
  <svg className='diag' viewBox='0 0 200 120'>
    {[1, 2, 3].map((i) => (
      <g key={i}>
        <rect className={`old st-old-${i}`} x='16' y={24 + (i - 1) * 28} width='44' height='22' rx='6' />
        <path className={`arrow st-link st-link-${i}`} d={`M62 ${35 + (i - 1) * 28} C 90 ${35 + (i - 1) * 28}, 110 ${35 + (i - 1) * 28}, 138 ${35 + (i - 1) * 28}`} pathLength={1} />
        <rect className={`new st-new-${i}`} x='140' y={24 + (i - 1) * 28} width='44' height='22' rx='6' />
      </g>
    ))}
    <path className='facade st-facade' d='M100 14 V106' />
  </svg>
);
```

**`scenes/StrategiesScene/diagramTimelines.ts`:**

```ts
import type gsap from 'gsap';
type TL = gsap.core.Timeline;

export const diagramBuilders = {
  bigbang: (tl: TL) =>
    tl.to('.bb-arrow', { strokeDashoffset: 0, duration: 0.5, ease: 'power2.out' })
      .to('.bb-old', { opacity: 0.15, scale: 0.8, duration: 0.4 }, 0.35)
      .to('.bb-new', { opacity: 1, scale: 1, duration: 0.4, ease: 'back.out(1.6)' }, 0.5),

  paralelo: (tl: TL) =>
    tl.to('.pr-dot', { x: 132, duration: 1.3, ease: 'power1.inOut' })          // ambos avanzan a la vez
      .to('.pr-sync', { opacity: 1, stagger: 0.3, duration: 0.2 }, 0.2),       // y se sincronizan

  strangler: (tl: TL) => {
    tl.to('.st-facade', { opacity: 1, duration: 0.25 });                        // fachada / proxy que enruta
    [1, 2, 3].forEach((i) => {
      const at = 0.25 + (i - 1) * 0.5;
      tl.to(`.st-link-${i}`, { strokeDashoffset: 0, duration: 0.4 }, at)
        .to(`.st-old-${i}`, { opacity: 0.15, duration: 0.3 }, at + 0.25)
        .to(`.st-new-${i}`, { opacity: 1, scale: 1, duration: 0.3, ease: 'back.out(1.6)' }, at + 0.25);
    });
    return tl;
  },
};
```

**`scenes/StrategiesScene/useDiagram.ts`:**

```ts
import { useEffect, useRef, type RefObject } from 'react';
import gsap from 'gsap';
import { diagramBuilders } from './diagramTimelines';
import { sceneStore } from '../../animations/rig';

export function useDiagram(root: RefObject<HTMLElement>, id: keyof typeof diagramBuilders) {
  const tl = useRef<gsap.core.Timeline>();
  useEffect(() => {
    const ctx = gsap.context(() => { tl.current = diagramBuilders[id](gsap.timeline({ paused: true })); }, root);
    // al salir de la escena 05, todos los diagramas vuelven al inicio (aunque no haya pointerleave)
    const off = sceneStore.subscribe(() => { if (sceneStore.get().scene !== 4) tl.current?.pause(0); });
    return () => { off(); ctx.revert(); };
  }, [id, root]);
  return {
    enter: () => tl.current?.timeScale(1).play(),
    leave: () => tl.current?.timeScale(1.6).reverse(),
    toggle: () => tl.current?.restart(),
  };
}
```

**`scenes/StrategiesScene/strategies.css`:**

```css
.strat-layer { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; opacity: 0; visibility: hidden; }
.strat-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 2.6cqw; width: 88cqw; }
.strat-card {
  position: relative; padding: 2.4cqw; border-radius: 2cqw; outline: none; cursor: pointer;
  border: 1px solid rgba(255, 255, 255, 0.14); background: rgba(255, 255, 255, 0.045);
  backdrop-filter: blur(10px); color: #e8f6ff; opacity: 0; transform: translateY(24px);
}
.strat-card:hover, .strat-card:focus-visible { border-color: rgba(34, 230, 216, 0.6); }
.strat-card.is-reco { border-color: rgba(34, 230, 216, 0.75); box-shadow: 0 0 2.4cqw rgba(34, 230, 216, 0.25), 0 0 5cqw rgba(165, 107, 255, 0.18); }
.strat-n { font: 500 1.5cqw 'JetBrains Mono', monospace; color: #8aa4b8; }
.strat-card h3 { font: 600 2.2cqw/1.1 'JetBrains Mono', monospace; letter-spacing: 0.06em; margin: 0.6cqw 0 1.4cqw; }
.strat-card p { font: 400 1.5cqw/1.35 Inter, sans-serif; color: #9fb4c4; margin: 1.2cqw 0 0; }
.strat-badge { position: absolute; top: -1.1cqw; right: 2cqw; font: 600 1.2cqw 'JetBrains Mono', monospace; font-style: normal;
  padding: 0.4cqw 1cqw; border-radius: 99px; background: #22e6d8; color: #04121a; }

/* diagramas SVG */
.diag { width: 100%; height: auto; display: block; }
.diag * { transform-box: fill-box; transform-origin: center; }
.diag .old { fill: rgba(255, 255, 255, 0.06); stroke: rgba(255, 255, 255, 0.5); stroke-width: 1.5; }
.diag .new { fill: rgba(34, 230, 216, 0.15); stroke: #22e6d8; stroke-width: 1.5; }
.diag .arrow, .diag .st-link { fill: none; stroke: #a56bff; stroke-width: 2; stroke-linecap: round; stroke-dasharray: 1; stroke-dashoffset: 1; }
.diag .sync { stroke: #a56bff; stroke-width: 1.5; stroke-dasharray: 3 3; opacity: 0; }
.diag .dot { fill: #fff; }
.diag .facade { stroke: #22e6d8; stroke-width: 1.5; stroke-dasharray: 4 4; opacity: 0; }
.diag .bb-new, .diag [class*='st-new-'] { opacity: 0.25; transform: scale(0.8); }
```

**Criterio de aceptación de B1 (lo verificás vos):**
- El zoom entra al interior de la pantalla y la estética retro desaparece; las 3 tarjetas aparecen con stagger.
- Hover o foco anima el diagrama; al salir revierte. Click lo reinicia. STRANGLER FIG se ve resaltada con la etiqueta RECOMENDADA.
- Scroll hacia atrás: tarjetas ocultas, UI «NUEVO SISTEMA» de vuelta, diagramas en estado inicial.
- Texto nítido durante el zoom (si se ve borroso, hay un `will-change: transform`).

### B2 — Revisión final (vos)

Recorré las escenas 03 → 04 → 05 → 04 → 03 una vez y anotá **todo lo que veas mal en un solo mensaje** (captura + qué esperabas). Un solo prompt de corrección con la lista completa consume mucho menos que cinco prompts sueltos.

## 4. Orden de ejecución

1. Commit → **A1** (agente).
2. **A2** (vos, calibración) → commit.
3. Commit → **A3** (agente) → verificás Fase A.
4. Commit → **B1** (agente) → verificás Fase B.
5. **B2** (vos) → un solo prompt con todas las correcciones.
6. Después seguimos con la escena 06 (métricas).
