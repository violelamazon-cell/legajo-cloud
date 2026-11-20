import React from 'react';
import { CRTScreen } from '../../components/CRTScreen';

export const BootScene: React.FC = () => {
  return (
    <section
      id="scene-1"
      className="absolute inset-0 flex items-center justify-center select-none overflow-hidden pt-14"
    >
      <CRTScreen contentWidth={640} contentHeight={480}>
        {/*
          Tipografía CRT — tamaño en espacio del overlay (640×480).
          Factor de escala visual real ≈ 0.775 a 1920×1080 (matrix3d × plateScale).
          32px → ~24.8px visual | 34px → ~26.4px visual | 26px → ~20px visual (footer).
        */}
        <div
          className="w-full h-full flex flex-col justify-start text-[#3dff8a] bg-black/90 selection:bg-[#3dff8a] selection:text-black"
          style={{
            fontFamily: "'JetBrains Mono', 'Courier New', monospace",
            fontSize: '32px',
            lineHeight: 1.4,
            padding: '28px 32px 24px',
          }}
        >
          {/* Header */}
          <div
            className="border-b border-[#3dff8a]/40 pb-3 mb-5 font-bold tracking-widest text-[#3dff8a]"
            style={{ fontSize: '34px' }}
          >
            // SISTEMA LEGADO v1.0
          </div>

          {/* Líneas de terminal */}
          <div className="flex flex-col gap-y-3 text-[#3dff8a]/90">
            <div>&gt; INICIANDO...</div>
            <div>&gt; MÓDULO: OPERACIONES</div>
            <div>&gt; ESTADO: ACTIVO</div>

            {/* Cursor parpadeante */}
            <div className="flex items-center gap-2 mt-2">
              <span>&gt;</span>
              <span
                className="inline-block bg-[#3dff8a] animate-pulse shadow-[0_0_10px_#3dff8a]"
                style={{ width: '18px', height: '32px', verticalAlign: 'middle' }}
              />
            </div>
          </div>

          {/* Footer */}
          <div
            className="mt-auto pt-4 border-t border-[#3dff8a]/20 text-[#3dff8a]/60 flex justify-between"
            style={{ fontSize: '26px' }}
          >
            <span>MEM: 640K OK</span>
            <span>DISC: READY</span>
          </div>
        </div>
      </CRTScreen>
    </section>
  );
};
