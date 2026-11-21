type TL = gsap.core.Timeline;

export const diagramBuilders = {
  bigbang: (tl: TL) =>
    tl.to('.bb-arrow', { strokeDashoffset: 0, duration: 0.5, ease: 'power2.out' })
      .to('.bb-pulse', { opacity: 1, scale: 1.4, duration: 0.3, yoyo: true, repeat: 1 }, 0.35)
      .to('.bb-old', { opacity: 0.2, scale: 0.88, duration: 0.4 }, 0.35)
      .to('.bb-new', { opacity: 1, scale: 1, duration: 0.45, ease: 'back.out(1.6)' }, 0.45),

  paralelo: (tl: TL) =>
    tl.to('.pr-dot', { x: 140, duration: 1.3, ease: 'power1.inOut' })
      .to('.pr-sync', { opacity: 1, stagger: 0.2, duration: 0.25 }, 0.2),

  strangler: (tl: TL) => {
    tl.to('.st-facade', { opacity: 1, duration: 0.25 });
    [1, 2, 3].forEach((i) => {
      const at = 0.25 + (i - 1) * 0.45;
      tl.to(`.st-link-${i}`, { strokeDashoffset: 0, duration: 0.4 }, at)
        .to(`.st-old-${i}`, { opacity: 0.2, duration: 0.3 }, at + 0.2)
        .to(`.st-new-${i}`, { opacity: 1, scale: 1, duration: 0.35, ease: 'back.out(1.6)' }, at + 0.2);
    });
    return tl;
  },
};
