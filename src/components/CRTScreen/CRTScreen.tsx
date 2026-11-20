import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import gsap from 'gsap';
import {
  CRT_SCREEN_CORNERS,
  PLATE_WIDTH,
  PLATE_HEIGHT,
  SCREEN_ZOOM,
  SCREEN_TX,
  SCREEN_TY,
  WRAP,
  type ScreenCorners,
} from '../../config/calibration';
import { quadToMatrix3d } from './quadToMatrix3d';
import { rig, applyRig } from '../../animations/rig';
import { WrapperLabel } from '../Wrapper/WrapperLabel';

/** Altura reservada para la barra de navegación superior (px) */
const NAV_HEIGHT = 56;

interface CRTScreenProps {
  children?: React.ReactNode;
  contentWidth?: number;
  contentHeight?: number;
  className?: string;
}

type CornerKey = keyof ScreenCorners;

export const CRTScreen: React.FC<CRTScreenProps> = ({
  children,
  contentWidth = 640,
  contentHeight = 480,
  className = '',
}) => {
  const [corners, setCorners] = useState<ScreenCorners>(CRT_SCREEN_CORNERS);
  const [isDebugScreen, setIsDebugScreen] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);
  const [copied, setCopied] = useState(false);
  const [plateScale, setPlateScale] = useState(1);
  const wrapperRef = useRef<HTMLDivElement>(null);  // div externo que ocupa toda el área disponible
  const containerRef = useRef<HTMLDivElement>(null); // div interno a 1536×1024 px
  const activeDragRef = useRef<{ corner: CornerKey; startX: number; startY: number } | null>(null);

  // ResizeObserver: escala el plate para que quepa en el espacio disponible
  const updateScale = useCallback(() => {
    if (!wrapperRef.current) return;
    const rect = wrapperRef.current.getBoundingClientRect();
    // Restar NAV_HEIGHT del alto disponible para evitar que el plate quede oculto bajo la barra
    const availW = rect.width;
    const availH = Math.max(rect.height - NAV_HEIGHT, 100);
    const scale = Math.min(availW / PLATE_WIDTH, availH / PLATE_HEIGHT);
    setPlateScale(scale > 0 ? scale : 1);
  }, []);

  useEffect(() => {
    updateScale();
    const ro = new ResizeObserver(updateScale);
    if (wrapperRef.current) ro.observe(wrapperRef.current);
    return () => ro.disconnect();
  }, [updateScale]);

  // Detectar flag ?debug=screen en la URL
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const debugVal = params.get('debug');
      if (debugVal === 'screen') {
        setIsDebugScreen(true);
      }
    }
  }, []);

  // Calcular la homografía CSS matrix3d en tiempo real
  const matrix3d = useMemo(() => {
    return quadToMatrix3d(corners, contentWidth, contentHeight);
  }, [corners, contentWidth, contentHeight]);

  // Manejador de arrastre de esquinas en espacio de píxeles del plate (1536x1024)
  // Las coordenadas del cliente deben convertirse al espacio del plate teniendo en cuenta plateScale
  const handlePointerDown = (corner: CornerKey, e: React.PointerEvent) => {
    e.stopPropagation();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    activeDragRef.current = { corner, startX: e.clientX, startY: e.clientY };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!activeDragRef.current || !containerRef.current) return;
    // containerRef es el div interno 1536×1024 escalado por CSS; getBoundingClientRect()
    // ya devuelve las dimensiones visuales reales (plateScale aplicado).
    const rect = containerRef.current.getBoundingClientRect();
    const scaleX = PLATE_WIDTH / rect.width;
    const scaleY = PLATE_HEIGHT / rect.height;

    const currentX = Math.round((e.clientX - rect.left) * scaleX);
    const currentY = Math.round((e.clientY - rect.top) * scaleY);

    const corner = activeDragRef.current.corner;
    setCorners((prev) => ({
      ...prev,
      [corner]: [
        Math.max(0, Math.min(PLATE_WIDTH, currentX)),
        Math.max(0, Math.min(PLATE_HEIGHT, currentY)),
      ],
    }));
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (activeDragRef.current) {
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {}
      activeDragRef.current = null;
    }
  };

  // Cálculos derivados en tiempo real para zoom centrado
  const derivedStats = useMemo(() => {
    const minX = Math.min(corners.topLeft[0], corners.bottomLeft[0]);
    const maxX = Math.max(corners.topRight[0], corners.bottomRight[0]);
    const minY = Math.min(corners.topLeft[1], corners.topRight[1]);
    const maxY = Math.max(corners.bottomLeft[1], corners.bottomRight[1]);

    const crtWidth = maxX - minX;
    const crtHeight = maxY - minY;
    const centerX = Math.round((minX + maxX) / 2);
    const centerY = Math.round((minY + maxY) / 2);

    const deltaX = centerX - PLATE_WIDTH / 2;
    const deltaY = centerY - PLATE_HEIGHT / 2;

    const zoom = Number((1080 / crtHeight * 0.95).toFixed(2));
    const tx = Math.round(-deltaX * zoom);
    const ty = Math.round(-deltaY * zoom);

    return { crtWidth, crtHeight, centerX, centerY, deltaX, deltaY, zoom, tx, ty };
  }, [corners]);

  // Alternar vista entre Reposo (1x) y Zoom (~3.6x)
  const toggleZoom = () => {
    const nextZoom = !isZoomed;
    setIsZoomed(nextZoom);
    if (nextZoom) {
      gsap.to(rig, {
        s: SCREEN_ZOOM,
        tx: SCREEN_TX,
        ty: SCREEN_TY,
        duration: 0.9,
        ease: 'power2.inOut',
        onUpdate: applyRig,
      });
    } else {
      gsap.to(rig, {
        s: 1,
        tx: 0,
        ty: 0,
        duration: 0.9,
        ease: 'power2.inOut',
        onUpdate: applyRig,
      });
    }
  };

  const copyConfig = () => {
    const code = `export const CRT_SCREEN_CORNERS: ScreenCorners = {
  topLeft: [${corners.topLeft[0]}, ${corners.topLeft[1]}],
  topRight: [${corners.topRight[0]}, ${corners.topRight[1]}],
  bottomRight: [${corners.bottomRight[0]}, ${corners.bottomRight[1]}],
  bottomLeft: [${corners.bottomLeft[0]}, ${corners.bottomLeft[1]}],
};

export const SCREEN_ZOOM = ${derivedStats.zoom};
export const SCREEN_TX = ${derivedStats.tx};
export const SCREEN_TY = ${derivedStats.ty};`;

    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(code);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div
      ref={wrapperRef}
      className={`relative flex items-center justify-center w-full h-full overflow-hidden ${className}`}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      {/* Contenedor del plate a resolución nativa, escalado con CSS para encajar */}
      <div
        ref={containerRef}
        style={{
          width: `${PLATE_WIDTH}px`,
          height: `${PLATE_HEIGHT}px`,
          transform: `scale(${plateScale})`,
          transformOrigin: 'center center',
          flexShrink: 0,
          // @ts-ignore
          '--wrap-w': `${WRAP.w}px`,
          '--wrap-h': `${WRAP.h}px`,
        } as React.CSSProperties}
        className="relative select-none"
      >
        {/* Resplandor y reflejo difuso de piso (Escena 03) */}
        <div className="wrapper-floor" />
        <img
          src="/plates/pc-off.png"
          alt=""
          aria-hidden="true"
          className="plate--reflection"
        />

        {/* Etiqueta superior quebrada de la cápsula */}
        <WrapperLabel />

        {/* Contenedor con escala independiente para la computadora completa */}
        <div
          id="pc-scalable-frame"
          className="absolute inset-0 w-full h-full will-change-transform"
          style={{ transformOrigin: 'center center' }}
        >
          {/* Imagen plate de la computadora retro apagada */}
          <img
            src="/plates/pc-off.png"
            alt="Computadora retro"
            className="absolute inset-0 w-full h-full object-contain pointer-events-none select-none z-0"
          />

          {/* Overlay HTML transformado mediante homografía quadToMatrix3d */}
          <div
            id="crt-overlay-container"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: `${contentWidth}px`,
              height: `${contentHeight}px`,
              transform: matrix3d,
              transformOrigin: '0 0',
              overflow: 'hidden',
              borderRadius: '18px',
              backgroundColor: '#030504',
            }}
            className="z-10 shadow-inner crt"
          >
            {children}

            {/* Sutil brillo y viñeta curva del cristal CRT */}
            <div
              className="absolute inset-0 pointer-events-none z-20"
              style={{
                background:
                  'radial-gradient(ellipse at 50% 50%, rgba(61,255,138,0.06) 0%, rgba(0,0,0,0.45) 85%, rgba(0,0,0,0.85) 100%)',
                boxShadow: 'inset 0 0 24px rgba(0,0,0,0.95)',
              }}
            />
          </div>

          {/* 4 Puntos de arrastre del panel de calibración (?debug=screen) */}
          {isDebugScreen && (
            <div className="absolute inset-0 pointer-events-none z-30">
              {/* Líneas guía conectando las esquinas */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none">
                <polygon
                  points={`${corners.topLeft[0]},${corners.topLeft[1]} ${corners.topRight[0]},${corners.topRight[1]} ${corners.bottomRight[0]},${corners.bottomRight[1]} ${corners.bottomLeft[0]},${corners.bottomLeft[1]}`}
                  fill="rgba(34,230,216,0.12)"
                  stroke="#22e6d8"
                  strokeWidth="1.5"
                  strokeDasharray="4 4"
                />
              </svg>

              {(Object.keys(corners) as CornerKey[]).map((key) => {
                const [x, y] = corners[key];
                return (
                  <div
                    key={key}
                    onPointerDown={(e) => handlePointerDown(key, e)}
                    style={{
                      left: `${x}px`,
                      top: `${y}px`,
                      transform: 'translate(-50%, -50%)',
                    }}
                    className="absolute w-7 h-7 rounded-full bg-[#22e6d8] border-2 border-white cursor-grab active:cursor-grabbing pointer-events-auto shadow-[0_0_12px_#22e6d8] flex items-center justify-center transition-transform hover:scale-125"
                    title={`${key}: [${x}, ${y}]`}
                  >
                    <span className="w-1.5 h-1.5 bg-black rounded-full" />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Panel flotante de calibración */}
      {isDebugScreen && (
        <aside
          aria-label="Panel de Calibración de Pantalla"
          className="fixed top-20 right-6 z-50 p-4 rounded-xl bg-black/92 border border-[#22e6d8]/60 font-mono text-xs text-zinc-300 shadow-2xl backdrop-blur-md max-w-sm select-none"
        >
          <div className="flex items-center justify-between pb-2 mb-3 border-b border-zinc-800">
            <span className="font-bold text-[#22e6d8] flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#22e6d8] animate-pulse" />
              CALIBRACIÓN CRT
            </span>
            <button
              type="button"
              onClick={() => setIsDebugScreen(false)}
              className="text-zinc-500 hover:text-white px-1.5 py-0.5 rounded hover:bg-zinc-800"
              title="Cerrar panel de calibración"
            >
              ✕
            </button>
          </div>

          <div className="space-y-1.5 text-[11px] mb-3">
            <div className="text-zinc-400 font-bold mb-1">Esquinas medidas [X, Y]:</div>
            <div className="grid grid-cols-2 gap-1.5">
              <div className="p-1.5 rounded bg-zinc-900 border border-zinc-800">
                <span className="text-zinc-500">TL:</span> [{corners.topLeft[0]}, {corners.topLeft[1]}]
              </div>
              <div className="p-1.5 rounded bg-zinc-900 border border-zinc-800">
                <span className="text-zinc-500">TR:</span> [{corners.topRight[0]}, {corners.topRight[1]}]
              </div>
              <div className="p-1.5 rounded bg-zinc-900 border border-zinc-800">
                <span className="text-zinc-500">BL:</span> [{corners.bottomLeft[0]}, {corners.bottomLeft[1]}]
              </div>
              <div className="p-1.5 rounded bg-zinc-900 border border-zinc-800">
                <span className="text-zinc-500">BR:</span> [{corners.bottomRight[0]}, {corners.bottomRight[1]}]
              </div>
            </div>

            <div className="text-zinc-400 font-bold mt-2 mb-1">Valores de cámara derivados:</div>
            <div className="p-2 rounded bg-zinc-900/90 border border-zinc-800 space-y-0.5 text-zinc-300">
              <div>
                <span className="text-zinc-500">Cristal:</span> {derivedStats.crtWidth} × {derivedStats.crtHeight} px
              </div>
              <div>
                <span className="text-zinc-500">SCREEN_ZOOM:</span>{' '}
                <strong className="text-[#3dff8a]">{derivedStats.zoom}x</strong>
              </div>
              <div>
                <span className="text-zinc-500">SCREEN_TX:</span>{' '}
                <strong className="text-[#22e6d8]">{derivedStats.tx}px</strong>
              </div>
              <div>
                <span className="text-zinc-500">SCREEN_TY:</span>{' '}
                <strong className="text-[#22e6d8]">{derivedStats.ty}px</strong>
              </div>
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t border-zinc-800">
            <button
              type="button"
              onClick={toggleZoom}
              className="w-full py-1.5 px-3 rounded bg-zinc-800 hover:bg-zinc-700 text-white font-medium border border-zinc-700 transition-colors flex items-center justify-center gap-2"
            >
              <span>{isZoomed ? '🔍 Ver en Reposo (1x)' : '🔍 Probar Zoom Cristal (~3.6x)'}</span>
            </button>

            <button
              type="button"
              onClick={copyConfig}
              className="w-full py-1.5 px-3 rounded bg-[#22e6d8]/15 hover:bg-[#22e6d8]/25 text-[#22e6d8] font-medium border border-[#22e6d8]/40 transition-colors"
            >
              {copied ? '✓ ¡Copiado al portapapeles!' : 'Copiar valores de calibración'}
            </button>
          </div>
        </aside>
      )}
    </div>
  );
};
