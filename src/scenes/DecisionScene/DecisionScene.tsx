import React, { useSyncExternalStore } from 'react';
import { Trash2, Wrench, Layers, CloudUpload } from 'lucide-react';
import { sceneStore } from '../../animations/rig';

export const DecisionScene: React.FC = () => {
  // Escena activa según el store centralizado (1 = Matriz de Decisión)
  const currentScene = useSyncExternalStore(
    sceneStore.subscribe,
    () => sceneStore.get().scene
  );
  const isSceneActive = currentScene === 1;

  return (
    <div
      id="scene-2"
      className="absolute inset-0 w-full h-full decision-crt-screen crt-scanlines z-15 pointer-events-auto select-none"
      style={{ visibility: 'hidden', opacity: 0 }}
    >
      {/* Marco exterior redondeado de la grilla 2×2 integrado con la superficie del CRT */}
      <div
        className="decision-border decision-grid-frame"
        style={{ visibility: 'hidden', opacity: 0 }}
      >
        {/* Línea horizontal central divisoria */}
        <div
          className="decision-line-h"
          style={{ transform: 'scaleX(0)' }}
          aria-hidden="true"
        />

        {/* Línea vertical central divisoria */}
        <div
          className="decision-line-v"
          style={{ transform: 'scaleY(0)' }}
          aria-hidden="true"
        />

        {/* Grilla 2×2 de cuadrantes de decisión */}
        <div className="grid grid-cols-2 grid-rows-2 w-full h-full">
          {/* [01] DESCARTAR */}
          <div
            className="decision-cell flex flex-col items-center justify-center gap-3 p-4 text-[#3dff8a]"
            style={{ visibility: 'hidden', opacity: 0 }}
          >
            <div className="decision-icon-glow">
              <Trash2 size={48} strokeWidth={1.5} />
            </div>
            <span
              className="decision-text-glow font-mono text-[19px] font-bold tracking-[0.16em] text-center"
            >
              [01] DESCARTAR
            </span>
          </div>

          {/* [02] MANTENER */}
          <div
            className="decision-cell flex flex-col items-center justify-center gap-3 p-4 text-[#3dff8a]"
            style={{ visibility: 'hidden', opacity: 0 }}
          >
            <div className="decision-icon-glow">
              <Wrench size={48} strokeWidth={1.5} />
            </div>
            <span
              className="decision-text-glow font-mono text-[19px] font-bold tracking-[0.16em] text-center"
            >
              [02] MANTENER
            </span>
          </div>

          {/* [03] REINGENIERÍA */}
          <div
            className="decision-cell flex flex-col items-center justify-center gap-3 p-4 text-[#3dff8a]"
            style={{ visibility: 'hidden', opacity: 0 }}
          >
            <div className="decision-icon-glow">
              <Layers size={48} strokeWidth={1.5} />
            </div>
            <span
              className="decision-text-glow font-mono text-[19px] font-bold tracking-[0.16em] text-center"
            >
              [03] REINGENIERÍA
            </span>
          </div>

          {/* [04] MIGRAR (Recomendada — con marco angular de esquinas tácticas y glow pulsante) */}
          <div
            className={`decision-cell relative flex flex-col items-center justify-center gap-3 p-4 text-[#3dff8a] rounded-br-[20px] transition-colors ${
              isSceneActive ? 'decision-glow-active' : ''
            }`}
            style={{
              visibility: 'hidden',
              opacity: 0,
              backgroundColor: 'rgba(61, 255, 138, 0.08)',
            }}
          >
            {/* Marco de 4 esquinas angulares tácticas (estilo mira / brackets) */}
            <div
              className="decision-migrar-frame absolute inset-2.5 pointer-events-none"
              style={{ visibility: 'hidden', opacity: 0 }}
            >
              {/* Top-Left */}
              <span className="absolute top-0 left-0 w-4 h-4 border-t-[2.5px] border-l-[2.5px] border-[#3dff8a] filter drop-shadow-[0_0_6px_#3dff8a]" />
              {/* Top-Right */}
              <span className="absolute top-0 right-0 w-4 h-4 border-t-[2.5px] border-r-[2.5px] border-[#3dff8a] filter drop-shadow-[0_0_6px_#3dff8a]" />
              {/* Bottom-Left */}
              <span className="absolute bottom-0 left-0 w-4 h-4 border-b-[2.5px] border-l-[2.5px] border-[#3dff8a] filter drop-shadow-[0_0_6px_#3dff8a]" />
              {/* Bottom-Right */}
              <span className="absolute bottom-0 right-0 w-4 h-4 border-b-[2.5px] border-r-[2.5px] border-[#3dff8a] filter drop-shadow-[0_0_6px_#3dff8a]" />
            </div>

            <div className="decision-migrar-glow-icon">
              <CloudUpload size={54} strokeWidth={1.7} />
            </div>
            <span
              className="decision-text-glow font-mono text-[21px] font-bold tracking-[0.16em] text-center"
            >
              [04] MIGRAR
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
