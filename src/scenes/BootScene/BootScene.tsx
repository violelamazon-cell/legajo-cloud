import React from 'react';

export const BootScene: React.FC = () => {
  return (
    <section
      id="scene-1"
      className="absolute inset-0 flex flex-col items-center justify-center p-8 select-none"
    >
      <div className="max-w-xl w-full border border-[#1b1d22] bg-[#0c0d10]/80 p-8 rounded-lg shadow-2xl backdrop-blur">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-[#1b1d22]">
          <span className="font-mono text-xs tracking-wider text-[#3dff8a] font-bold">[01] BOOT // INTRODUCCIÓN</span>
          <span className="font-mono text-[10px] text-zinc-500">ERA: RETRO</span>
        </div>
        <h2 className="text-2xl font-bold font-mono text-[#3dff8a] mb-2 tracking-tight">SISTEMA LEGADO CORE</h2>
        <p className="text-zinc-400 text-sm font-mono leading-relaxed mb-4">
          Terminal mainframe activa. Arquitectura monolítica sobre infraestructura local.
        </p>
        <div className="p-3 bg-black/60 rounded border border-[#1b1d22] font-mono text-xs text-[#3dff8a]/90">
          &gt; ESTADO: OPERACIONAL (1998)<br />
          &gt; PROCESOS EN EJECUCIÓN: 4,120 TRANS/SEG<br />
          &gt; SCROLL HACIA ABAJO PARA EXPLORAR LA MATRIZ DE DECISIÓN
        </div>
      </div>
    </section>
  );
};
