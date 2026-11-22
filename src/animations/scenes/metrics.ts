import { endScene, type SceneBuilder } from '../timeline';
import { rig } from '../rig';

export const buildMetrics: SceneBuilder = (tl) => {
  tl.set('#scene-6', { autoAlpha: 0 }, 0);
  const t = tl.duration();
  // 1. Ocultar suavemente las tarjetas de estrategias
  tl.to('.strat-card', { autoAlpha: 0, duration: 0.35, ease: 'power1.in' }, t);
  // 2. Ocultar la MacBook y la capa de estrategias mientras la cámara se aleja
  tl.to(['#scene-4', '.strat-layer'], { autoAlpha: 0, duration: 0.45, ease: 'power1.in' }, t + 0.1);
  // 3. Regresar el rig al encuadre central en plano general (s: 1, tx: 0, ty: 0)
  tl.to(rig, { s: 1, tx: 0, ty: 0, era: 0.95, duration: 0.9, ease: 'power2.inOut' }, t + 0.1);
  // 4. Revelar la escena de métricas
  tl.to('#scene-6', { autoAlpha: 1, duration: 0.5, ease: 'power1.out' }, t + 0.45);
  endScene(tl, 's5', t + 1.4);
};
