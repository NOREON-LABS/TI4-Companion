import { useEffect, useRef } from 'react';

export type EffectMode = 'embers' | 'celebration';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  rot: number;
  vr: number;
  shape: 'dot' | 'rect';
}

interface ScreenEffectsProps {
  /** null renders nothing; 'embers' = end-game ambience, 'celebration' = winner confetti. */
  mode: EffectMode | null;
  /** Extra confetti colour (the winner's plastic colour). */
  accentHex?: string;
}

const EMBER_COLORS = ['#fbbf24', '#f97316', '#f59e0b', '#fde68a'];

/**
 * Full-screen ambient particle layer (fixed, pointer-events-none). 'embers' drifts warm
 * sparks up from the bottom while the end game is on; 'celebration' fires confetti bursts
 * for the winner. Skipped entirely under prefers-reduced-motion.
 */
export function ScreenEffects({ mode, accentHex }: ScreenEffectsProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!mode) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const resize = () => {
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
    };
    resize();
    window.addEventListener('resize', resize);

    const rand = (a: number, b: number) => a + Math.random() * (b - a);
    const pick = (colors: string[]) => colors[(Math.random() * colors.length) | 0] ?? '#fbbf24';
    const confettiColors = ['#fbbf24', '#fde68a', '#ffffff', accentHex ?? '#f97316'];
    const particles: Particle[] = [];

    const spawnEmber = () =>
      particles.push({
        x: rand(0, canvas.width),
        y: canvas.height + 10 * dpr,
        vx: rand(-12, 12) * dpr,
        vy: rand(-60, -28) * dpr,
        life: 0,
        maxLife: rand(6, 12),
        size: rand(1, 2.6) * dpr,
        color: pick(EMBER_COLORS),
        rot: 0,
        vr: 0,
        shape: 'dot',
      });

    const burst = (cx: number, cy: number, count: number, speed: number) => {
      for (let i = 0; i < count; i++) {
        const angle = rand(-Math.PI * 0.85, -Math.PI * 0.15); // fan upward
        const velocity = rand(speed * 0.35, speed) * dpr;
        particles.push({
          x: cx,
          y: cy,
          vx: Math.cos(angle) * velocity,
          vy: Math.sin(angle) * velocity,
          life: 0,
          maxLife: rand(2.4, 4.2),
          size: rand(3.5, 7.5) * dpr,
          color: pick(confettiColors),
          rot: rand(0, Math.PI * 2),
          vr: rand(-7, 7),
          shape: 'rect',
        });
      }
    };

    if (mode === 'celebration') {
      burst(canvas.width * 0.15, canvas.height * 0.92, 90, 950);
      burst(canvas.width * 0.85, canvas.height * 0.92, 90, 950);
      burst(canvas.width * 0.5, canvas.height * 0.88, 70, 1050);
    }

    let raf = 0;
    let last = performance.now();
    let emberAccumulator = 0;
    let burstTimer = 0;

    const tick = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (mode === 'embers') {
        // ~8 embers/second on a wide screen, scaled by width.
        emberAccumulator += dt * (canvas.width / dpr / 1400) * 8;
        while (emberAccumulator > 1) {
          spawnEmber();
          emberAccumulator -= 1;
        }
      } else {
        burstTimer += dt;
        if (burstTimer > 2.6) {
          burstTimer = 0;
          burst(rand(canvas.width * 0.2, canvas.width * 0.8), canvas.height * rand(0.8, 0.95), 45, 850);
        }
      }

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        if (!p) continue;
        p.life += dt;
        if (p.life > p.maxLife) {
          particles.splice(i, 1);
          continue;
        }
        if (p.shape === 'rect') {
          p.vy += 420 * dpr * dt; // gravity
          p.vx *= 1 - 0.6 * dt; // drag
          p.rot += p.vr * dt;
        } else {
          p.vx += Math.sin((p.y / dpr + p.life * 40) / 26) * 6 * dpr * dt; // sway
        }
        p.x += p.vx * dt;
        p.y += p.vy * dt;

        const t = p.life / p.maxLife;
        ctx.globalAlpha =
          p.shape === 'dot' ? Math.sin(Math.min(t * Math.PI, Math.PI)) * 0.7 : (1 - t) * 0.95;
        ctx.fillStyle = p.color;
        if (p.shape === 'rect') {
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rot);
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.55);
          ctx.restore();
        } else {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, [mode, accentHex]);

  if (!mode) return null;
  return <canvas ref={canvasRef} aria-hidden="true" className="pointer-events-none fixed inset-0 z-[35] h-full w-full" />;
}
