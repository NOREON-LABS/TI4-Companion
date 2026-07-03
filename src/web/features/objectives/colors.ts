import type { PlayerColor } from '@domain';

/** Static Tailwind classes per TI4 plastic colour (dark-theme friendly). */
export const PLAYER_COLOR_CLASSES: Record<
  PlayerColor,
  { dot: string; text: string; ring: string }
> = {
  red: { dot: 'bg-red-500', text: 'text-red-400', ring: 'ring-red-500' },
  blue: { dot: 'bg-sky-500', text: 'text-sky-400', ring: 'ring-sky-500' },
  green: { dot: 'bg-emerald-500', text: 'text-emerald-400', ring: 'ring-emerald-500' },
  yellow: { dot: 'bg-yellow-400', text: 'text-yellow-300', ring: 'ring-yellow-400' },
  purple: { dot: 'bg-purple-500', text: 'text-purple-400', ring: 'ring-purple-500' },
  black: { dot: 'bg-zinc-600', text: 'text-zinc-300', ring: 'ring-zinc-500' },
  orange: { dot: 'bg-orange-500', text: 'text-orange-400', ring: 'ring-orange-500' },
  pink: { dot: 'bg-pink-400', text: 'text-pink-300', ring: 'ring-pink-400' },
};

/** Narrow a persisted colour string to a known PlayerColor (defensive default: red). */
export function playerColorOf(color: string): PlayerColor {
  return color in PLAYER_COLOR_CLASSES ? (color as PlayerColor) : 'red';
}
