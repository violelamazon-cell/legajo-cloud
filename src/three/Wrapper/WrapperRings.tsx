import { useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
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

function Ring({ radius, tiltX, tiltZ, phase, scale, nodes = 5 }: { radius: number; tiltX: number; tiltZ: number; phase: number; scale: number; nodes?: number }) {
  const grp = useRef<Group>(null!);
  const pts = useRef<Points>(null!);
  const curve = useMemo(() => new CatmullRomCurve3(
    Array.from({ length: 96 }, (_, i) => { const a = (i / 96) * Math.PI * 2; return new Vector3(Math.cos(a) * radius, 0, Math.sin(a) * radius); }), true), [radius]);
  const core = useMemo(() => new TubeGeometry(curve, 240, 1.0 * scale, 6, true), [curve, scale]);
  const halo = useMemo(() => new TubeGeometry(curve, 240, 2.8 * scale, 6, true), [curve, scale]);
  const mCore = useMemo(() => ringMaterial(false, radius * 0.5), [radius]);
  const mHalo = useMemo(() => ringMaterial(true, radius * 0.5), [radius]);
  const nodePos = useMemo(() => new Float32Array(nodes * 3), [nodes]);

  useFrame(() => {
    if (!grp.current || !pts.current) return;
    grp.current.scale.setScalar(fx.ringsScale);
    mCore.uniforms.uOpacity.value = fx.ringsOpacity * 0.95;
    mHalo.uniforms.uOpacity.value = fx.ringsOpacity * 0.18;
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
        <pointsMaterial map={getGlowTexture()} size={14 * Math.max(scale, 0.75)} sizeAttenuation={false} transparent depthWrite={false}
          blending={AdditiveBlending} color='#7dffb8' />
      </points>
    </group>
  );
}

export function WrapperRings() {
  const { size } = useThree();
  const scale = useMemo(() => {
    const availW = size.width;
    const availH = Math.max(size.height - 56, 100);
    const s = Math.min(availW / 1536, availH / 1024);
    return s > 0 ? s : 1;
  }, [size.width, size.height]);

  const r1 = RING.r1 * scale;
  const r2 = RING.r2 * scale;
  const occW = PC_BOX.w * scale;
  const occH = PC_BOX.h * scale;

  return (
    <>
      {/* Oclusor: escribe profundidad sin pintar; tapa el tramo trasero de los anillos detrás de la PC */}
      <mesh renderOrder={0}>
        <planeGeometry args={[occW, occH]} />
        <meshBasicMaterial colorWrite={false} />
      </mesh>
      <Ring radius={r1} tiltX={RING.tiltX1} tiltZ={RING.tiltZ1} phase={RING.phase1} scale={scale} />
      <Ring radius={r2} tiltX={RING.tiltX2} tiltZ={RING.tiltZ2} phase={RING.phase2} scale={scale} />
    </>
  );
}
