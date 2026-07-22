import { useEffect, useRef } from 'react';
import { ChevronLeft, SlidersHorizontal } from 'lucide-react';
import { AnimatePresence } from 'motion/react';
import * as m from 'motion/react-m';
import { createPortal } from 'react-dom';
import { factionCombatOption, type CombatForce, type CombatMode, type CombatModifiers } from '@domain';
import { MOTION_TRANSITIONS } from '@web/lib/motion';
import { cn } from '@web/lib/utils';

type ModifierKey = keyof CombatModifiers;

const MODIFIERS: readonly { key: ModifierKey; label: string; modes: readonly CombatMode[] }[] = [
  { key: 'moraleBoost', label: 'Morale Boost', modes: ['space', 'ground'] },
  { key: 'fighterPrototype', label: 'Fighter Prototype', modes: ['space'] },
  { key: 'shieldsHolding', label: 'Shields Holding', modes: ['space', 'ground'] },
  { key: 'assaultCannon', label: 'Assault Cannon', modes: ['space'] },
  { key: 'plasmaScoring', label: 'Plasma Scoring', modes: ['space', 'ground'] },
  { key: 'antimassDeflectors', label: 'Antimass Deflectors', modes: ['space', 'ground'] },
  { key: 'munitionsReserves', label: 'Munitions Reserves', modes: ['space', 'ground'] },
  { key: 'nebula', label: 'Nebula combat bonus', modes: ['space'] },
];

interface CombatModifiersDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: CombatMode;
  attacker: CombatForce;
  defender: CombatForce;
  onAttackerChange: (force: CombatForce) => void;
  onDefenderChange: (force: CombatForce) => void;
}

