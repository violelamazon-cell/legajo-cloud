import React from 'react';

export const ClosingScene: React.FC = () => {
  return (
    <section
      id="scene-7"
      className="absolute inset-0 flex flex-col items-center justify-center p-8 select-none"
    >
      <div className="max-w-xl w-full border border-[#1b1d22] bg-[#0c0d10]/80 p-8 rounded-lg shadow-2xl backdrop-blur text-center">
        <div className="inline-block px-3 py-1 mb-4 rounded-full border border-[#22e6d8]/40 bg-[#22e6d8]/10 font-mono text-xs text-[#22e6d8]">
          [07] CIERRE // MIGRACIÓN COMPLETADA CON ÉXITO
        </div>
        <h2 className="text-3xl font-bold font-mono text-white mb-3 tracking-tight">GRACIAS.</h2>
        <p className="text-zinc-400 text-sm font-mono leading-relaxed mb-6">
          De sistemas legados a una arquitectura cloud moderna, resiliente y escalable.
        </p>
        <div className="p-3 bg-black/60 rounded border border-[#1b1d22] font-mono text-xs text-zinc-400">
          &gt; PROYECTO: LEGADO → CLOUD<br />
          &gt; SCROLL ARRIBA O TECLAS PARA REVISAR CUALQUIER ESCENA
        </div>
      </div>
    </section>
  );
};
