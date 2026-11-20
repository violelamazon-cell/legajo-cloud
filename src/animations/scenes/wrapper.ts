import { rig, applyRig } from '../rig';
import { fx } from '../../three/fx';
import { typeInto } from '../typeInto';
import type { SceneBuilder } from '../timeline';

const q = (s: string) => document.querySelector(s)!;

// Llama invalidate() y sincroniza rig/cámara en cada tick interpolado de scrub:0.6
const fxUpdate = applyRig;

export const buildWrapper: SceneBuilder = (tl) => {
  const t = tl.duration();

  // 1. La computadora completa se reduce proporcionalmente y la cámara vuelve al plano general
  tl.to(
    '#pc-scalable-frame',
    { scale: 0.56, duration: 0.9, ease: 'power2.inOut', onUpdate: fxUpdate },
    t
  );
  tl.to(
    rig,
    { s: 1, tx: 0, ty: 0, era: 0.3, duration: 0.9, ease: 'power2.inOut' },
    t
  );
  tl.to('.crt-layer--decision', { autoAlpha: 0, duration: 0.25 }, t + 0.5);

  // 2. La cápsula 3D desciende suavemente envolviendo a la computadora ya reducida
  tl.to(
    fx,
    { wrapOpacity: 1, duration: 0.35, onUpdate: fxUpdate },
    t + 0.85
  );
  tl.to(
    fx,
    { wrapY: 0, wrapRotY: 0, duration: 1.0, ease: 'power3.out', onUpdate: fxUpdate },
    t + 0.85
  );

  // 3. Se iluminan los bordes dicroicos y el resplandor de piso
  tl.to(
    fx,
    { wrapGlow: 1.0, duration: 0.15, ease: 'power2.out', onUpdate: fxUpdate },
    t + 1.80
  ); // destello al acoplar
  tl.to(
    fx,
    { wrapGlow: 0.35, duration: 0.4, onUpdate: fxUpdate },
    t + 1.95
  );
  tl.to('.wrapper-floor', { opacity: 1, duration: 0.5 }, t + 1.85);

  // 4. Aparecen las órbitas verdes delicadas rodeando la cápsula
  tl.to(
    fx,
    { ringsOpacity: 1, ringsScale: 1, duration: 0.6, ease: 'power2.out', onUpdate: fxUpdate },
    t + 1.90
  );
  tl.to(
    fx,
    { ringsT: 1, duration: 1.2, onUpdate: fxUpdate },
    t + 1.90
  );

  // 5. Aparece la etiqueta superior y el texto grande en el cristal CRT
  tl.to('.wrap-label', { autoAlpha: 1, duration: 0.25 }, t + 2.05);
  tl.to('.crt-layer--wrapper', { autoAlpha: 1, duration: 0.25 }, t + 2.15);
  typeInto(tl, q('.wr-title'), '// API WRAPPER v2.0', t + 2.15, 0.25);
  typeInto(tl, q('.wr-l1'), '> CORE: UNTOUCHED', t + 2.40, 0.25);
  typeInto(tl, q('.wr-l2'), '> INTERFACE: MODERNIZED', t + 2.65, 0.30);

  // Reposo de la Escena 03
  tl.addLabel('s2', t + 3.15);
};
