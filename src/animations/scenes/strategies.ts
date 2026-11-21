import { rig } from '../rig';
import { fx } from '../../three/fx';
import { macScreenZoom } from '../../config/calibration';
import type { SceneBuilder } from '../timeline';

// Factor de recorte: 1.0 = pantalla llena el viewport, 0.78 = el marco todavía es visible
const CROP = 0.78;

export const buildStrategies: SceneBuilder = (tl) => {
  const t = tl.duration();

  // Zoom central uniforme hacia el centro geométrico de la pantalla de la MacBook.
  // Calculamos la compensación exacta de tx y ty para mantener el centro de la pantalla
  // fijo en el centro del viewport durante todo el zoom sin paneo lateral ni vertical.
  const { s: sMax, cx = 1920, cy = 0 } = macScreenZoom();
  const s = 1 + (sMax - 1) * CROP;
  const tx = -cx * s;
  const ty = -cy * s;

  // ── Zoom central: escala y traslación compensada en un único tween ─────────
  tl.to(
    rig,
    {
      s,
      tx,
      ty,
      era: 1,
      duration: 1.4,
      ease: 'power3.inOut',
    },
    t
  );
  // Garantizar extinción total de haces de fibra al entrar en estrategias
  tl.to(fx, { beamsFade: 1.0, duration: 0.2 }, t);
  tl.to('.retro-layer',          { autoAlpha: 0, duration: 0.4 }, t + 0.3);
  // Cross-fade suave entre la pantalla Cloud y las 3 tarjetas de Estrategias
  tl.to('#cloud-screen-wrapper', { autoAlpha: 0, duration: 0.5, ease: 'power1.inOut' }, t + 0.4);
  tl.to('.strat-layer',          { autoAlpha: 1, duration: 0.5, ease: 'power1.inOut' }, t + 0.4);
  tl.to('.strat-card',           { autoAlpha: 1, y: 0, duration: 0.5, ease: 'power2.out' }, t + 0.8);
  tl.addLabel('s4', t + 2.0);
};
