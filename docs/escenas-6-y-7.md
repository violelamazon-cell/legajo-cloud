# Escenas 06 (métricas) y 07 (cierre y apagado)

Guardar como `docs/escenas-6-y-7.md`. El código está listo: el agente lo pega y lo conecta.

Principios (iguales a las escenas anteriores):
- Todo vive **dentro de `<MacScreen>`**, como hermano de `<StrategiesLayer />`, así comparte el zoom local `.mac-zoom`.
- Todo es **scrub** dentro del timeline maestro (reversible). Cada builder cierra con `endScene(tl, 'sN', tiempo)`.
- Estados iniciales por CSS (`opacity: 0; visibility: hidden`), nunca por estado de React.
- Valores solo en `config/metrics.data.ts`. Aviso visible: «Datos ilustrativos de ejemplo académico».

---

## A. Escena 06: métricas (bento de 5 módulos)

### A1. `config/metrics.data.ts`

```ts
export const METRICS = {
  integridad: { pct: 100, label: 'verificado' },
  paridad: { pct: 0.8, checks: ['Reglas de negocio', 'Flujos críticos', 'Reportes'] },
  desviacion: { cronograma: { label: '±0%', fill: 0.88 }, presupuesto: { label: '+2%', fill: 0.7 } },
  adopcion: { antes: { min: 24, fill: 0.88 }, despues: { min: 8, fill: 0.33 } },
  nota: 'Datos ilustrativos de ejemplo académico',
} as const;
```

### A2. `scenes/MetricsScene/MetricsLayer.tsx` (archivo nuevo)

```tsx
import { CheckCircle2, SquareCheck, CalendarDays, Database, Timer } from 'lucide-react';
import { METRICS as M } from '../../config/metrics.data';

export function MetricsLayer() {
  return (
    <div className='met-layer'>
      <div className='met-grid'>
        <section className='met-card met-1'><div className='met-body'>
          <span className='met-n'>[01]</span>
          <h4>INTEGRIDAD<br />DE DATOS</h4>
          <div className='met-big'><b className='met-int-pct'>0%</b><CheckCircle2 className='met-ico' /></div>
          <div className='met-track'><i className='met-fill met-fill-int' /></div>
          <span className='met-cap'>{M.integridad.label}</span>
        </div></section>

        <section className='met-card met-2'><div className='met-body'>
          <span className='met-n'>[02]</span>
          <h4>PARIDAD<br />FUNCIONAL</h4>
          {M.paridad.checks.map((c) => (
            <div className='met-row' key={c}><SquareCheck /><span>{c}</span></div>
          ))}
          <div className='met-track'><i className='met-fill met-fill-par' /></div>
        </div></section>

        <section className='met-card met-3'><div className='met-body'>
          <span className='met-n'>[03]</span>
          <h4>RENDIMIENTO</h4>
          <svg className='met-chart' viewBox='0 0 160 60'>
            <path className='met-curve met-curve-old' d='M0 46 C 25 36, 50 44, 80 38 S 130 30, 160 28' pathLength={1} />
            <path className='met-curve met-curve-new' d='M0 50 C 25 22, 50 52, 80 26 S 130 8, 160 6' pathLength={1} />
          </svg>
          <span className='met-cap'>Latencia y throughput · nuevo vs legado</span>
        </div></section>

        <section className='met-card met-4'><div className='met-body'>
          <span className='met-n'>[04]</span>
          <h4>DESVIACIÓN CRONOGRAMA<br />Y PRESUPUESTO</h4>
          <div className='met-row'><CalendarDays /><div className='met-track'><i className='met-fill met-fill-sched' /></div><em>{M.desviacion.cronograma.label}</em></div>
          <div className='met-row'><Database /><div className='met-track'><i className='met-fill met-fill-budget' /></div><em>{M.desviacion.presupuesto.label}</em></div>
        </div></section>

        <section className='met-card met-5'><div className='met-body'>
          <span className='met-n'>[05]</span>
          <h4>ADOPCIÓN Y PRODUCTIVIDAD</h4>
          <div className='met-row'><Timer /><div className='met-track'><i className='met-fill met-fill-before' /></div><em>{M.adopcion.antes.min} min</em></div>
          <div className='met-row'><span style={{ width: '1.6cqw' }} /><div className='met-track'><i className='met-fill met-fill-after' /></div><em>{M.adopcion.despues.min} min</em></div>
        </div></section>
      </div>
      <p className='met-note'>{M.nota}</p>
    </div>
  );
}
```

