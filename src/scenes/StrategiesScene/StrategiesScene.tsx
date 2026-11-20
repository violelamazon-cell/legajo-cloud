import React from 'react';

export const StrategiesScene: React.FC = () => {
  return (
    <section
      id="scene-5"
      className="absolute inset-0 flex flex-col items-center justify-center p-8 select-none"
      style={{ visibility: 'hidden', opacity: 0 }}
    >
      <div className="max-w-2xl w-full border border-[#1b1d22] bg-[#0c0d10]/80 p-8 rounded-lg shadow-2xl backdrop-blur">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-[#1b1d22]">
          <span className="font-mono text-xs tracking-wider text-[#a56bff] font-bold">[05] ESTRATEGIAS DE MIGRACIÓN</span>
          <span className="font-mono text-[10px] text-zinc-500">ERA: MODERNA</span>
        </div>
        <h2 className="text-2xl font-bold font-mono text-white mb-2 tracking-tight">PATRONES DE TRANSICIÓN</h2>
        <div className="grid grid-cols-3 gap-3 my-4 font-mono text-xs">
          <div className="p-4 rounded border border-zinc-800 bg-black/40">
            <div className="text-zinc-500 text-[10px] mb-1">PATRÓN A</div>
            <div className="font-bold text-zinc-300 mb-2">BIG BANG</div>
            <div className="text-[11px] text-zinc-500">Reemplazo directo en una sola ventana.</div>
          </div>
          <div className="p-4 rounded border border-zinc-800 bg-black/40">
            <div className="text-zinc-500 text-[10px] mb-1">PATRÓN B</div>
            <div className="font-bold text-zinc-300 mb-2">PARALELO</div>
            <div className="text-[11px] text-zinc-500">Doble ejecución con reconciliación de datos.</div>
          </div>
          <div className="p-4 rounded border border-[#a56bff] bg-[#a56bff]/10 shadow-[0_0_15px_rgba(165,107,255,0.2)]">
            <div className="text-[#a56bff] text-[10px] font-bold mb-1">RECOMENDADO</div>
            <div className="font-bold text-[#a56bff] mb-2">STRANGLER FIG</div>
            <div className="text-[11px] text-zinc-300">Migración incremental servicio por servicio.</div>
          </div>
        </div>
        <div className="p-3 bg-black/60 rounded border border-[#1b1d22] font-mono text-xs text-zinc-400">
          &gt; ESTRATEGIA ÓPTIMA: STRANGLER FIG // RIESGO OPERACIONAL MÍNIMO
        </div>
      </div>
    </section>
  );
};
