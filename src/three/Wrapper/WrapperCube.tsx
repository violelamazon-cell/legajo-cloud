import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { RoundedBox } from '@react-three/drei';
import type { Group } from 'three';
import { fx } from '../fx';
import { WRAP } from '../../config/calibration';
import { makeGlassMaterial } from './glassShader';

export function WrapperCube() {
  const group = useRef<Group>(null!);
  const { size } = useThree();

  // Escala adaptativa para que las dimensiones coincidan con el plate en cualquier resolución
  const scale = useMemo(() => {
    const availW = size.width;
    const availH = Math.max(size.height - 56, 100);
    const s = Math.min(availW / 1536, availH / 1024);
    return s > 0 ? s : 1;
  }, [size.width, size.height]);

  const w = WRAP.w * scale;
  const h = WRAP.h * scale;
  const d = WRAP.d * scale;
  const radius = WRAP.radius * scale;

  const back = useMemo(() => makeGlassMaterial(true), []);
  const front = useMemo(() => makeGlassMaterial(false), []);
  useEffect(() => () => { back.dispose(); front.dispose(); }, [back, front]);

  useFrame(() => {
    const g = group.current;
    if (!g) return;
    g.position.set(0, (WRAP.centerY + fx.wrapY) * scale, 0);
    g.rotation.set(WRAP.rotX, WRAP.rotY + fx.wrapRotY, 0);
    for (const m of [back, front]) {
      m.uniforms.uOpacity.value = fx.wrapOpacity;
      m.uniforms.uGlow.value = fx.wrapGlow;
      m.uniforms.uDim.value.set(w, h, d);
    }
  });

  // Dos pasadas: caras traseras (renderOrder 1) y delanteras (2) => se ve el interior del vidrio
  return (
    <group ref={group}>
      <RoundedBox args={[w, h, d]} radius={radius} smoothness={12} renderOrder={1} material={back} />
      <RoundedBox args={[w, h, d]} radius={radius} smoothness={12} renderOrder={2} material={front} />
    </group>
  );
}
