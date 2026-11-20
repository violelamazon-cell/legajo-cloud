import React from 'react';

export const WrapperScene: React.FC = () => {
  return (
    <section
      id="scene-3"
      className="absolute inset-0 flex flex-col items-center justify-center p-8 select-none"
    >
      <div className="max-w-xl w-full border border-[#1b1d22] bg-[#0c0d10]/80 p-8 rounded-lg shadow-2xl backdrop-blur">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-[#1b1d22]">
          <span className="font-mono text-xs tracking-wider text-[#22e6d8] font-bold">[03] WRAPPER / ENCAPSULAMIENTO</span>
          <span className="font-mono text-[10px] text-zinc-500">ERA: TRANSICIÓN</span>
        </div>
        <h2 className="text-2xl font-bold font-mono text-[#22e6d8] mb-2 tracking-tight">CAPA DE ADAPTACIÓN (API WRAPPER)</h2>
        <p className="text-zinc-400 text-sm font-mono leading-relaxed mb-4">
          Aislamiento del núcleo legado mediante adaptadores de protocolo y contratos REST/gRPC.
        </p>
        <div className="p-3 bg-black/60 rounded border border-[#1b1d22] font-mono text-xs text-[#22e6d8]">
          &gt; CORE: INTACTO // AISLADO<br />
          &gt; INTERFAZ: MODERNIZADA // ESTANDARIZADA<br />
          &gt; CANAL LISTO PARA TRANSMISIÓN DE DATOS
        </div>
      </div>
    </section>
  );
};
