import React from 'react';

export const DecisionScene: React.FC = () => {
  return (
    <section
      id="scene-2"
      className="absolute inset-0 flex flex-col items-center justify-center p-8 select-none"
    >
      <div className="max-w-xl w-full border border-[#1b1d22] bg-[#0c0d10]/80 p-8 rounded-lg shadow-2xl backdrop-blur">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-[#1b1d22]">
          <span className="font-mono text-xs tracking-wider text-[#3dff8a] font-bold">[02] MATRIZ DE DECISIÓN</span>
          <span className="font-mono text-[10px] text-zinc-500">ZOOM CRT</span>
        </div>
        <h2 className="text-2xl font-bold font-mono text-[#3dff8a] mb-2 tracking-tight">EVALUACIÓN ESTRATÉGICA</h2>
        <div className="grid grid-cols-2 gap-3 my-4 font-mono text-xs">
          <div className="p-3 rounded border border-zinc-800 bg-black/40 text-zinc-400">[01] DESCARTAR</div>
          <div className="p-3 rounded border border-zinc-800 bg-black/40 text-zinc-400">[02] MANTENER</div>
          <div className="p-3 rounded border border-zinc-800 bg-black/40 text-zinc-400">[03] REINGENIERÍA</div>
          <div className="p-3 rounded border border-[#3dff8a] bg-[#3dff8a]/10 text-[#3dff8a] font-bold shadow-[0_0_15px_rgba(61,255,138,0.2)]">
            [04] MIGRAR // SELECCIONADO
          </div>
        </div>
        <div className="p-3 bg-black/60 rounded border border-[#1b1d22] font-mono text-xs text-zinc-400">
          &gt; DECISIÓN: MIGRACIÓN A ARQUITECTURA CLOUD MODERNA
        </div>
      </div>
    </section>
  );
};
