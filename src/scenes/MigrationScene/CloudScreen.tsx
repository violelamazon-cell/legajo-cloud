import { forwardRef, useImperativeHandle, useRef, useEffect } from 'react';
import gsap from 'gsap';
import { sceneStore } from '../../animations/rig';

export interface CloudScreenHandle {
  container: HTMLDivElement | null;
  flashLine: HTMLDivElement | null;
  bg: HTMLDivElement | null;
  frame: HTMLDivElement | null;
  dots: HTMLDivElement | null;
  title: HTMLDivElement | null;
  subtitle: HTMLDivElement | null;
  cloudIcon: HTMLDivElement | null;
  progressFill: HTMLDivElement | null;
  progressPercent: HTMLSpanElement | null;
  waves: HTMLDivElement | null;
}

interface CloudScreenProps {
  isBooted: boolean;
}

export const CloudScreen = forwardRef<CloudScreenHandle, CloudScreenProps>(
  ({ isBooted }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const flashLineRef = useRef<HTMLDivElement>(null);
    const bgRef = useRef<HTMLDivElement>(null);
    const frameRef = useRef<HTMLDivElement>(null);
    const dotsRef = useRef<HTMLDivElement>(null);
    const titleRef = useRef<HTMLDivElement>(null);
    const subtitleRef = useRef<HTMLDivElement>(null);
    const cloudIconRef = useRef<HTMLDivElement>(null);
    const progressFillRef = useRef<HTMLDivElement>(null);
    const progressPercentRef = useRef<HTMLSpanElement>(null);
    const wavesRef = useRef<HTMLDivElement>(null);
    const prevBootedRef = useRef(isBooted);

    useEffect(() => {
      if (isBooted) {
        if (prevBootedRef.current) {
          // Si al montar o re-entrar isBooted ya es true, mostrar el estado final directo sin animar
          if (bgRef.current) gsap.set(bgRef.current, { opacity: 1, filter: 'none' });
          if (frameRef.current) gsap.set(frameRef.current, { autoAlpha: 1, scale: 1 });
          if (dotsRef.current) gsap.set(dotsRef.current, { autoAlpha: 1, scale: 1 });
          if (titleRef.current) gsap.set(titleRef.current, { autoAlpha: 1, y: 0 });
          if (subtitleRef.current) gsap.set(subtitleRef.current, { autoAlpha: 1, y: 0 });
          if (cloudIconRef.current) gsap.set(cloudIconRef.current, { autoAlpha: 1, scale: 1 });
          if (progressFillRef.current) gsap.set(progressFillRef.current, { width: '100%' });
          if (progressPercentRef.current) progressPercentRef.current.innerText = '100 %';
          if (wavesRef.current) gsap.set(wavesRef.current, { autoAlpha: 1, y: 0 });
          if (flashLineRef.current) gsap.set(flashLineRef.current, { opacity: 0 });
        }
        prevBootedRef.current = true;
      } else {
        prevBootedRef.current = false;
      }
    }, [isBooted]);

    useEffect(() => {
      const updateAnimState = () => {
        if (!containerRef.current) return;
        const isPaused = sceneStore.get().scene >= 4;
        const animEls = containerRef.current.querySelectorAll<HTMLElement>(
          '.cloud-status-dot, .cloud-wave-path--primary, .cloud-wave-path--secondary'
        );
        animEls.forEach((el) => {
          el.style.animationPlayState = isPaused ? 'paused' : 'running';
        });
      };

      const unsub = sceneStore.subscribe(updateAnimState);
      updateAnimState();

      return () => unsub();
    }, []);

    useImperativeHandle(ref, () => ({
      container: containerRef.current,
      flashLine: flashLineRef.current,
      bg: bgRef.current,
      frame: frameRef.current,
      dots: dotsRef.current,
      title: titleRef.current,
      subtitle: subtitleRef.current,
      cloudIcon: cloudIconRef.current,
      progressFill: progressFillRef.current,
      progressPercent: progressPercentRef.current,
      waves: wavesRef.current,
    }));

    return (
      <div
        id="cloud-screen"
        ref={containerRef}
        className="cloud-screen-container mac-ui"
        style={{
          visibility: isBooted ? 'visible' : 'hidden',
          opacity: isBooted ? 1 : 0,
        }}
        aria-label="Pantalla del nuevo sistema Cloud"
      >
        {/* Línea de destello para la Fase 1 del encendido */}
        <div ref={flashLineRef} className="cloud-screen-flash-line" />

        {/* Fondo atmosférico y grilla tecnológica */}
        <div
          ref={bgRef}
          className="cloud-screen-bg"
          style={{ opacity: isBooted ? 1 : 0 }}
        />
        <div className="cloud-screen-grid" />

        {/* ── BARRA SUPERIOR DEL SISTEMA ─────────────────────────────────── */}
        <div
          ref={frameRef}
          className="cloud-top-bar"
          style={{
            visibility: isBooted ? 'visible' : 'hidden',
            opacity: isBooted ? 1 : 0,
          }}
        >
          {/* 3 Indicadores circulares */}
          <div
            ref={dotsRef}
            className="cloud-window-dots"
            style={{
              visibility: isBooted ? 'visible' : 'hidden',
              opacity: isBooted ? 1 : 0,
            }}
          >
            <span className="cloud-dot cloud-dot--cyan" />
            <span className="cloud-dot cloud-dot--turquoise" />
            <span className="cloud-dot cloud-dot--violet" />
          </div>

          {/* Identificador del sistema — centro de la barra */}
          <div className="cloud-top-bar-label">SYS :: CLOUD-MIGRATION-v2</div>

          {/* Estado de conexión — derecha */}
          <div className="cloud-top-bar-status">
            <span className="cloud-status-dot" />
            ONLINE
          </div>
        </div>

        {/* Línea separadora de barra superior */}
        <div
          className="cloud-top-bar-line"
          style={{ opacity: isBooted ? 1 : 0 }}
        />

        {/* ── CUERPO PRINCIPAL — Dos columnas ───────────────────────────── */}
        <div className="cloud-main-body">

          {/* COLUMNA IZQUIERDA — Textos + Barra de progreso */}
          <div className="cloud-left-col">

            {/* Título principal */}
            <div
              ref={titleRef}
              className="cloud-title"
              style={{
                visibility: isBooted ? 'visible' : 'hidden',
                opacity: isBooted ? 1 : 0,
              }}
            >
              // NUEVO SISTEMA: CLOUD
            </div>

            {/* Subtítulo / Estado de migración */}
            <div
              ref={subtitleRef}
              className="cloud-subtitle"
              style={{
                visibility: isBooted ? 'visible' : 'hidden',
                opacity: isBooted ? 1 : 0,
              }}
            >
              <span>&gt; MIGRACIÓN: EN PROGRESO</span>
              <span className="cloud-cursor" />
            </div>

            {/* Separador sutil */}
            <div className="cloud-divider" style={{ opacity: isBooted ? 0.4 : 0 }} />

            {/* Sección de la barra de progreso */}
            <div className="cloud-progress-section">
              <div className="cloud-progress-label" style={{ opacity: isBooted ? 0.7 : 0 }}>
                TRANSFERENCIA DE DATOS
              </div>
              <div className="cloud-progress-track">
                <div
                  ref={progressFillRef}
                  className="cloud-progress-fill"
                  style={{ width: isBooted ? '100%' : '0%' }}
                />
              </div>
              <div className="cloud-progress-footer">
                <span className="cloud-progress-label" style={{ opacity: isBooted ? 0.55 : 0 }}>
                  COMPLETADO
                </span>
                <span ref={progressPercentRef} className="cloud-progress-percent">
                  {isBooted ? '100 %' : '0 %'}
                </span>
              </div>
            </div>
          </div>

          {/* COLUMNA DERECHA — Ícono de nube */}
          <div
            ref={cloudIconRef}
            className="cloud-right-col"
            style={{
              visibility: isBooted ? 'visible' : 'hidden',
              opacity: isBooted ? 1 : 0,
            }}
          >
            <svg
              className="cloud-icon-svg"
              width="200"
              height="160"
              viewBox="0 0 200 160"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <linearGradient id="cloudGrad" x1="30" y1="30" x2="170" y2="130" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#22e6d8" stopOpacity="0.85" />
                  <stop offset="55%" stopColor="#3dff8a" stopOpacity="0.6" />
                  <stop offset="100%" stopColor="#a56bff" stopOpacity="0.9" />
                </linearGradient>
                <linearGradient id="cloudStrokeGrad" x1="20" y1="20" x2="180" y2="140" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#22e6d8" />
                  <stop offset="50%" stopColor="#3dff8a" />
                  <stop offset="100%" stopColor="#a56bff" />
                </linearGradient>
                <linearGradient id="arrowGrad2" x1="100" y1="130" x2="100" y2="45" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#a56bff" />
                  <stop offset="100%" stopColor="#ffffff" />
                </linearGradient>
                <filter id="cloudGlow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="6" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* Resplandor de fondo del ícono */}
              <ellipse cx="100" cy="95" rx="68" ry="48"
                fill="rgba(34,230,216,0.06)"
                filter="url(#cloudGlow)"
              />

              {/* Silueta de Nube */}
              <path
                d="M60 118H148C165 118 179 104 179 87C179 71.5 167 58.5 152 57.4C149.6 38.2 134.4 23 116 23C100.4 23 87 32.5 82 46.3C79 44.8 75.6 44 72 44C57 44 45 56 45 71C45 85.5 56.4 97.5 71 98"
                stroke="url(#cloudStrokeGrad)"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="url(#cloudGrad)"
                fillOpacity="0.10"
              />

              {/* Flecha ascendente — tallo */}
              <line
                x1="100" y1="132"
                x2="100" y2="58"
                stroke="url(#arrowGrad2)"
                strokeWidth="5.5"
                strokeLinecap="round"
              />
              {/* Flecha ascendente — cabeza */}
              <path
                d="M82 76L100 55L118 76"
                stroke="#ffffff"
                strokeWidth="5.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Pulsos de velocidad */}
              <line x1="88" y1="140" x2="112" y2="140" stroke="#22e6d8" strokeWidth="3.2" strokeLinecap="round" opacity="0.85" />
              <line x1="93" y1="150" x2="107" y2="150" stroke="#a56bff" strokeWidth="2.5" strokeLinecap="round" opacity="0.65" />
            </svg>
          </div>
        </div>

        {/* ── ONDAS DIGITALES INFERIORES ──────────────────────────────────── */}
        <div
          ref={wavesRef}
          className="cloud-waves-container"
          style={{
            visibility: isBooted ? 'visible' : 'hidden',
            opacity: isBooted ? 1 : 0,
          }}
        >
          <svg
            width="100%"
            height="100%"
            viewBox="0 0 960 110"
            preserveAspectRatio="none"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient id="waveGradPrimary" x1="0" y1="0" x2="960" y2="0" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#22e6d8" stopOpacity="0.15" />
                <stop offset="20%" stopColor="#22e6d8" stopOpacity="0.9" />
                <stop offset="65%" stopColor="#3dff8a" stopOpacity="0.75" />
                <stop offset="100%" stopColor="#22e6d8" stopOpacity="0.2" />
              </linearGradient>
              <linearGradient id="waveGradSecondary" x1="0" y1="0" x2="960" y2="0" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#a56bff" stopOpacity="0.15" />
                <stop offset="40%" stopColor="#a56bff" stopOpacity="0.7" />
                <stop offset="80%" stopColor="#22e6d8" stopOpacity="0.5" />
                <stop offset="100%" stopColor="#a56bff" stopOpacity="0.15" />
              </linearGradient>
              <linearGradient id="waveAreaGrad2" x1="480" y1="0" x2="480" y2="110" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#22e6d8" stopOpacity="0.10" />
                <stop offset="100%" stopColor="#07090e" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Área semitransparente */}
            <path
              d="M0 65 Q120 30 240 58 T480 48 T720 62 T960 52 L960 110 L0 110 Z"
              fill="url(#waveAreaGrad2)"
            />

            {/* Onda primaria Cian */}
            <path
              className="cloud-wave-path--primary"
              d="M0 65 Q120 30 240 58 T480 48 T720 62 T960 52"
              stroke="url(#waveGradPrimary)"
              strokeWidth="2.5"
              strokeLinecap="round"
            />

            {/* Onda secundaria Violeta */}
            <path
              className="cloud-wave-path--secondary"
              d="M0 78 Q135 88 270 62 T540 72 T810 58 T960 76"
              stroke="url(#waveGradSecondary)"
              strokeWidth="2"
              strokeLinecap="round"
            />

            {/* Línea punteada Esmeralda */}
            <path
              d="M0 52 Q105 72 210 44 T420 62 T630 40 T840 58 T960 46"
              stroke="#3dff8a"
              strokeWidth="1.3"
              strokeDasharray="4 7"
              opacity="0.5"
            />

            {/* Nodos luminosos */}
            <circle cx="240" cy="58" r="4" fill="#22e6d8" filter="drop-shadow(0 0 7px #22e6d8)" />
            <circle cx="480" cy="48" r="4.5" fill="#3dff8a" filter="drop-shadow(0 0 9px #3dff8a)" />
            <circle cx="720" cy="62" r="4" fill="#22e6d8" filter="drop-shadow(0 0 7px #22e6d8)" />
            <circle cx="270" cy="62" r="3.5" fill="#a56bff" filter="drop-shadow(0 0 7px #a56bff)" />
            <circle cx="540" cy="72" r="3.5" fill="#a56bff" filter="drop-shadow(0 0 7px #a56bff)" />
            <circle cx="810" cy="58" r="4" fill="#22e6d8" filter="drop-shadow(0 0 7px #22e6d8)" />
          </svg>
        </div>
      </div>
    );
  }
);
CloudScreen.displayName = 'CloudScreen';
