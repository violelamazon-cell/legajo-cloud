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