### A3. `styles/metrics.css` (archivo nuevo, importarlo en `MetricsLayer.tsx`)

```css
.met-layer { position: absolute; inset: 0; opacity: 0; visibility: hidden; }
.met-grid { position: absolute; inset: 7cqw 4cqw 6.5cqw; display: grid; grid-template-columns: repeat(6, 1fr); grid-template-rows: 1fr 1fr; gap: 1.6cqw; }
.met-card { position: relative; overflow: hidden; transform-origin: 0 0; border-radius: 1.6cqw; color: #e8f6ff;
  border: 1px solid rgba(255, 255, 255, 0.14); background: rgba(255, 255, 255, 0.045); backdrop-filter: blur(10px); }
.met-1, .met-2, .met-3 { grid-column: span 2; }
.met-4, .met-5 { grid-column: span 3; }
.met-5 { border-color: rgba(34, 230, 216, 0.7); box-shadow: 0 0 2.4cqw rgba(34, 230, 216, 0.2); }
.met-body { position: absolute; inset: 0; padding: 1.6cqw 1.8cqw; display: flex; flex-direction: column; gap: 0.8cqw; opacity: 0; }
.met-n { font: 500 1.1cqw 'JetBrains Mono', monospace; color: #8aa4b8; }
.met-card h4 { margin: 0; font: 600 1.45cqw/1.15 'JetBrains Mono', monospace; letter-spacing: 0.04em; }
.met-cap { font: 400 1.1cqw 'JetBrains Mono', monospace; color: #9fb4c4; }
.met-big { display: flex; align-items: center; justify-content: space-between; }
.met-big b { font: 700 3.4cqw/1 Inter, sans-serif; }
.met-ico { width: 2.6cqw; height: 2.6cqw; color: #22e6d8; }
.met-track { height: 0.9cqw; flex: 1; overflow: hidden; border-radius: 99px; background: rgba(255, 255, 255, 0.12); }
.met-fill { display: block; height: 100%; border-radius: inherit; transform-origin: left center; transform: scaleX(0);
  background: linear-gradient(90deg, #22e6d8, #a56bff); }
.met-fill-before { background: #8aa4b8; }
.met-row { display: flex; align-items: center; gap: 1cqw; font: 500 1.15cqw 'JetBrains Mono', monospace; color: #9fb4c4; }
.met-row svg { width: 1.6cqw; height: 1.6cqw; flex: none; color: #22e6d8; }
.met-row em { min-width: 4.5cqw; text-align: right; font-style: normal; color: #e8f6ff; }
.met-chart { width: 100%; flex: 1; min-height: 0; }
.met-curve { fill: none; stroke-width: 2; stroke-linecap: round; stroke-dasharray: 1; stroke-dashoffset: 1; }
.met-curve-new { stroke: #22e6d8; }
.met-curve-old { stroke: #8aa4b8; }
.met-note { position: absolute; left: 4cqw; bottom: 2.2cqw; margin: 0; font: 400 1cqw 'JetBrains Mono', monospace; letter-spacing: 0.08em; color: #6f879a; }
```

### A4. `animations/scenes/metrics.ts` (reemplazar el contenido)

