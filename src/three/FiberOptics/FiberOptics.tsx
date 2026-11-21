import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import {
  AdditiveBlending,
  BufferAttribute,
  CatmullRomCurve3,
  Color,
  Group,
  Points,
  TubeGeometry,
  Vector3,
} from 'three';
import { fx } from '../fx';
import { WRAP, MAC_OFFSET_X, PLATE_WIDTH, PLATE_HEIGHT } from '../../config/calibration';
import { makeFiberMaterial } from './fiberShader';
import { getParticleTexture } from './particleTexture';

// ─────────────────────────────────────────────────────────────────────────────
// Coordenadas de los haces en espacio de píxeles de world (no escaladas).
// El grupo padre tiene scale(s) aplicado, así que estos valores son en plate-px.
//
// Origen: lado derecho de la cápsula, x ≈ +WRAP.w/2 = +420, y entre -120 y +80
// Destino: puerto USB-C izquierdo de la MacBook
//   - En plate-px del plate local de la MacBook: left=172, center=768,503.5
//   - En world-px sin scale: MAC_OFFSET_X/scale + (172 - PLATE_WIDTH/2)
//     → calculado dinámicamente en useMemo por variabilidad del scale
//
// Nota: las coordenadas X/Y de destino se inyectan como parámetro en buildStreams().
// ─────────────────────────────────────────────────────────────────────────────

interface StreamTemplate {
  // Puntos intermedios normalizados: x en [0,1] (0=origen cápsula, 1=destino mac),
  // y en px raw, z en px raw
  pMiddle: [number, number, number][];
  particleCount: number;
  tubeRadius: number;
  haloRadius: number;
}

// 4 trayectorias con forma S/arco orgánico
// Los puntos intermedios se definen en terms de lerp(originX, destX, t)
// y en offsets de Y/Z en plate-px
const STREAM_TEMPLATES: StreamTemplate[] = [
  {
    // Haz superior elegante con arco alto
    pMiddle: [
      [0.22,  60, 40],
      [0.45,  90, 55],
      [0.68,  20, 35],
      [0.85, -40, 20],
    ],
    particleCount: 120,
    tubeRadius: 2.2,
    haloRadius: 6.5,
  },
  {
    // Haz núcleo principal — línea casi directa, muy brillante
    pMiddle: [
      [0.20,  -5, 15],
      [0.42, -15, 20],
      [0.65, -50, 10],
      [0.84, -80, 18],
    ],
    particleCount: 120,
    tubeRadius: 2.8,
    haloRadius: 8.0,
  },
  {
    // Haz inferior — desciende hacia el teclado
    pMiddle: [
      [0.22, -80, -15],
      [0.44, -120, -25],
      [0.66, -140, -15],
      [0.84, -155, -5],
    ],
    particleCount: 100,
    tubeRadius: 1.8,
    haloRadius: 5.5,
  },
  {
    // Haz trenzado — curva S dramática en Z
    pMiddle: [
      [0.25,  10, 55],
      [0.46, -55, -20],
      [0.67,  25, 30],
      [0.86, -100, -8],
    ],
    particleCount: 100,
    tubeRadius: 1.5,
    haloRadius: 4.5,
  },
];

const TOTAL_PARTICLES = STREAM_TEMPLATES.reduce((a, s) => a + s.particleCount, 0);

function buildCurves(scale: number): CatmullRomCurve3[] {
  // Origen: lado derecho de la cápsula retro (en world-px)
  const capRightX = (WRAP.w / 2) * scale;   // ≈ 420 * scale
  const capCenterY = WRAP.centerY * scale;   // ≈ -10 * scale

  // Destino: puerto USB-C izquierdo de la MacBook (en world-px)
  // MAC_OFFSET_X está en world-px (el contenedor DOM tiene translateX(MAC_OFFSET_X))
  // El chassis izquierdo en world-px = MAC_OFFSET_X + (172 - PLATE_WIDTH/2) * scale
  const macLeftX = MAC_OFFSET_X + (172 - PLATE_WIDTH / 2) * scale;
  // Y: plate-center es 503.5; el puerto USB-C está aprox en y=620 (zona media del chassis)
  // Three.js Y va hacia arriba, DOM Y hacia abajo → invertimos
  const macPortY = -(620 - PLATE_HEIGHT / 2) * scale;  // ≈ -107 * scale

  return STREAM_TEMPLATES.map((tmpl, idx) => {
    // Distribución vertical de los 4 haces en el puerto de salida de la cápsula
    const originYOffsets = [70, 0, -90, 25];
    const originZOffsets = [30, 10, -20, 50];
    const destYOffsets   = [30, 0, -20, -15];
    const destZOffsets   = [10, 15, 5, 20];

    const originPt = new Vector3(
      capRightX,
      capCenterY + originYOffsets[idx] * scale,
      originZOffsets[idx] * scale,
    );
    const destPt = new Vector3(
      macLeftX,
      macPortY + destYOffsets[idx] * scale,
      destZOffsets[idx] * scale,
    );

    const pts: Vector3[] = [originPt];

    for (const [tx, dy, dz] of tmpl.pMiddle) {
      pts.push(new Vector3(
        capRightX + (macLeftX - capRightX) * tx,
        originPt.y + (destPt.y - originPt.y) * tx + dy * scale,
        originPt.z + (destPt.z - originPt.z) * tx + dz * scale,
      ));
    }

    pts.push(destPt);

    return new CatmullRomCurve3(pts, false, 'centripetal', 0.5);
  });
}

