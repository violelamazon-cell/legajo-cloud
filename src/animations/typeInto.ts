
/**
 * Tipeo reversible derivado del progreso (sin setInterval).
 * Funciona con el timeline maestro (scroll) y con timelines por tiempo (boot).
 */
export function typeInto(
  tl: gsap.core.Timeline,
  el: Element,
  text: string,
  at: number,
  dur: number
): void {
  const o = { n: 0 };
  tl.to(
    o,
    {
      n: text.length,
      duration: dur,
      ease: 'none',
      onUpdate() {
        el.textContent = text.slice(0, Math.round(o.n));
      },
      onReverseComplete() {
        el.textContent = '';
      },
    },
    at
  );
}
