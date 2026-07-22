import type { ReactNode } from 'react';
import { LazyMotion, MotionConfig } from 'motion/react';

const loadMotionFeatures = () =>
  import('@web/lib/motion-features').then((module) => module.default);

export function AppMotionProvider({ children }: { children: ReactNode }) {
  return (
    <LazyMotion features={loadMotionFeatures} strict>
      <MotionConfig
        reducedMotion="user"
        transition={{ type: 'spring', stiffness: 420, damping: 40, mass: 0.9 }}
      >
        {children}
      </MotionConfig>
    </LazyMotion>
  );
}
