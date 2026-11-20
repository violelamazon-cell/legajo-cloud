import React from 'react';

export const MetricsScene: React.FC = () => {
  return (
    <section
      id="scene-6"
      className="absolute inset-0 flex flex-col items-center justify-center p-8 select-none"
      style={{ visibility: 'hidden', opacity: 0 }}
    >
      <div className="max-w-2xl w-full border border-[#1b1d22] bg-[#0c0d10]/80 p-8 rounded-lg shadow-2xl backdrop-blur">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-[#1b1d22]">
          <span className="font-mono text-xs tracking-wider text-[#22e6d8] font-bold">[06] MÉTRICAS DE ÉXITO</span>
          <span className="font-mono text-[10px] text-zinc-500">BENTO INDICATORS</span>
        </div>
        <h2 className="text-2xl font-bold font-mono text-white mb-2 tracking-tight">RESULTADOS DE LA MIGRACIÓN</h2>
        <div className="grid grid-cols-3 gap-3 my-4 font-mono text-xs">
          <div className="p-3 rounded border border-zinc-800 bg-black/40">
            <div className="text-zinc-500 text-[10px]">INTEGRIDAD</div>
            <div className="text-xl font-bold text-[#3dff8a] mt-1">100%</div>
            <div className="text-[10px] text-zinc-500 mt-1">Cero pérdida de registros</div>
          </div>
          <div className="p-3 rounded border border-zinc-800 bg-black/40">
            <div className="text-zinc-500 text-[10px]">LATENCIA P99</div>
            <div className="text-xl font-bold text-[#22e6d8] mt-1">-68%</div>
            <div className="text-[10px] text-zinc-500 mt-1">240ms → 76ms</div>
          </div>
          <div className="p-3 rounded border border-zinc-800 bg-black/40">
            <div className="text-zinc-500 text-[10px]">DISPONIBILIDAD</div>
            <div className="text-xl font-bold text-[#a56bff] mt-1">99.99%</div>
            <div className="text-[10px] text-zinc-500 mt-1">SLA Multi-región</div>
          </div>
        </div>
        <div className="p-3 bg-black/60 rounded border border-[#1b1d22] font-mono text-xs text-zinc-400">
          &gt; MÉTRICAS COMPLETADAS // DATOS ILUSTRATIVOS DE EJEMPLO ACADÉMICO
        </div>
      </div>
    </section>
  );
};
