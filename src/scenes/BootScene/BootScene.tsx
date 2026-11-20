import React, { useEffect, useRef, useCallback } from 'react';
import gsap from 'gsap';
import { CRTScreen } from '../../components/CRTScreen';
import { Terminal } from '../../components/Terminal';
import { DecisionScene } from '../DecisionScene/DecisionScene';
import { sceneStore } from '../../animations/rig';
import {
  runBootSequence,
  applyBootFinalState,
  type BootElements,
} from '../../animations/bootAnimations';
import { getPrefersReducedMotion } from '../../config/motion';

// Estado de boot persistente en módulo (sobrevive re-renders, no se resetea al volver)
let bootHasRun = false;

export const BootScene: React.FC = () => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const promptRef = useRef<HTMLDivElement>(null);
  const bootTlRef = useRef<gsap.core.Timeline | null>(null);

  /** Extrae los elementos del DOM marcados con data-boot="*" */
  const getBootElements = useCallback((): BootElements | null => {
    const root = terminalRef.current;
    if (!root) return null;

    const flashEl = root.querySelector<HTMLElement>('[data-boot="flash"]');
    const screenEl = root.querySelector<HTMLElement>('[data-boot="screen"]');
    const line0 = root.querySelector<HTMLElement>('[data-boot="line-0"]');
    const line1 = root.querySelector<HTMLElement>('[data-boot="line-1"]');
    const line2 = root.querySelector<HTMLElement>('[data-boot="line-2"]');
    const line3 = root.querySelector<HTMLElement>('[data-boot="line-3"]');
    const cursorEl = root.querySelector<HTMLElement>('[data-boot="cursor"]');

    if (!flashEl || !screenEl || !line0 || !line1 || !line2 || !line3 || !cursorEl) {
      return null;
    }

    return {
      flashEl,
      screenEl,
      lineEls: [line0, line1, line2, line3],
      cursorEl,
    };
  }, []);

  /** Oculta el prompt con fade-out suave y lo saca del flujo para no interceptar eventos */
  const hidePrompt = useCallback(() => {
    if (promptRef.current) {
      gsap.to(promptRef.current, {
        opacity: 0,
        duration: 0.25,
        ease: 'power1.in',
        onComplete() {
          if (promptRef.current) promptRef.current.style.display = 'none';
        },
      });
    }
  }, []);

  /** Dispara la secuencia de boot — solo se ejecuta una vez */
  const triggerBoot = useCallback(() => {
    if (bootHasRun) return;
    bootHasRun = true;

    hidePrompt();

    const els = getBootElements();
    if (!els) return;

    if (getPrefersReducedMotion()) {
      applyBootFinalState(els);
      sceneStore.set({ booted: true });
      return;
    }

    bootTlRef.current = runBootSequence(els);
  }, [getBootElements, hidePrompt]);

  useEffect(() => {
    // Si ya corrió el boot (p.ej. al volver a escena 1), mostrar estado final directo
    if (sceneStore.get().booted || bootHasRun) {
      bootHasRun = true;
      const els = getBootElements();
      if (els) applyBootFinalState(els);
      if (promptRef.current) gsap.set(promptRef.current, { opacity: 0, display: 'none' });
      return;
    }

    // Solo click y touch inician el boot — las teclas (F11, flechas, Escape) no deben dispararlo
    const onClick = () => triggerBoot();
    const onTouch = () => triggerBoot();

    window.addEventListener('click', onClick);
    window.addEventListener('touchstart', onTouch, { passive: true });

    return () => {
      window.removeEventListener('click', onClick);
      window.removeEventListener('touchstart', onTouch);
      // Matar el timeline si está corriendo al desmontar (p.ej. HMR)
      if (bootTlRef.current && bootTlRef.current.isActive()) {
        bootTlRef.current.kill();
      }
    };
  }, [triggerBoot, getBootElements]);

  return (
    <section
      id="scene-1"
      className="absolute inset-0 flex items-center justify-center select-none overflow-hidden"
    >
      {/* Monitor con contenido CRT — alberga las capas intercambiables de la pantalla */}
      <CRTScreen contentWidth={640} contentHeight={480}>
        {/* Capa 1: Terminal de arranque (Escena 01) */}
        <div id="boot-terminal-layer" className="absolute inset-0 w-full h-full z-10">
          <Terminal ref={terminalRef} />
        </div>

        {/* Capa 2: Matriz de decisión (Escena 02 — proyectada sobre el mismo cristal CRT) */}
        <DecisionScene />

        {/* Prompt centrado dentro del área CRT (640×480) — desaparece al hacer clic */}
        <div
          ref={promptRef}
          className="boot-prompt"
          aria-live="polite"
          aria-label="Instrucción de inicio"
          style={{
            position: 'absolute',
            top: '58%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
            pointerEvents: 'none',
            zIndex: 22,
            whiteSpace: 'nowrap',
          }}
        >
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '19px',
              color: 'rgba(61, 255, 138, 0.80)',
              letterSpacing: '0.18em',
              textShadow: '0 0 10px rgba(61,255,138,0.55)',
            }}
          >
            HACÉ CLICK PARA INICIAR
          </span>
        </div>
      </CRTScreen>
    </section>
  );
};
