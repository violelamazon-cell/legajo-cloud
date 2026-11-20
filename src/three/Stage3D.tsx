import React, { useMemo, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { CameraSync } from './CameraSync';
import { WrapperCube, WrapperRings } from './Wrapper';
import { getQualityTier } from './quality';

export function Stage3D(): React.ReactElement | null {
  const quality = useMemo(() => getQualityTier(), []);

  if (!quality.webgl) return null;

  return (
    <div className="absolute inset-0 w-full h-full pointer-events-none z-10 overflow-hidden">
      <Canvas
        frameloop="demand"
        dpr={[1, quality.maxDpr]}
        camera={{ fov: 35, near: 1, far: 8000 }}
        gl={{
          antialias: quality.antialias,
          alpha: true,
          powerPreference: 'high-performance',
        }}
      >
        <ambientLight color="#0c1626" intensity={1.6} />

        {/* Sincronización pixel-perfect con el rig de cámara */}
        <CameraSync />

        {/* Cubo dicroico transparente con aristas iridiscentes y anillos esmeralda */}
        <Suspense fallback={null}>
          <WrapperCube />
          <WrapperRings />
        </Suspense>
      </Canvas>
    </div>
  );
}
