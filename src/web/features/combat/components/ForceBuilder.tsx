import { Minus, Plus } from 'lucide-react';
import { AnimatePresence } from 'motion/react';
import * as m from 'motion/react-m';
import {
  profileFor,
  UNIT_LABELS,
  unitOrderFor,
  upgradeTechId,
  type CombatForce,
  type CombatMode,
  type CombatUnitType,
  type Faction,
} from '@domain';
import { MOTION_TRANSITIONS } from '@web/lib/motion';
import { cn } from '@web/lib/utils';

const UNIT_CODES: Readonly<Record<CombatUnitType, string>> = {
  flagship: 'FS',
  warSun: 'WS',
  dreadnought: 'DN',
  carrier: 'CV',
  cruiser: 'CR',
  destroyer: 'DD',
  fighter: 'FF',
  mech: 'MC',
  infantry: 'GF',
  pds: 'PD',
};

interface ForceBuilderProps {
  side: 'attacker' | 'defender';
  title: string;
  force: CombatForce;
  mode: CombatMode;
  factions: readonly Faction[];
  onChange: (force: CombatForce) => void;
}

export function ForceBuilder({ side, title, force, mode, factions, onChange }: ForceBuilderProps) {
  const upgraded = new Set(force.upgrades);
  const accent = side === 'attacker' ? 'text-sky-300' : 'text-orange-300';
  const accentBorder = side === 'attacker' ? 'border-sky-400/45' : 'border-orange-400/45';

  const setCount = (unit: CombatUnitType, count: number) => {
    onChange({
      ...force,
      units: { ...force.units, [unit]: Math.max(0, Math.min(20, count)) },
    });
  };
  const toggleUpgrade = (unit: CombatUnitType) => {
    const next = new Set(force.upgrades);
    if (next.has(unit)) next.delete(unit);
    else next.add(unit);
    onChange({ ...force, upgrades: [...next] });
  };

  return (
    <section aria-label={title} className="flex min-h-0 min-w-0 flex-col px-3 py-3 lg:px-4">
      <div className="mb-2 flex items-center gap-3">
        <div>
          <div className={cn('font-display text-[10px] font-semibold uppercase tracking-[0.2em]', accent)}>
            {side === 'attacker' ? 'Attacker' : 'Defender'}
          </div>
          <h2 className="font-display text-base font-semibold uppercase tracking-[0.08em]">{title}</h2>
        </div>
        <span className={cn('ml-auto h-2 w-2 rotate-45 border', accentBorder)} />
      </div>

      <label className="sr-only" htmlFor={`${side}-faction`}>
        {title} faction
      </label>
      <select
        id={`${side}-faction`}
        value={force.factionId}
        onChange={(event) => onChange({
          ...force,
          factionId: event.target.value,
          modifiers: { ...force.modifiers, factionAbility: false },
        })}
        className="mb-2 h-10 w-full rounded-md border border-border/90 bg-[#080e19]/90 px-3 text-sm font-semibold text-foreground outline-none transition-colors focus:border-primary/70 focus:ring-1 focus:ring-primary/40"
      >
        {factions.map((faction) => (
          <option key={faction.id} value={faction.id}>
            {faction.name}
          </option>
        ))}
      </select>

      <div className="min-h-0 flex-1 divide-y divide-white/[0.08] overflow-y-auto border-y border-white/[0.12]">
        {unitOrderFor(mode, force.factionId).map((unit) => {
          const count = force.units[unit] ?? 0;
          const canUpgrade = Boolean(upgradeTechId(unit, force.factionId));
          const profile = profileFor(unit, upgraded.has(unit), force.factionId, mode);
          const ability =
            unit === 'pds'
              ? `SC ${profile.spaceCannon ?? '—'}`
              : mode === 'ground' && profile.bombardment
                ? `B ${profile.bombardment}${(profile.bombardmentDice ?? 1) > 1 ? `×${profile.bombardmentDice}` : ''}`
                : profile.combat
                  ? `${profile.combat}+${(profile.combatDice ?? 1) > 1 ? ` ×${profile.combatDice}` : ''}`
                  : 'SUPPORT';

          return (
            <div key={unit} className="grid h-[54px] grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
              <div className="flex min-w-0 items-center gap-2.5">
                <span
                  className={cn(
                    'flex h-8 w-8 shrink-0 items-center justify-center rounded-md border bg-white/[0.025] font-display text-[10px] font-bold tracking-[0.08em]',
                    count > 0 ? cn(accent, accentBorder) : 'border-white/10 text-foreground/50',
                  )}
                >
                  {UNIT_CODES[unit]}
                </span>
                <div className="min-w-0">
                  <div className="truncate text-[13px] font-semibold text-foreground" title={profile.label}>{profile.label}</div>
                  <div className="flex items-center gap-2 text-[10px] font-medium uppercase tracking-[0.12em] text-foreground/55">
                    <span>{ability}</span>
                    {canUpgrade ? (
                      <button
                        type="button"
                        aria-pressed={upgraded.has(unit)}
                        aria-label={`${UNIT_LABELS[unit]} upgrade`}
                        onClick={() => toggleUpgrade(unit)}
                        className={cn(
                          'rounded border px-1.5 py-0.5 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
                          upgraded.has(unit)
                            ? cn('bg-white/[0.08]', accent, accentBorder)
                            : 'border-white/10 text-foreground/45 hover:text-foreground',
                        )}
                      >
                        II
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>

              <div className="flex items-center rounded-md border border-white/[0.12] bg-black/15">
                <m.button
                  type="button"
                  aria-label={`Remove ${UNIT_LABELS[unit]}`}
                  disabled={count === 0}
                  onClick={() => setCount(unit, count - 1)}
                  whileTap={{ scale: 0.9 }}
                  transition={MOTION_TRANSITIONS.tap}
                  className="flex h-10 w-9 items-center justify-center text-foreground/65 disabled:opacity-25"
                >
                  <Minus className="h-3.5 w-3.5" />
                </m.button>
                <span className="relative flex h-10 w-8 items-center justify-center overflow-hidden border-x border-white/[0.1] text-center font-display text-base font-semibold tabular-nums">
                  <AnimatePresence initial={false} mode="popLayout">
                    <m.span
                      key={count}
                      initial={{ opacity: 0, y: count > 0 ? 8 : -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={MOTION_TRANSITIONS.state}
                      className="absolute"
                    >
                      {count}
                    </m.span>
                  </AnimatePresence>
                </span>
                <m.button
                  type="button"
                  aria-label={`Add ${UNIT_LABELS[unit]}`}
                  disabled={count >= 20}
                  onClick={() => setCount(unit, count + 1)}
                  whileTap={{ scale: 0.9 }}
                  transition={MOTION_TRANSITIONS.tap}
                  className="flex h-10 w-9 items-center justify-center text-foreground/75 disabled:opacity-25"
                >
                  <Plus className="h-3.5 w-3.5" />
                </m.button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