export function CombatModifiersDrawer({
  open,
  onOpenChange,
  mode,
  attacker,
  defender,
  onAttackerChange,
  onDefenderChange,
}: CombatModifiersDrawerProps) {
  const handleRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!open) return;
    const handle = handleRef.current;
    const focusFrame = requestAnimationFrame(() => dialogRef.current?.focus());
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onOpenChange(false);
        return;
      }
      if (event.key !== 'Tab' || !dialogRef.current) return;
      const focusable = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>('button:not([disabled]), [tabindex]:not([tabindex="-1"])'),
      );
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!first || !last) return;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      cancelAnimationFrame(focusFrame);
      document.removeEventListener('keydown', onKeyDown);
      handle?.focus();
    };
  }, [open, onOpenChange]);

  if (typeof document === 'undefined') return null;
  const visible = MODIFIERS.filter((modifier) => modifier.modes.includes(mode));
  const factionOptions = [
    { side: 'You', force: attacker, onChange: onAttackerChange, accent: 'sky', label: factionCombatOption(attacker.factionId, mode) },
    { side: 'Them', force: defender, onChange: onDefenderChange, accent: 'orange', label: factionCombatOption(defender.factionId, mode) },
  ].filter((entry) => entry.label);
  const toggle = (side: CombatForce, key: ModifierKey, onChange: (force: CombatForce) => void) =>
    onChange({ ...side, modifiers: { ...side.modifiers, [key]: !side.modifiers[key] } });

  return createPortal(
    <>
      <AnimatePresence initial={false}>
        {open ? (
          <m.button
            type="button"
            aria-label="Close combat modifiers"
            onClick={() => onOpenChange(false)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={MOTION_TRANSITIONS.route}
            className="fixed inset-0 z-40 cursor-default bg-black/50 backdrop-blur-[1px]"
          />
        ) : null}
      </AnimatePresence>
      <m.div
        initial={false}
        animate={{ x: open ? '0%' : '100%' }}
        transition={MOTION_TRANSITIONS.drawer}
        className="fixed inset-y-0 right-0 z-50 w-[min(430px,calc(100vw-3rem))]"
      >
        <button
          ref={handleRef}
          type="button"
          aria-expanded={open}
          aria-controls="combat-modifiers-drawer"
          aria-label={open ? 'Close combat modifiers' : 'Open combat modifiers'}
          onClick={() => onOpenChange(!open)}
          className="absolute left-0 top-1/2 z-10 flex min-h-16 w-8 -translate-x-full -translate-y-1/2 items-center justify-center rounded-l-lg border border-r-0 border-primary/40 bg-background/90 text-primary shadow-[-8px_0_22px_-18px_hsl(var(--primary))] backdrop-blur focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <m.span animate={{ rotate: open ? 180 : 0 }} transition={MOTION_TRANSITIONS.state}>
            <ChevronLeft className="h-4 w-4" />
          </m.span>
        </button>
        <aside
          ref={dialogRef}
          id="combat-modifiers-drawer"
          role={open ? 'dialog' : undefined}
          aria-modal={open ? 'true' : undefined}
          aria-labelledby={open ? 'combat-modifiers-title' : undefined}
          aria-hidden={!open}
          tabIndex={-1}
          className="h-[100dvh] overflow-y-auto border-l border-border/80 bg-background/[0.98] px-5 py-5 shadow-[-28px_0_70px_-35px_black] outline-none"
        >
          {open ? (
            <>
              <header className="mb-4 flex items-center gap-2 border-b border-border/70 pb-4">
                <SlidersHorizontal className="h-4 w-4 text-primary" />
                <h2 id="combat-modifiers-title" className="font-display text-sm font-semibold uppercase tracking-[0.16em]">
                  Combat modifiers
                </h2>
              </header>
              <div className="grid grid-cols-[minmax(0,1fr)_4.5rem_4.5rem] items-end gap-2 border-b border-white/[0.1] pb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-foreground/55">
                <span>Effect</span>
                <span className="text-center text-sky-300">You</span>
                <span className="text-center text-orange-300">Them</span>
              </div>
              <div className="divide-y divide-white/[0.08]">
                {visible.map(({ key, label }) => (
                  <div key={key} className="grid min-h-14 grid-cols-[minmax(0,1fr)_4.5rem_4.5rem] items-center gap-2">
                    <span className="pr-2 text-sm font-medium text-foreground/85">{label}</span>
                    {[
                      { force: attacker, onChange: onAttackerChange, accent: 'sky' },
                      { force: defender, onChange: onDefenderChange, accent: 'orange' },
                    ].map((entry) => (
                      <button
                        key={entry.accent}
                        type="button"
                        aria-pressed={entry.force.modifiers[key]}
                        aria-label={`${label} for ${entry.accent === 'sky' ? 'your force' : 'opponent'}`}
                        onClick={() => toggle(entry.force, key, entry.onChange)}
                        className={cn(
                          'h-9 rounded-md border text-[10px] font-bold uppercase tracking-[0.12em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                          entry.force.modifiers[key]
                            ? entry.accent === 'sky'
                              ? 'border-sky-400/60 bg-sky-400/15 text-sky-200'
                              : 'border-orange-400/60 bg-orange-400/15 text-orange-200'
                            : 'border-white/[0.12] text-foreground/45 hover:text-foreground',
                        )}
                      >
                        {entry.force.modifiers[key] ? 'On' : 'Off'}
                      </button>
                    ))}
                  </div>
                ))}
              </div>
              {factionOptions.length > 0 ? (
                <div className="mt-5 border-t border-white/[0.12] pt-4">
                  <h3 className="mb-2 font-display text-[10px] font-semibold uppercase tracking-[0.16em] text-foreground/55">
                    Faction choices
                  </h3>
                  <div className="divide-y divide-white/[0.08]">
                    {factionOptions.map((entry) => (
                      <div key={`${entry.side}-${entry.label}`} className="flex min-h-14 items-center gap-3">
                        <span className="min-w-0 flex-1 text-sm font-medium text-foreground/85">
                          <span className={entry.accent === 'sky' ? 'mr-2 text-sky-300' : 'mr-2 text-orange-300'}>{entry.side}</span>
                          {entry.label}
                        </span>
                        <button
                          type="button"
                          aria-pressed={entry.force.modifiers.factionAbility}
                          onClick={() => entry.onChange({
                            ...entry.force,
                            modifiers: {
                              ...entry.force.modifiers,
                              factionAbility: !entry.force.modifiers.factionAbility,
                            },
                          })}
                          className={cn(
                            'h-9 w-[4.5rem] rounded-md border text-[10px] font-bold uppercase tracking-[0.12em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                            entry.force.modifiers.factionAbility
                              ? entry.accent === 'sky'
                                ? 'border-sky-400/60 bg-sky-400/15 text-sky-200'
                                : 'border-orange-400/60 bg-orange-400/15 text-orange-200'
                              : 'border-white/[0.12] text-foreground/45 hover:text-foreground',
                          )}
                        >
                          {entry.force.modifiers.factionAbility ? 'On' : 'Off'}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </>
          ) : null}
        </aside>
      </m.div>
    </>,
    document.body,
  );
}
