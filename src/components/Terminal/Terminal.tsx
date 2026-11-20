import React from 'react';

/**
 * Terminal — estructura presentacional del contenido CRT.
 *
 * Los elementos clave se marcan con data-boot="*" para que BootScene
 * los consulte vía querySelector después del montaje.
 *
 * Layout interno (640×480, espacio del overlay):
 *   - Flash overlay (crt-flash)
 *   - Screen: header + 3 líneas de cuerpo + fila del cursor
 */
const Terminal = React.forwardRef<HTMLDivElement>((_, ref) => {
  return (
    <div
      ref={ref}
      className="crt-scanlines relative w-full h-full"
      style={{ backgroundColor: 'transparent' }}
    >
      {/* Flash de encendido — GSAP lo anima */}
      <div className="crt-flash" data-boot="flash" aria-hidden="true" />

      {/* Contenido fósforo — comienza invisible, GSAP lo revela */}
      <div
        data-boot="screen"
        className="w-full h-full flex flex-col justify-start text-[#3dff8a] select-none"
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '32px',
          lineHeight: 1.4,
          padding: '28px 32px 24px',
          opacity: 0,
        }}
      >
        {/* Línea 0: encabezado — "// SISTEMA LEGADO v1.0" */}
        <div
          className="crt-line border-b border-[#3dff8a]/40 pb-3 mb-5 font-bold tracking-widest"
          style={{ fontSize: '34px' }}
        >
          <span data-boot="line-0" />
        </div>

        {/* Líneas de cuerpo del terminal */}
        <div className="flex flex-col gap-y-3">
          {/* Línea 1: "> INICIANDO..." */}
          <div className="crt-line">
            <span data-boot="line-1" />
          </div>

          {/* Línea 2: "> MÓDULO: OPERACIONES" */}
          <div className="crt-line">
            <span data-boot="line-2" />
          </div>

          {/* Línea 3: "> ESTADO: ACTIVO" */}
          <div className="crt-line">
            <span data-boot="line-3" />
          </div>

          {/* Fila del cursor: "> [cursor]" */}
          <div className="crt-line flex items-center gap-2 mt-2">
            <span className="text-[#3dff8a]/70">{'>'}</span>
            <span
              className="crt-cursor"
              data-boot="cursor"
              aria-hidden="true"
            />
          </div>
        </div>
      </div>
    </div>
  );
});

Terminal.displayName = 'Terminal';

export { Terminal };
