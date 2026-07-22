import { useEffect, useRef } from 'react';
import { cn } from '@web/lib/utils';

export type EffectMode = 'ambient' | 'ascent' | 'brink' | 'celebration';

interface Star {
  x: number;
  y: number;
  depth: number;
  size: number;
  phase: number;
  color: string;
}

interface Particle {
  x: number;
  y: number;
  px: number;
  py: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  rot: number;
  vr: number;
  kind: 'mote' | 'streak' | 'shard';
}

interface ScreenEffectsProps {
  mode: EffectMode;
  /** The leading player's plastic colour. */
  accentHex?: string;
  /** 0..1 journey toward the victory target. */
  progress?: number;
  /** Progression colour is reserved for the Objectives screen; other tools keep the stars. */
  showProgression?: boolean;
}

const GOLD = ['#fbbf24', '#f59e0b', '#fde68a', '#ffffff'];
const STAR_COLORS = ['#ffffff', '#b9d9ff', '#7dd3fc', '#fde68a'];
const ION_BLUE = { r: 14, g: 165, b: 233 };
const RIFT_VIOLET = { r: 124, g: 58, b: 237 };
const PLASMA_MAGENTA = { r: 219, g: 39, b: 119 };
const VICTORY_GOLD = { r: 250, g: 204, b: 21 };

interface Rgb {
  r: number;
  g: number;
  b: number;
}

function hexToRgb(hex: string): Rgb {
  const normalized = hex.replace('#', '');
  const expanded = normalized.length === 3
    ? normalized.split('').map((value) => value + value).join('')
    : normalized;
  const value = Number.parseInt(expanded, 16);
  if (!Number.isFinite(value)) return ION_BLUE;
  return { r: (value >> 16) & 255, g: (value >> 8) & 255, b: value & 255 };
}

function rgba(color: Rgb, alpha: number): string {
  return `rgba(${color.r}, ${color.g}, ${color.b}, ${Math.max(0, alpha)})`;
}

/**
 * The objective screen's atmosphere. A quiet star field is always present, then energy
 * motes and streaks intensify as the leader approaches the throne. Victory switches to
 * a high-density ceremonial burst. Animation is capped for iPad GPUs and becomes a
 * static star field when the OS requests reduced motion.
 */
