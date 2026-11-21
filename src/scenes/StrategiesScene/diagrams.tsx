export const BigBang = () => (
  <svg className="diag" viewBox="0 0 240 136" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bbCyanGrad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#52ffea" />
        <stop offset="100%" stopColor="#22e6d8" />
      </linearGradient>
      <linearGradient id="bbVioletGrad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#c084fc" />
        <stop offset="100%" stopColor="#a56bff" />
      </linearGradient>
      <linearGradient id="bbArrowGrad" x1="68" y1="68" x2="172" y2="68" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#22e6d8" stopOpacity="0.4" />
        <stop offset="50%" stopColor="#22e6d8" />
        <stop offset="100%" stopColor="#c084fc" />
      </linearGradient>
      <filter id="bbGlow" x="-30%" y="-30%" width="160%" height="160%">
        <feGaussianBlur stdDeviation="4.5" result="blur" />
        <feMerge>
          <feMergeNode in="blur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>

    {/* Halo ambiental detrás del nuevo sistema */}
    <ellipse cx="188" cy="68" rx="42" ry="34" fill="rgba(34, 230, 216, 0.16)" filter="url(#bbGlow)" />

    {/* ── BLOQUE 1: SISTEMA LEGADO (3D isométrico a la izquierda) ── */}
    <g className="bb-old">
      {/* Sombra base */}
      <ellipse cx="52" cy="106" rx="30" ry="10" fill="rgba(0, 0, 0, 0.5)" filter="url(#bbGlow)" />
      
      {/* Cara Superior */}
      <path d="M 52 38 L 78 51 L 52 64 L 26 51 Z" fill="rgba(255, 255, 255, 0.08)" stroke="rgba(255, 255, 255, 0.3)" strokeWidth="1.2" />
      {/* Cara Izquierda */}
      <path d="M 26 51 L 52 64 L 52 98 L 26 85 Z" fill="rgba(255, 255, 255, 0.04)" stroke="rgba(255, 255, 255, 0.2)" strokeWidth="1.2" />
      {/* Cara Derecha */}
      <path d="M 52 64 L 78 51 L 78 85 L 52 98 Z" fill="rgba(255, 255, 255, 0.02)" stroke="rgba(255, 255, 255, 0.15)" strokeWidth="1.2" />

      {/* Ranuras de servidor / rejillas de legado */}
      <line x1="32" y1="62" x2="48" y2="70" stroke="rgba(255, 255, 255, 0.22)" strokeWidth="1.2" />
      <line x1="32" y1="72" x2="48" y2="80" stroke="rgba(255, 255, 255, 0.22)" strokeWidth="1.2" />
      <line x1="32" y1="82" x2="48" y2="90" stroke="rgba(255, 255, 255, 0.22)" strokeWidth="1.2" />
      <circle cx="68" cy="65" r="2" fill="rgba(255, 180, 80, 0.7)" />
    </g>

    {/* ── CONECTOR: FLECHA LUMINOSA CIAN Y PULSOS ── */}
    <g>
      <path className="bb-arrow" d="M 82 68 H 154" stroke="url(#bbArrowGrad)" strokeWidth="2.5" strokeLinecap="round" pathLength={1} />
      {/* Cabeza de flecha luminosa */}
      <path className="bb-arrow" d="M 146 61 L 156 68 L 146 75" stroke="#52ffea" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" pathLength={1} filter="url(#bbGlow)" />
      {/* Anillo de pulso energético */}
      <circle className="bb-pulse" cx="118" cy="68" r="8" stroke="#22e6d8" strokeWidth="1.5" fill="none" opacity="0.4" />
    </g>

    {/* ── BLOQUE 2: NUEVO SISTEMA (3D isométrico luminoso a la derecha) ── */}
    <g className="bb-new">
      {/* Sombra base */}
      <ellipse cx="188" cy="106" rx="32" ry="10" fill="rgba(34, 230, 216, 0.3)" filter="url(#bbGlow)" />

      {/* Cara Superior (Cian brillante) */}
      <path d="M 188 36 L 216 50 L 188 64 L 160 50 Z" fill="url(#bbCyanGrad)" fillOpacity="0.28" stroke="#52ffea" strokeWidth="1.5" />
      {/* Cara Izquierda (Reflejo Cian) */}
      <path d="M 160 50 L 188 64 L 188 100 L 160 86 Z" fill="url(#bbCyanGrad)" fillOpacity="0.18" stroke="#22e6d8" strokeWidth="1.5" />
      {/* Cara Derecha (Reflejo Violeta Iridiscente) */}
      <path d="M 188 64 L 216 50 L 216 86 L 188 100 Z" fill="url(#bbVioletGrad)" fillOpacity="0.22" stroke="#c084fc" strokeWidth="1.5" />

      {/* Núcleo digital luminoso en la cara superior */}
      <circle cx="188" cy="50" r="4.5" fill="#ffffff" filter="url(#bbGlow)" />
      <path d="M 174 43 L 188 50 L 202 43" stroke="rgba(255, 255, 255, 0.7)" strokeWidth="1" fill="none" />
    </g>
  </svg>
);

export const Paralelo = () => (
  <svg className="diag" viewBox="0 0 240 136" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="prVioletGrad" x1="20" y1="36" x2="220" y2="36" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#a56bff" stopOpacity="0.1" />
        <stop offset="50%" stopColor="#a56bff" stopOpacity="0.45" />
        <stop offset="100%" stopColor="#c084fc" stopOpacity="0.1" />
      </linearGradient>
      <linearGradient id="prCyanGrad" x1="20" y1="96" x2="220" y2="96" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#22e6d8" stopOpacity="0.1" />
        <stop offset="50%" stopColor="#22e6d8" stopOpacity="0.5" />
        <stop offset="100%" stopColor="#52ffea" stopOpacity="0.1" />
      </linearGradient>
      <linearGradient id="prSyncGrad" x1="0" y1="46" x2="0" y2="86" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#c084fc" />
        <stop offset="100%" stopColor="#22e6d8" />
      </linearGradient>
      <filter id="prGlow" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="3.5" result="blur" />
        <feMerge>
          <feMergeNode in="blur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>

    {/* ── PLATAFORMA 1: SISTEMA LEGADO (Superior, Iluminación Violeta) ── */}
    <g>
      {/* Extrusión 3D inferior */}
      <path d="M 28 44 C 28 49, 36 53, 48 53 H 192 C 204 53, 212 49, 212 44 V 49 C 212 54, 204 58, 192 58 H 48 C 36 58, 28 54, 28 49 Z" fill="rgba(165, 107, 255, 0.2)" stroke="rgba(165, 107, 255, 0.4)" strokeWidth="1" />
      {/* Superficie superior de la pista */}
      <rect x="28" y="27" width="184" height="20" rx="10" fill="url(#prVioletGrad)" stroke="#a56bff" strokeWidth="1.4" />
      {/* Guía central */}
      <line x1="42" y1="37" x2="198" y2="37" stroke="rgba(192, 132, 252, 0.35)" strokeWidth="1" strokeDasharray="4 3" />
      {/* Esfera / Runner de datos activo (Violeta/Blanco) */}
      <circle className="pr-dot" cx="48" cy="37" r="5" fill="#ffffff" stroke="#c084fc" strokeWidth="2" filter="url(#prGlow)" />
    </g>

    {/* ── CONECTORES DE SINCRONIZACIÓN VERTICAL (Laser sync) ── */}
    <g className="pr-sync" opacity="0">
      {/* Líneas láser verticales */}
      <line x1="84" y1="47" x2="84" y2="87" stroke="url(#prSyncGrad)" strokeWidth="1.8" strokeDasharray="3 3" />
      <line x1="120" y1="47" x2="120" y2="87" stroke="url(#prSyncGrad)" strokeWidth="1.8" strokeDasharray="3 3" />
      <line x1="156" y1="47" x2="156" y2="87" stroke="url(#prSyncGrad)" strokeWidth="1.8" strokeDasharray="3 3" />
      
      {/* Nodos de enlace */}
      <circle cx="84" cy="47" r="2.5" fill="#c084fc" />
      <circle cx="84" cy="87" r="2.5" fill="#22e6d8" />
      <circle cx="120" cy="47" r="2.5" fill="#c084fc" />
      <circle cx="120" cy="87" r="2.5" fill="#22e6d8" />
      <circle cx="156" cy="47" r="2.5" fill="#c084fc" />
      <circle cx="156" cy="87" r="2.5" fill="#22e6d8" />
    </g>

    {/* ── PLATAFORMA 2: NUEVO SISTEMA (Inferior, Iluminación Cian) ── */}
    <g>
      {/* Extrusión 3D inferior */}
      <path d="M 28 97 C 28 102, 36 106, 48 106 H 192 C 204 106, 212 102, 212 97 V 102 C 212 107, 204 111, 192 111 H 48 C 36 111, 28 107, 28 102 Z" fill="rgba(34, 230, 216, 0.22)" stroke="rgba(34, 230, 216, 0.45)" strokeWidth="1" />
      {/* Superficie superior de la pista */}
      <rect x="28" y="80" width="184" height="20" rx="10" fill="url(#prCyanGrad)" stroke="#22e6d8" strokeWidth="1.4" />
      {/* Guía central */}
      <line x1="42" y1="90" x2="198" y2="90" stroke="rgba(34, 230, 216, 0.4)" strokeWidth="1" strokeDasharray="4 3" />
      {/* Esfera / Runner de datos activo (Cian/Blanco) */}
      <circle className="pr-dot" cx="48" cy="90" r="5" fill="#ffffff" stroke="#22e6d8" strokeWidth="2" filter="url(#prGlow)" />
    </g>
  </svg>
);

export const Strangler = () => (
  <svg className="diag" viewBox="0 0 240 136" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="stLinkGrad1" x1="68" y1="36" x2="176" y2="36" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#a56bff" stopOpacity="0.4" />
        <stop offset="60%" stopColor="#22e6d8" />
        <stop offset="100%" stopColor="#3dff8a" />
      </linearGradient>
      <linearGradient id="stLinkGrad2" x1="68" y1="68" x2="176" y2="68" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#a56bff" stopOpacity="0.4" />
        <stop offset="60%" stopColor="#22e6d8" />
        <stop offset="100%" stopColor="#52ffea" />
      </linearGradient>
      <linearGradient id="stLinkGrad3" x1="68" y1="100" x2="176" y2="100" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#a56bff" stopOpacity="0.4" />
        <stop offset="70%" stopColor="#a56bff" />
        <stop offset="100%" stopColor="#c084fc" />
      </linearGradient>
      <filter id="stGlow" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="3.5" result="blur" />
        <feMerge>
          <feMergeNode in="blur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>

    {/* ── BLOQUE PRINCIPAL LEGADO (Izquierda, monolito que se ramifica) ── */}
    <g className="st-monolith">
      {/* Sombra base */}
      <ellipse cx="44" cy="116" rx="26" ry="8" fill="rgba(0,0,0,0.5)" filter="url(#stGlow)" />
      
      {/* Monolito integrado con 3 niveles */}
      <path d="M 44 16 L 68 28 L 44 40 L 20 28 Z" fill="rgba(255, 255, 255, 0.08)" stroke="rgba(255, 255, 255, 0.3)" strokeWidth="1.2" />
      <path d="M 20 28 L 44 40 L 44 108 L 20 96 Z" fill="rgba(255, 255, 255, 0.04)" stroke="rgba(255, 255, 255, 0.2)" strokeWidth="1.2" />
      <path d="M 44 40 L 68 28 L 68 96 L 44 108 Z" fill="rgba(255, 255, 255, 0.02)" stroke="rgba(255, 255, 255, 0.15)" strokeWidth="1.2" />

      {/* Indicadores de los 3 módulos que residen en el monolito */}
      <line className="st-old-1" x1="26" y1="48" x2="40" y2="55" stroke="#3dff8a" strokeWidth="2" opacity="0.8" />
      <line className="st-old-2" x1="26" y1="68" x2="40" y2="75" stroke="#22e6d8" strokeWidth="2" opacity="0.8" />
      <line className="st-old-3" x1="26" y1="88" x2="40" y2="95" stroke="#c084fc" strokeWidth="2" opacity="0.8" />
    </g>

    {/* ── FACHADA / PROXY DE ENRUTAMIENTO (Strangler Facade) ── */}
    <g>
      <line className="st-facade" x1="112" y1="18" x2="112" y2="118" stroke="#22e6d8" strokeWidth="1.8" strokeDasharray="4 3" opacity="0" filter="url(#stGlow)" />
      <rect x="106" y="61" width="12" height="14" rx="3" fill="#04121a" stroke="#22e6d8" strokeWidth="1.5" />
      <circle cx="112" cy="68" r="2.5" fill="#52ffea" />
    </g>

    {/* ── CONECTORES CURVOS LUMINOSOS (Ramificaciones) ── */}
    <g>
      <path className="st-link-1" d="M 68 40 C 94 40, 102 36, 172 36" stroke="url(#stLinkGrad1)" strokeWidth="2.2" strokeLinecap="round" pathLength={1} />
      <path className="st-link-2" d="M 68 68 C 94 68, 102 68, 172 68" stroke="url(#stLinkGrad2)" strokeWidth="2.2" strokeLinecap="round" pathLength={1} />
      <path className="st-link-3" d="M 68 96 C 94 96, 102 100, 172 100" stroke="url(#stLinkGrad3)" strokeWidth="2.2" strokeLinecap="round" pathLength={1} />
    </g>

    {/* ── 3 MÓDULOS SECUNDARIOS MICROSERVICIOS (Derecha, diferentes intensidades) ── */}
    {/* Módulo 1 (Migrado - Alta intensidad Verde/Cian) */}
    <g className="st-new-1">
      <ellipse cx="194" cy="46" rx="22" ry="7" fill="rgba(61, 255, 138, 0.25)" filter="url(#stGlow)" />
      <path d="M 194 22 L 214 31 L 194 40 L 174 31 Z" fill="rgba(61, 255, 138, 0.28)" stroke="#3dff8a" strokeWidth="1.4" />
      <path d="M 174 31 L 194 40 L 194 50 L 174 41 Z" fill="rgba(34, 230, 216, 0.22)" stroke="#22e6d8" strokeWidth="1.4" />
      <path d="M 194 40 L 214 31 L 214 41 L 194 50 Z" fill="rgba(61, 255, 138, 0.15)" stroke="#3dff8a" strokeWidth="1.4" />
      <circle cx="194" cy="31" r="2.5" fill="#ffffff" filter="url(#stGlow)" />
    </g>

    {/* Módulo 2 (En migración - Intensidad Media Cian/Violeta) */}
    <g className="st-new-2">
      <ellipse cx="194" cy="78" rx="22" ry="7" fill="rgba(34, 230, 216, 0.2)" filter="url(#stGlow)" />
      <path d="M 194 54 L 214 63 L 194 72 L 174 63 Z" fill="rgba(34, 230, 216, 0.22)" stroke="#22e6d8" strokeWidth="1.4" />
      <path d="M 174 63 L 194 72 L 194 82 L 174 73 Z" fill="rgba(165, 107, 255, 0.2)" stroke="#a56bff" strokeWidth="1.4" />
      <path d="M 194 72 L 214 63 L 214 73 L 194 82 Z" fill="rgba(34, 230, 216, 0.15)" stroke="#22e6d8" strokeWidth="1.4" />
      <circle cx="194" cy="63" r="2.5" fill="#ffffff" />
    </g>

    {/* Módulo 3 (Programado - Intensidad Sutil Violeta) */}
    <g className="st-new-3">
      <ellipse cx="194" cy="110" rx="22" ry="7" fill="rgba(165, 107, 255, 0.15)" />
      <path d="M 194 86 L 214 95 L 194 104 L 174 95 Z" fill="rgba(165, 107, 255, 0.15)" stroke="#a56bff" strokeWidth="1.2" />
      <path d="M 174 95 L 194 104 L 194 114 L 174 105 Z" fill="rgba(165, 107, 255, 0.1)" stroke="#a56bff" strokeWidth="1.2" strokeOpacity="0.7" />
      <path d="M 194 104 L 214 95 L 214 105 L 194 114 Z" fill="rgba(165, 107, 255, 0.08)" stroke="#a56bff" strokeWidth="1.2" strokeOpacity="0.7" />
      <circle cx="194" cy="95" r="2" fill="rgba(192, 132, 252, 0.7)" />
    </g>
  </svg>
);
