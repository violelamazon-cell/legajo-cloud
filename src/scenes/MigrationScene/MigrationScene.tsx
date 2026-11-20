import React from 'react';

export const MigrationScene: React.FC = () => {
  return (
    <section
      id="scene-4"
      className="absolute inset-0 flex items-center select-none overflow-visible pointer-events-none"
    >
      {/* Track horizontal continuo de 2.5 viewports de recorrido vertical */}
      <div className="flex items-center gap-16 pl-24 w-[3600px] pointer-events-auto">
        {/* Terminal Origen */}
        <div className="w-[450px] shrink-0 border border-[#1b1d22] bg-[#0c0d10]/90 p-6 rounded-lg shadow-2xl backdrop-blur">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#1b1d22]">
            <span className="font-mono text-xs text-[#3dff8a] font-bold">[04.1] NODO ORIGEN</span>
            <span className="font-mono text-[10px] text-zinc-500">MAINFRAME</span>
          </div>
          <div className="font-mono text-sm font-bold text-zinc-200 mb-2">CENTRO DE DATOS ON-PREMISE</div>
          <div className="font-mono text-xs text-zinc-400 space-y-1">
            <div>&gt; EXTRACCIÓN EN LOTE ACTIVA</div>
            <div>&gt; PROTOCOLO: SECURE STREAM</div>
            <div>&gt; INTEGRIDAD: 100% VALIDADOS</div>
          </div>
        </div>

        {/* Conducto / Línea de Migración */}
        <div className="w-[1000px] shrink-0 flex flex-col items-center">
          <div className="font-mono text-xs text-zinc-400 mb-2 tracking-widest flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#22e6d8] animate-ping" />
            CANAL DE MIGRACIÓN HORIZONTAL (2.5 VIEWPORTS // SCROLL CONTINUO)
          </div>
          <div className="w-full h-2 rounded-full bg-gradient-to-r from-[#3dff8a] via-[#22e6d8] to-[#a56bff] relative shadow-[0_0_20px_rgba(34,230,216,0.3)]">
            <div className="absolute -top-3 left-1/4 -translate-x-1/2 px-2 py-0.5 rounded bg-zinc-900 border border-zinc-700 font-mono text-[10px] text-zinc-300">
              25% SINK
            </div>
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded bg-zinc-900 border border-zinc-700 font-mono text-[10px] text-zinc-300">
              50% BRIDGE
            </div>
            <div className="absolute -top-3 left-3/4 -translate-x-1/2 px-2 py-0.5 rounded bg-zinc-900 border border-zinc-700 font-mono text-[10px] text-zinc-300">
              75% REPLICATION
            </div>
          </div>
          <div className="mt-3 font-mono text-[11px] text-zinc-500">
            ← RETRO / MAINFRAME &nbsp;&nbsp;|&nbsp;&nbsp; TRANSICIÓN SIN SNAP &nbsp;&nbsp;|&nbsp;&nbsp; CLOUD / MACBOOK →
          </div>
        </div>

        {/* Terminal Destino */}
        <div className="w-[450px] shrink-0 border border-[#1b1d22] bg-[#0c0d10]/90 p-6 rounded-lg shadow-2xl backdrop-blur">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#1b1d22]">
            <span className="font-mono text-xs text-[#a56bff] font-bold">[04.2] NODO DESTINO</span>
            <span className="font-mono text-[10px] text-zinc-500">CLOUD TARGET</span>
          </div>
          <div className="font-mono text-sm font-bold text-zinc-200 mb-2">INFRAESTRUCTURA CLOUD NATIVA</div>
          <div className="font-mono text-xs text-zinc-400 space-y-1">
            <div>&gt; INGESTA EN TIEMPO REAL</div>
            <div>&gt; CLUSTERS K8S DESPLEGADOS</div>
            <div>&gt; SINCRONIZACIÓN: ACTIVA</div>
          </div>
        </div>
      </div>
    </section>
  );
};
