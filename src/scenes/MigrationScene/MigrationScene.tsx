import React, { useRef, useState, useEffect, useCallback, useSyncExternalStore } from 'react';
import gsap from 'gsap';
import { PLATE_WIDTH, PLATE_HEIGHT, MAC_OFFSET_X, getPlateScale, MAC_SCREEN } from '../../config/calibration';
import { MacScreen } from '../../components/MacScreen/MacScreen';
import { CalibMac } from '../../components/MacScreen/CalibMac';
import { sceneStore, applyRig } from '../../animations/rig';
import { getPrefersReducedMotion } from '../../config/motion';
import { CloudScreen, type CloudScreenHandle } from './CloudScreen';
import { StrategiesLayer } from '../StrategiesScene/StrategiesLayer';

export const MigrationScene: React.FC = () => {
  const [scale, setScale] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);
  const promptRef = useRef<HTMLDivElement>(null);
  const cloudScreenRef = useRef<CloudScreenHandle>(null);
  const bootingRef = useRef(false);

  // Suscripción reactiva a sceneStore
  const currentScene = useSyncExternalStore(sceneStore.subscribe, () => sceneStore.get().scene);
  const [isBooted, setIsBooted] = useState(() => sceneStore.get().migrationBooted);

  // Sincronizar si migrationBooted cambia en sceneStore
  useEffect(() => {
    return sceneStore.subscribe(() => {
      if (sceneStore.get().migrationBooted && !isBooted) {
        setIsBooted(true);
      }
    });
  }, [isBooted]);

  // Fase B: estamos en la escena 04 de reposo, transferencia completada y MacBook esperando clic
  const isWaitingClick = currentScene === 3 && !isBooted && !sceneStore.get().migrationBootStarted;

  const updateScale = useCallback(() => {
    setScale(getPlateScale());
  }, []);

  useEffect(() => {
    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, [updateScale]);

  /** Oculta el prompt con fade-out suave */
  const hidePrompt = useCallback(() => {
    if (promptRef.current) {
      gsap.to(promptRef.current, {
        opacity: 0,
        duration: 0.18,
        ease: 'power1.in',
        onComplete() {
          if (promptRef.current) promptRef.current.style.display = 'none';
        },
      });
    }
  }, []);

  /** Dispara la secuencia deliberada de encendido de la MacBook */
  const triggerMacBoot = useCallback(() => {
    if (isBooted || bootingRef.current) return;
    bootingRef.current = true;

    hidePrompt();

    const cs = cloudScreenRef.current;

    // Accesibilidad prefers-reduced-motion
    if (getPrefersReducedMotion()) {
      if (cs) {
        gsap.set(cs.container, { visibility: 'visible', opacity: 1 });
        gsap.set(cs.bg, { opacity: 1 });
        gsap.set(cs.frame, { autoAlpha: 1, scale: 1 });
        gsap.set(cs.dots, { autoAlpha: 1, scale: 1 });
        gsap.set(cs.title, { autoAlpha: 1, y: 0 });
        gsap.set(cs.subtitle, { autoAlpha: 1, y: 0 });
        gsap.set(cs.cloudIcon, { autoAlpha: 1, scale: 1 });
        gsap.set(cs.progressFill, { width: '100%' });
        if (cs.progressPercent) cs.progressPercent.innerText = '100 %';
        gsap.set(cs.waves, { autoAlpha: 1, y: 0 });
        gsap.set(cs.flashLine, { opacity: 0 });
      }
      gsap.set('.mac-floor-glow', { opacity: 1 });
      sceneStore.set({ migrationBootStarted: true, migrationBooted: true });
      setIsBooted(true);
      applyRig();
      return;
    }

    if (!cs) return;

    // ── Secuencia Cinematográfica de Encendido en 4 Fases con GSAP ──────────
    const tl = gsap.timeline({
      defaults: { ease: 'power2.out' },
      onComplete() {
        sceneStore.set({ migrationBooted: true });
        setIsBooted(true);
        applyRig();
      },
    });

    // Estados iniciales en t=0
    gsap.set(cs.container, { visibility: 'visible', opacity: 1 });
    gsap.set(cs.bg, { opacity: 0, filter: 'none' });
    gsap.set(cs.frame, { autoAlpha: 0, scale: 0.98 });
    gsap.set(cs.dots, { autoAlpha: 0, scale: 0.5 });
    gsap.set(cs.title, { autoAlpha: 0, y: -8 });
    gsap.set(cs.subtitle, { autoAlpha: 0, y: -6 });
    gsap.set(cs.cloudIcon, { autoAlpha: 0, scale: 0.8 });
    gsap.set(cs.progressFill, { width: '0%' });
    if (cs.progressPercent) cs.progressPercent.innerText = '0 %';
    gsap.set(cs.waves, { autoAlpha: 0, y: 15 });
    gsap.set(cs.flashLine, { opacity: 0, scaleX: 0, scaleY: 1 });

    // ── FASE 1: ACTIVACIÓN ──────────────────────────────────────────────────
    // Fade suave sobre fondo #04050a
    tl.to(cs.bg, { opacity: 1, duration: 0.4, ease: 'power1.out' }, 0);

    // ── FASE 2: CONSTRUCCIÓN DE LA INTERFAZ ─────────────────────────────────
    // Aparece progresivamente el marco de la ventana
    tl.to(cs.frame, { autoAlpha: 1, scale: 1, duration: 0.38, ease: 'power2.out' }, 0.45);
    // Entran los 3 indicadores circulares en la esquina superior izquierda
    tl.to(cs.dots, { autoAlpha: 1, scale: 1, duration: 0.25, ease: 'back.out(2)' }, 0.60);
    // Aparecen los textos con entrada escalonada
    tl.to(cs.title, { autoAlpha: 1, y: 0, duration: 0.30, ease: 'power2.out' }, 0.70);
    tl.to(cs.subtitle, { autoAlpha: 1, y: 0, duration: 0.28, ease: 'power2.out' }, 0.82);

    // ── FASE 3: ACTIVACIÓN CLOUD ───────────────────────────────────────────
    // El ícono de nube se dibuja y entra progresivamente
    tl.to(cs.cloudIcon, { autoAlpha: 1, scale: 1, duration: 0.40, ease: 'back.out(1.5)' }, 0.95);
    // Resplandor ambiental de piso de la MacBook moderna
    tl.to('.mac-floor-glow', { opacity: 1, duration: 0.60, ease: 'power2.out' }, 1.0);
    // La barra de progreso se llena desde 0 hasta 100 % con contador numérico sincronizado
    const pctProxy = { val: 0 };
    tl.to(cs.progressFill, { width: '100%', duration: 1.25, ease: 'power2.inOut' }, 1.10);
    tl.to(
      pctProxy,
      {
        val: 100,
        duration: 1.25,
        ease: 'power2.inOut',
        onUpdate: () => {
          if (cs.progressPercent) {
            cs.progressPercent.innerText = `${Math.round(pctProxy.val)} %`;
          }
        },
      },
      1.10
    );
    // Las ondas digitales inferiores aparecen y comienzan su movimiento sutil
    tl.to(cs.waves, { autoAlpha: 1, y: 0, duration: 0.50, ease: 'power2.out' }, 1.35);

    // ── FASE 4: ESTADO FINAL ────────────────────────────────────────────────
  }, [isBooted, hidePrompt]);

  const handleInteraction = useCallback(
    (e?: React.SyntheticEvent | Event) => {
      if (e && typeof e.stopPropagation === 'function') {
        e.stopPropagation();
      }
      sceneStore.set({ migrationBootStarted: true });
      triggerMacBoot();
    },
    [triggerMacBoot]
  );

  // Listener global de respaldo cuando isWaitingClick es true (permite clic en laptop o mensaje)
  useEffect(() => {
    if (!isWaitingClick) return;
    const onAction = (e: MouseEvent | TouchEvent | PointerEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && target.closest('header, nav, button, [role="button"]')) {
        return;
      }
      sceneStore.set({ migrationBootStarted: true });
      triggerMacBoot();
    };

    window.addEventListener('click', onAction);
    window.addEventListener('pointerdown', onAction);
    window.addEventListener('touchend', onAction);
    return () => {
      window.removeEventListener('click', onAction);
      window.removeEventListener('pointerdown', onAction);
      window.removeEventListener('touchend', onAction);
    };
  }, [isWaitingClick, triggerMacBoot]);

  // Manejo de persistencia: si ya fue encendida, asegurar prompt oculto
  useEffect(() => {
    if (isBooted || sceneStore.get().migrationBooted) {
      if (!isBooted) setIsBooted(true);
      bootingRef.current = true;
      if (promptRef.current) {
        gsap.set(promptRef.current, { opacity: 0, display: 'none' });
      }
    }
  }, [isBooted]);

  return (
    <section
      id="scene-4"
      className={`absolute inset-0 select-none z-10 ${
        isWaitingClick ? 'pointer-events-auto' : 'pointer-events-none'
      }`}
    >
      {/* Contenedor desplazado horizontalmente en X = +1920px (coordenadas de mundo) */}
      <div
        className={`absolute inset-0 flex items-center justify-center w-full h-full ${
          isWaitingClick ? 'pointer-events-auto' : 'pointer-events-none'
        }`}
        onClick={isWaitingClick ? handleInteraction : undefined}
        onPointerDown={isWaitingClick ? handleInteraction : undefined}
        style={{
          transform: `translateX(${MAC_OFFSET_X}px)`,
        }}
      >
        <div
          className="mac-zoom"
          style={{
            position: 'relative',
            flexShrink: 0,
            width: PLATE_WIDTH * scale,
            height: PLATE_HEIGHT * scale,
            transformOrigin: `${(MAC_SCREEN.l + MAC_SCREEN.w / 2) * 100}% ${(MAC_SCREEN.t + MAC_SCREEN.h / 2) * 100}%`,
          }}
        >
          <div
            ref={containerRef}
            onClick={isWaitingClick ? handleInteraction : undefined}
            onPointerDown={isWaitingClick ? handleInteraction : undefined}
            className="mac-plate select-none"
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              width: PLATE_WIDTH,
              height: PLATE_HEIGHT,
              transform: `scale(${scale})`,
              transformOrigin: '0 0',
              cursor: isWaitingClick ? 'pointer' : 'default',
              pointerEvents: isWaitingClick ? 'auto' : 'none',
            }}
          >
          {/* Resplandor ambiental de piso para la MacBook moderna */}
          <div
            className="mac-floor-glow"
            style={{
              position: 'absolute',
              left: '50%',
              top: '76%',
              width: '1150px',
              height: '180px',
              transform: 'translateX(-50%)',
              background:
                'radial-gradient(ellipse at 50% 0%, rgba(34, 230, 216, 0.40), rgba(165, 107, 255, 0.25) 45%, transparent 70%)',
              filter: 'blur(22px)',
              mixBlendMode: 'screen',
              opacity: 0,
              pointerEvents: 'none',
            }}
          />

          {/* Reflejo difuso en piso */}
          <img
            src="/plates/mac-off-transparent.png"
            alt=""
            aria-hidden="true"
            className="mac-plate--reflection"
            style={{
              position: 'absolute',
              left: 0,
              top: '84%',
              width: '100%',
              transform: 'scaleY(-1)',
              opacity: 0.25,
              filter: 'blur(3px)',
              pointerEvents: 'none',
              WebkitMaskImage: 'linear-gradient(to bottom, rgba(0,0,0,0.45), transparent 38%)',
              maskImage: 'linear-gradient(to bottom, rgba(0,0,0,0.45), transparent 38%)',
            }}
          />

          {/* Plate de la MacBook (hardware completo: marco, teclado, chasis) */}
          <img
            src="/plates/mac-off-transparent.png"
            alt="MacBook Pro moderna"
            onClick={isWaitingClick ? handleInteraction : undefined}
            onPointerDown={isWaitingClick ? handleInteraction : undefined}
            className="mac-plate--off absolute inset-0 w-full h-full object-contain select-none z-10"
            style={{
              cursor: isWaitingClick ? 'pointer' : 'default',
              pointerEvents: isWaitingClick ? 'auto' : 'none',
            }}
          />

          {/* Capa retro-layer para elementos que no pertenecen a la MacBook */}
          <div className="retro-layer" style={{ display: 'none' }} aria-hidden="true" />

          {/* Pantalla nativa Cloud construida íntegramente con React, CSS y SVG */}
          <MacScreen>
            <div id="cloud-screen-wrapper" className="w-full h-full">
              <CloudScreen ref={cloudScreenRef} isBooted={isBooted} />
            </div>
            <StrategiesLayer />
          </MacScreen>

          {typeof window !== 'undefined' && window.location.search.includes('calib') && (
            <CalibMac />
          )}

          {/* Destello sutil y puntual localizado exclusivamente en el puerto USB-C izquierdo */}
          <div
            className="mac-arrival-flash"
            style={{
              position: 'absolute',
              left: '176px',
              top: '614px',
              width: '42px',
              height: '24px',
              transform: 'translate(-50%, -50%)',
              background:
                'radial-gradient(ellipse at 50% 50%, rgba(255, 255, 255, 0.95) 0%, rgba(34, 230, 216, 0.70) 50%, transparent 100%)',
              filter: 'blur(2px)',
              mixBlendMode: 'screen',
              opacity: 0,
              pointerEvents: 'none',
              zIndex: 30,
            }}
          />

          {/* Prompt centrado sobre la MacBook — FASE B: Espera interactiva */}
          {isWaitingClick && (
            <div
              ref={promptRef}
              className="mac-boot-prompt"
              aria-live="polite"
              aria-label="Instrucción de encendido del nuevo sistema"
              onClick={handleInteraction}
              onPointerDown={handleInteraction}
              style={{
                position: 'absolute',
                top: '46%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                textAlign: 'center',
                pointerEvents: 'auto',
                zIndex: 40,
                whiteSpace: 'nowrap',
                cursor: 'pointer',
              }}
            >
              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '17px',
                  fontWeight: 600,
                  color: 'rgba(34, 230, 216, 0.95)',
                  letterSpacing: '0.18em',
                  textShadow: '0 0 14px rgba(34, 230, 216, 0.65)',
                  padding: '10px 22px',
                  borderRadius: '24px',
                  backgroundColor: 'rgba(12, 13, 16, 0.85)',
                  border: '1px solid rgba(34, 230, 216, 0.50)',
                  backdropFilter: 'blur(8px)',
                  boxShadow:
                    '0 0 25px rgba(34, 230, 216, 0.25), inset 0 0 12px rgba(34, 230, 216, 0.12)',
                  transition: 'all 0.2s ease',
                }}
                className="hover:scale-105 active:scale-95 transition-transform"
              >
                HACÉ CLICK PARA INICIAR
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  </section>
  );
};