export function FiberOptics() {
  const group = useRef<Group>(null!);
  const pointsRef = useRef<Points>(null!);
  const { size } = useThree();

  const scale = useMemo(() => {
    const availW = size.width;
    const availH = Math.max(size.height - 56, 100);
    const s = Math.min(availW / PLATE_WIDTH, availH / PLATE_HEIGHT);
    return s > 0 ? s : 1;
  }, [size.width, size.height]);

  // Curvas calculadas en world-px (dependientes del scale)
  const curves = useMemo(() => buildCurves(scale), [scale]);

  // Geometrías de tubos (núcleo y halo) por haz
  const geometries = useMemo(() => {
    return STREAM_TEMPLATES.map((tmpl, i) => ({
      core: new TubeGeometry(curves[i], 180, tmpl.tubeRadius * scale, 8, false),
      halo: new TubeGeometry(curves[i], 180, tmpl.haloRadius * scale, 8, false),
    }));
  }, [curves, scale]);

  // Materiales por haz
  const materials = useMemo(() => {
    return STREAM_TEMPLATES.map(() => ({
      core: makeFiberMaterial(false),
      halo: makeFiberMaterial(true),
    }));
  }, []);

  // Dispose on unmount/recompute
  useEffect(() => {
    return () => {
      geometries.forEach((g) => { g.core.dispose(); g.halo.dispose(); });
      materials.forEach((m) => { m.core.dispose(); m.halo.dispose(); });
    };
  }, [geometries, materials]);

  // Buffers de partículas
  const { posArray, colArray, baseOffsets } = useMemo(() => {
    const pos = new Float32Array(TOTAL_PARTICLES * 3);
    const col = new Float32Array(TOTAL_PARTICLES * 3);
    const offsets: { curveIdx: number; u0: number }[] = [];

    let pIdx = 0;
    STREAM_TEMPLATES.forEach((s, curveIdx) => {
      for (let k = 0; k < s.particleCount; k++) {
        offsets.push({ curveIdx, u0: k / s.particleCount });
        pos[pIdx * 3 + 2] = -9999; // oculto por defecto
        col[pIdx * 3]     = 0.1;
        col[pIdx * 3 + 1] = 0.9;
        col[pIdx * 3 + 2] = 1.0;
        pIdx++;
      }
    });

    return { posArray: pos, colArray: col, baseOffsets: offsets };
  }, []);

  const cCyan   = useMemo(() => new Color('#22e6d8'), []);
  const cViolet = useMemo(() => new Color('#a56bff'), []);
  const tempCol = useMemo(() => new Color(), []);
  const tempPt  = useMemo(() => new Vector3(), []);

  useFrame(() => {
    const beamsProgress = fx.beamsT;
    const isVisible = beamsProgress > 0.001 && fx.beamsFade < 0.999;

    // Actualizar uniforms de haces
    for (const m of materials) {
      m.core.uniforms.uProgress.value     = beamsProgress;
      m.core.uniforms.uOpacity.value      = isVisible ? 1.0 : 0.0;
      m.core.uniforms.uFade.value         = fx.beamsFade;
      m.core.uniforms.uArrivalFlash.value = fx.arrivalFlash;
      m.halo.uniforms.uProgress.value     = beamsProgress;
      m.halo.uniforms.uOpacity.value      = isVisible ? 1.0 : 0.0;
      m.halo.uniforms.uFade.value         = fx.beamsFade;
      m.halo.uniforms.uArrivalFlash.value = fx.arrivalFlash;
    }

    if (!pointsRef.current) return;
    const posAttr = pointsRef.current.geometry.attributes.position as BufferAttribute;
    const colAttr = pointsRef.current.geometry.attributes.color as BufferAttribute;
    if (!posAttr || !colAttr) return;

    // Atenuar el material de partículas sincronizadamente con fx.beamsFade
    const pMat = pointsRef.current.material as any;
    if (pMat) {
      pMat.opacity = isVisible ? Math.max(0, (1.0 - fx.beamsFade * 0.9) * 0.85) : 0;
    }

    if (!isVisible) {
      for (let i = 0; i < TOTAL_PARTICLES; i++) posAttr.setZ(i, -9999);
      posAttr.needsUpdate = true;
      return;
    }

    for (let i = 0; i < TOTAL_PARTICLES; i++) {
      const { curveIdx, u0 } = baseOffsets[i];
      // Las partículas avanzan continuamente durante el recorrido
      const u = (u0 + fx.particlesT * 1.4) % 1.0;

      // La partícula existe solo si el haz ya llegó hasta ese tramo
      if (u <= beamsProgress) {
        curves[curveIdx].getPointAt(u, tempPt);
        posAttr.setXYZ(i, tempPt.x, tempPt.y, tempPt.z);

        // Color: cian en origen, violeta en destino
        tempCol.copy(cCyan).lerp(cViolet, u);
        colAttr.setXYZ(i, tempCol.r, tempCol.g, tempCol.b);
      } else {
        posAttr.setZ(i, -9999);
      }
    }

    posAttr.needsUpdate = true;
    colAttr.needsUpdate = true;
  });

  return (
    <group ref={group} renderOrder={4}>
      {geometries.map((geom, idx) => (
        <group key={`fiber-${idx}`}>
          <mesh geometry={geom.halo} material={materials[idx].halo} />
          <mesh geometry={geom.core} material={materials[idx].core} />
        </group>
      ))}

      {/* Sistema de partículas */}
      <points ref={pointsRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[posArray, 3]} />
          <bufferAttribute attach="attributes-color"    args={[colArray, 3]} />
        </bufferGeometry>
        <pointsMaterial
          map={getParticleTexture()}
          size={12 * Math.max(scale, 0.75)}
          sizeAttenuation={false}
          vertexColors
          transparent
          depthWrite={false}
          blending={AdditiveBlending}
          opacity={0.85}
        />
      </points>
    </group>
  );
}
