export const MOTION_TRANSITIONS = {
  tap: { type: 'tween' as const, duration: 0.12, ease: 'easeOut' as const },
  state: { type: 'spring' as const, stiffness: 520, damping: 38, mass: 0.65 },
  drawer: { type: 'spring' as const, stiffness: 420, damping: 40, mass: 0.9 },
  route: { type: 'tween' as const, duration: 0.2, ease: 'easeOut' as const },
  score: { type: 'spring' as const, stiffness: 360, damping: 32, mass: 0.8 },
} as const;