```ts
import { endScene, type SceneBuilder } from '../timeline';
import { METRICS as M } from '../../config/metrics.data';

const q = (s: string) => document.querySelector(s) as HTMLElement;
const setText = (sel: string, v: string) => { const e = document.querySelector(sel); if (e) e.textContent = v; };

// posición y tamaño en el layout de .mac-screen, SIN depender de transforms (robusto con zoom y resize)
function layoutBox(el: HTMLElement, root: HTMLElement) {
  let x = 0, y = 0, n: HTMLElement | null = el;
  while (n && n !== root) { x += n.offsetLeft; y += n.offsetTop; n = n.offsetParent as HTMLElement | null; }
  return { x, y, w: el.offsetWidth, h: el.offsetHeight };
}

export const buildMetrics: SceneBuilder = (tl) => {
  const t = tl.duration();
  const screen = q('.mac-screen');

  tl.to('.met-layer', { autoAlpha: 1, duration: 0.01 }, t);

  // 1. las 3 tarjetas de estrategias se transforman en los módulos 01, 02 y 03
  [1, 2, 3].forEach((n, i) => {
    const card = () => layoutBox(document.querySelectorAll('.strat-card')[i] as HTMLElement, screen);
    const mod = () => layoutBox(q(`.met-${n}`), screen);
    tl.fromTo(`.met-${n}`,
      { x: () => card().x - mod().x, y: () => card().y - mod().y, scaleX: () => card().w / mod().w, scaleY: () => card().h / mod().h },
      { x: 0, y: 0, scaleX: 1, scaleY: 1, duration: 1.2, ease: 'power3.inOut' }, t);
  });
  tl.to('.strat-card', { autoAlpha: 0, duration: 0.2 }, t);

  // 2. aparece el contenido y los módulos 04 y 05
  tl.fromTo('.met-4, .met-5', { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, stagger: 0.18, duration: 0.5 }, t + 0.9);
  tl.fromTo('.met-body', { autoAlpha: 0 }, { autoAlpha: 1, stagger: 0.12, duration: 0.4 }, t + 1.0);

  // 3. indicadores
  const at = t + 1.5;
  const c = { v: 0 };
  tl.fromTo(c, { v: 0 }, { v: M.integridad.pct, duration: 1, ease: 'none',
    onUpdate: () => setText('.met-int-pct', Math.round(c.v) + '%'),
    onReverseComplete: () => setText('.met-int-pct', '0%') }, at);
  tl.fromTo('.met-fill-int', { scaleX: 0 }, { scaleX: 1, duration: 1, ease: 'none' }, at);
  tl.fromTo('.met-fill-par', { scaleX: 0 }, { scaleX: M.paridad.pct, duration: 1, ease: 'power1.out' }, at);
  tl.fromTo('.met-curve', { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 1.4, stagger: 0.3, ease: 'power1.inOut' }, at);
  tl.fromTo('.met-fill-sched', { scaleX: 0 }, { scaleX: M.desviacion.cronograma.fill, duration: 1, ease: 'power2.out' }, at);
  tl.fromTo('.met-fill-budget', { scaleX: 0 }, { scaleX: M.desviacion.presupuesto.fill, duration: 1, ease: 'power2.out' }, at + 0.15);
  tl.fromTo('.met-fill-before', { scaleX: 0 }, { scaleX: M.adopcion.antes.fill, duration: 1, ease: 'power2.out' }, at);
  tl.fromTo('.met-fill-after', { scaleX: 0 }, { scaleX: M.adopcion.despues.fill, duration: 1, ease: 'power2.out' }, at + 0.5);

  endScene(tl, 's5', t + 3.4);
};
```

### A5. Conexión
- `MigrationScene.tsx`: dentro de `<MacScreen>`, después de `<StrategiesLayer />`, agregar `<MetricsLayer />`. Nada más en ese archivo.
- `App.tsx`: dejar de renderizar `<MetricsScene />` (el placeholder `#scene-6`). No borrar el archivo.
- En `App.tsx`, si no existe: `document.fonts.ready.then(() => ScrollTrigger.refresh())` después de crear el master (las medidas del morph dependen de la tipografía).
- Si los haces de fibra de Three siguen visibles en esta escena, ocultarlos con el mismo mecanismo que usa la escena 05.