export function ScreenEffects({
  mode,
  accentHex = '#38bdf8',
  progress = 0,
  showProgression = true,
}: ScreenEffectsProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const showProgressionRef = useRef(showProgression);

  useEffect(() => {
    showProgressionRef.current = showProgression;
  }, [showProgression]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const dpr = Math.min(window.devicePixelRatio || 1, 1.6);
    const intensity = Math.max(0, Math.min(progress, 1));
    const accentRgb = hexToRgb(accentHex);
    const particles: Particle[] = [];
    let stars: Star[] = [];

    const rand = (min: number, max: number) => min + Math.random() * (max - min);
    const pick = (colors: string[]) => colors[(Math.random() * colors.length) | 0] ?? '#ffffff';
    const createStars = () => {
      const area = (canvas.width / dpr) * (canvas.height / dpr);
      const count = Math.min(150, Math.max(70, Math.round(area / 13_500)));
      const palette = intensity >= 0.7 ? [...STAR_COLORS, ...GOLD, accentHex] : STAR_COLORS;
      stars = Array.from({ length: count }, () => ({
        x: rand(0, canvas.width),
        y: rand(0, canvas.height),
        depth: rand(0.25, 1),
        size: rand(0.35, 1.35) * dpr,
        phase: rand(0, Math.PI * 2),
        color: pick(palette),
      }));
    };

    const resize = () => {
      canvas.width = Math.round(window.innerWidth * dpr);
      canvas.height = Math.round(window.innerHeight * dpr);
      createStars();
    };

    const spawnMote = (energetic = false) => {
      const color = Math.random() > 0.32 ? pick(GOLD) : accentHex;
      const angle = rand(0, Math.PI * 2);
      const originRadius = rand(0, Math.min(canvas.width, canvas.height) * 0.045);
      const speed = rand(energetic ? 72 : 28, energetic ? 190 : 92) * dpr;
      const x = canvas.width * 0.5 + Math.cos(angle) * originRadius;
      const y = canvas.height * 0.5 + Math.sin(angle) * originRadius;
      particles.push({
        x,
        y,
        px: x,
        py: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0,
        maxLife: rand(3.2, 6.6),
        size: rand(0.8, energetic ? 3.2 : 2.1) * dpr,
        color,
        rot: angle,
        vr: 0,
        kind: energetic && Math.random() > 0.58 ? 'streak' : 'mote',
      });
    };

    const burst = (cx: number, cy: number, count: number, speed: number) => {
      const colors = [...GOLD, accentHex, accentHex, '#ffffff'];
      for (let index = 0; index < count; index++) {
        const angle = rand(-Math.PI * 0.94, -Math.PI * 0.06);
        const velocity = rand(speed * 0.32, speed) * dpr;
        particles.push({
          x: cx,
          y: cy,
          px: cx,
          py: cy,
          vx: Math.cos(angle) * velocity,
          vy: Math.sin(angle) * velocity,
          life: 0,
          maxLife: rand(2.8, 5.2),
          size: rand(3.5, 9.5) * dpr,
          color: pick(colors),
          rot: rand(0, Math.PI * 2),
          vr: rand(-8, 8),
          kind: Math.random() > 0.12 ? 'shard' : 'streak',
        });
      }
    };

    const drawStarField = (time: number) => {
      for (const star of stars) {
        const twinkle = reducedMotion ? 0.52 : 0.38 + Math.sin(time * 0.0014 + star.phase) * 0.22;
        ctx.globalAlpha = twinkle * star.depth;
        ctx.fillStyle = star.color;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size * star.depth, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    const drawCircularGlow = (
      cx: number,
      cy: number,
      radius: number,
      color: Rgb,
      alpha: number,
    ) => {
      if (alpha <= 0) return;
      const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
      glow.addColorStop(0, rgba(color, alpha));
      glow.addColorStop(0.32, rgba(color, alpha * 0.72));
      glow.addColorStop(0.68, rgba(color, alpha * 0.24));
      glow.addColorStop(1, rgba(color, 0));
      ctx.fillStyle = glow;
      ctx.fillRect(cx - radius, cy - radius, radius * 2, radius * 2);
    };

    const drawNebulaField = (time: number, visibility: number) => {
      if (visibility <= 0.002) return;
      const ascent = Math.max(0, Math.min(1, (intensity - 0.24) / 0.76));
      const brink = Math.max(0, Math.min(1, (intensity - 0.68) / 0.32));
      const modeBoost = mode === 'celebration' ? 1.35 : mode === 'brink' ? 1.18 : 1;
      const breathe = reducedMotion ? 1 : 0.94 + Math.sin(time * 0.00055) * 0.06;
      const width = canvas.width;
      const height = canvas.height;
      const cx = width * 0.5;
      const cy = height * 0.5;
      const radius = Math.min(width, height) * 0.45 * breathe;

      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      ctx.globalAlpha = visibility;

      // Concentric circular clouds read as one galactic core on every aspect ratio.
      drawCircularGlow(cx, cy, radius, ION_BLUE, 0.14 - intensity * 0.035);
      drawCircularGlow(cx, cy, radius * 0.9, RIFT_VIOLET, (0.055 + ascent * 0.2) * modeBoost);
      drawCircularGlow(cx, cy, radius * 0.68, accentRgb, (0.035 + intensity * 0.16) * modeBoost);
      drawCircularGlow(cx, cy, radius * 0.47, PLASMA_MAGENTA, ascent * 0.1 * modeBoost);
      drawCircularGlow(cx, cy, radius * 0.3, VICTORY_GOLD, ascent * 0.19 * modeBoost);
      drawCircularGlow(cx, cy, radius * 0.13, { r: 255, g: 255, b: 255 }, brink * 0.24);

      ctx.restore();
    };

    const drawParticles = (dt: number, visibility: number) => {
      ctx.globalCompositeOperation = 'lighter';
      for (let index = particles.length - 1; index >= 0; index--) {
        const particle = particles[index];
        if (!particle) continue;
        particle.life += dt;
        if (particle.life > particle.maxLife) {
          particles.splice(index, 1);
          continue;
        }

        particle.px = particle.x;
        particle.py = particle.y;
        if (particle.kind === 'shard') {
          particle.vy += 430 * dpr * dt;
          particle.vx *= 1 - 0.55 * dt;
          particle.rot += particle.vr * dt;
        } else {
          const expansion = 1 + 0.045 * dt;
          particle.vx *= expansion;
          particle.vy *= expansion;
        }
        particle.x += particle.vx * dt;
        particle.y += particle.vy * dt;

        const life = particle.life / particle.maxLife;
        const alpha =
          particle.kind === 'shard' ? Math.pow(1 - life, 0.7) : Math.sin(life * Math.PI);
        ctx.globalAlpha = alpha * (particle.kind === 'mote' ? 0.78 : 0.96) * visibility;
        ctx.fillStyle = particle.color;
        ctx.strokeStyle = particle.color;

        if (particle.kind === 'shard') {
          ctx.save();
          ctx.translate(particle.x, particle.y);
          ctx.rotate(particle.rot);
          ctx.fillRect(-particle.size / 2, -particle.size / 2, particle.size, particle.size * 0.34);
          ctx.restore();
        } else if (particle.kind === 'streak') {
          ctx.lineWidth = Math.max(1, particle.size * 0.38);
          ctx.beginPath();
          ctx.moveTo(particle.px, particle.py);
          ctx.lineTo(particle.x, particle.y);
          ctx.stroke();
        } else {
          ctx.beginPath();
          ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;
    };

    resize();
    window.addEventListener('resize', resize);

    if (mode === 'celebration') {
      burst(canvas.width * 0.08, canvas.height * 0.95, 170, 1120);
      burst(canvas.width * 0.92, canvas.height * 0.95, 170, 1120);
      burst(canvas.width * 0.5, canvas.height * 0.98, 130, 1280);
    } else if (mode === 'ascent' || mode === 'brink') {
      // Enter an already-energised scene instead of making the user wait for the buildup.
      const prewarmCount = mode === 'brink' ? 42 : 16;
      for (let index = 0; index < prewarmCount; index++) {
        spawnMote(mode === 'brink');
        const particle = particles[particles.length - 1];
        if (!particle) continue;
        particle.life = rand(0, particle.maxLife * 0.58);
        particle.x += particle.vx * particle.life;
        particle.y += particle.vy * particle.life;
        particle.px = particle.x - particle.vx * 0.04;
        particle.py = particle.y - particle.vy * 0.04;
      }
    }

    let raf = 0;
    let last = performance.now();
    let particleAccumulator = 0;
    let burstTimer = 0;
    let progressionVisibility = showProgressionRef.current ? 1 : 0;
    let reducedMotionVisibility = -1;

    const tick = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;

      if (reducedMotion) {
        const targetVisibility = showProgressionRef.current ? 1 : 0;
        if (targetVisibility !== reducedMotionVisibility) {
          reducedMotionVisibility = targetVisibility;
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          drawNebulaField(0, targetVisibility);
          drawStarField(0);
          ctx.globalAlpha = 1;
        }
        raf = requestAnimationFrame(tick);
        return;
      }

      const targetVisibility = showProgressionRef.current ? 1 : 0;
      progressionVisibility +=
        (targetVisibility - progressionVisibility) * Math.min(1, dt * 4.5);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      drawNebulaField(now, progressionVisibility);
      drawStarField(now);

      if (mode !== 'celebration') {
        const rate = mode === 'brink' ? 22 : mode === 'ascent' ? 10 : 0;
        particleAccumulator += dt * rate * Math.max(0.55, canvas.width / dpr / 1200);
        while (particleAccumulator >= 1 && particles.length < 260) {
          spawnMote(mode === 'brink');
          particleAccumulator -= 1;
        }
      } else {
        burstTimer += dt;
        if (burstTimer > 1.55) {
          burstTimer = 0;
          burst(
            rand(canvas.width * 0.12, canvas.width * 0.88),
            canvas.height * rand(0.88, 1),
            85,
            980,
          );
        }
      }

      drawParticles(dt, progressionVisibility);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, [mode, accentHex, progress]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={cn(
        'pointer-events-none fixed inset-0 h-[100dvh] w-screen mix-blend-screen',
        mode === 'celebration' ? 'z-[90]' : 'z-[5]',
        mode === 'ambient' && 'opacity-90',
      )}
    />
  );
}