---

## B. Escena 07: cierre y apagado OLED

### B1. `scenes/ClosingScene/ClosingLayer.tsx` (archivo nuevo)

```tsx
export function ClosingLayer() {
  return (
    <div className='close-layer'>
      <h2 className='close-title'>GRACIAS.</h2>
      <p className='close-sub'>MIGRACIÓN COMPLETADA CON ÉXITO</p>
    </div>
  );
}
```

```css
/* styles/closing.css (importarlo en ClosingLayer.tsx) */
.close-layer { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 1.8cqw; opacity: 0; visibility: hidden; }
.close-title { margin: 0; font: 500 9cqw/1 Inter, sans-serif; letter-spacing: 0.02em; color: #e9eef2; }
.close-sub { margin: 0; font: 400 2cqw 'JetBrains Mono', monospace; letter-spacing: 0.28em; color: #8aa4b8; }
```

### B2. `animations/scenes/closing.ts` (reemplazar el contenido)

```ts
import { endScene, type SceneBuilder } from '../timeline';

export const buildClosing: SceneBuilder = (tl) => {
  const t = tl.duration();

  // 1. la cámara retrocede: de la pantalla al plano completo de la MacBook, centrada y de frente
  tl.to('.mac-zoom', { scale: 1, x: 0, y: 0, duration: 1.6, ease: 'power2.inOut' }, t);
  // 2. los módulos de métricas desaparecen
  tl.to('.met-layer', { autoAlpha: 0, duration: 0.5 }, t + 0.1);
  // 3. mensaje final
  tl.to('.close-layer', { autoAlpha: 1, duration: 0.01 }, t + 1.0);
  tl.fromTo('.close-title', { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: 0.6 }, t + 1.0);
  tl.fromTo('.close-sub', { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.6 }, t + 1.3);
  // 4. pausa: tramo muerto de scroll entre t + 1.9 y t + 3.0
  // 5. apagado OLED
  tl.to('.close-layer', { autoAlpha: 0, duration: 0.7, ease: 'power1.in' }, t + 3.0);          // texto
  tl.to('.mac-screen', { autoAlpha: 0, duration: 0.9, ease: 'power1.in' }, t + 3.2);          // pantalla y ondas iridiscentes
  tl.fromTo('.mac-zoom', { filter: 'brightness(1) saturate(1)' }, { filter: 'brightness(0.3) saturate(0.4)', duration: 0.9, ease: 'power1.inOut' }, t + 3.8); // retroiluminación y luces del borde
  tl.to('.mac-zoom', { autoAlpha: 0, duration: 0.8, ease: 'power1.in' }, t + 4.6);            // todo a #050505

  endScene(tl, 's6', t + 5.5);
};
```

### B3. Conexión
- `MigrationScene.tsx`: dentro de `<MacScreen>`, después de `<MetricsLayer />`, agregar `<ClosingLayer />`.
- `App.tsx`: dejar de renderizar `<ClosingScene />` (placeholder `#scene-7`) y quitar el `tl.set('#scene-7', …)` viejo si queda alguno.
- Verificar que el fondo final sea exactamente `#050505` (body, `#world` y cualquier sección sin fondos más claros) y que los haces de Three y el resplandor del piso no queden visibles en este estado.

---

## C. Revisión manual (vos, 2 minutos)

1. Escena 05 → 06: las 3 tarjetas se transforman en los módulos 01 a 03 y aparecen el 04 y el 05. Los indicadores avanzan solos.
2. Volver atrás a la 05: las tarjetas vuelven, sin módulos duplicados.
3. Escena 06 → 07: la cámara retrocede a la MacBook completa y aparece «GRACIAS.». Después de la pausa se apaga y queda negro puro.
4. Volver atrás desde el negro: todo se restaura sin saltos.
5. Flechas, Home y End funcionan en las 7 escenas.
