import { useEffect, useRef } from 'react';
import { ChevronLeft, SlidersHorizontal } from 'lucide-react';
import { AnimatePresence } from 'motion/react';
import * as m from 'motion/react-m';
import { createPortal } from 'react-dom';
import type { EnabledContent } from '@domain';
import { MOTION_TRANSITIONS } from '@web/lib/motion';
import { FactionSelector } from './FactionSelector';
import { FilterBar, type TechFilters } from './FilterBar';
import { PlanetControl } from './PlanetControl';

interface TechControlsDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  enabledContent: EnabledContent;
  currentFactionId: string | null;
  onSelectFaction: (factionId: string | null) => void;
  controlledIds: ReadonlySet<string>;
  onTogglePlanet: (planetId: string) => void;
  filters: TechFilters;
  onFiltersChange: (filters: TechFilters) => void;
}

export function TechControlsDrawer({
  open,
  onOpenChange,
  enabledContent,
  currentFactionId,
  onSelectFaction,
  controlledIds,
  onTogglePlanet,
  filters,
  onFiltersChange,
}: TechControlsDrawerProps) {
  const handleRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!open) return;
    const handle = handleRef.current;
    const focusFrame = requestAnimationFrame(() => drawerRef.current?.focus());
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onOpenChange(false);
        return;
      }
      if (event.key !== 'Tab' || !drawerRef.current) return;

      const focusable = Array.from(
        drawerRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), input:not([disabled]), select:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
        ),
      );
      if (focusable.length === 0) {
        event.preventDefault();
        drawerRef.current.focus();
        return;
      }
      const first = focusable[0]!;
      const last = focusable[focusable.length - 1]!;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      cancelAnimationFrame(focusFrame);
      document.removeEventListener('keydown', handleKeyDown);
      handle?.focus();
    };
  }, [open, onOpenChange]);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <>
      <AnimatePresence initial={false}>
        {open ? (
          <m.button
            key="tech-controls-backdrop"
            type="button"
            aria-label="Close tech controls"
            onClick={() => onOpenChange(false)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={MOTION_TRANSITIONS.route}
            className="fixed inset-0 z-40 cursor-default bg-black/45 backdrop-blur-[1px]"
          />
        ) : null}
      </AnimatePresence>

      <m.div
        initial={false}
        animate={{ x: open ? '0%' : '100%' }}
        transition={MOTION_TRANSITIONS.drawer}
        style={{ willChange: 'transform' }}
        className="fixed inset-y-0 right-0 z-50 w-[min(430px,calc(100vw-3rem))]"
      >
        <button
          ref={handleRef}
          type="button"
          aria-expanded={open}
          aria-controls="tech-controls-drawer"
          aria-label={open ? 'Close tech controls' : 'Open tech controls'}
          onClick={() => onOpenChange(!open)}
          className="pointer-events-auto absolute left-0 top-1/2 z-10 flex min-h-16 w-8 -translate-x-full -translate-y-1/2 items-center justify-center rounded-l-lg border border-r-0 border-primary/40 bg-background/90 text-primary shadow-[-8px_0_22px_-18px_hsl(var(--primary))] backdrop-blur transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <m.span animate={{ rotate: open ? 180 : 0 }} transition={MOTION_TRANSITIONS.state}>
            <ChevronLeft className="h-4 w-4" />
          </m.span>
        </button>

        <aside
          ref={drawerRef}
          id="tech-controls-drawer"
          role={open ? 'dialog' : undefined}
          aria-modal={open ? 'true' : undefined}
          aria-labelledby={open ? 'tech-controls-title' : undefined}
          aria-hidden={!open}
          tabIndex={-1}
          className="pointer-events-auto h-[100dvh] overflow-y-auto border-l border-border/80 bg-background/[0.98] shadow-[-28px_0_70px_-35px_black] outline-none"
        >
          {open ? (
            <div className="flex min-h-full flex-col gap-6 px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-[max(1.25rem,env(safe-area-inset-top))]">
              <header className="flex items-center gap-2 border-b border-border/70 pb-4">
                <SlidersHorizontal className="h-4 w-4 text-primary" />
                <h2
                  id="tech-controls-title"
                  className="font-display text-sm font-semibold uppercase tracking-[0.16em]"
                >
                  Tech controls
                </h2>
              </header>

              <FactionSelector
                enabledContent={enabledContent}
                currentFactionId={currentFactionId}
                onSelect={onSelectFaction}
              />

              <section aria-labelledby="tech-filters-title">
                <h3
                  id="tech-filters-title"
                  className="mb-3 font-display text-xs font-semibold uppercase tracking-[0.16em] text-foreground"
                >
                  Filters
                </h3>
                <FilterBar filters={filters} onChange={onFiltersChange} />
              </section>

              <section
                aria-labelledby="controlled-planets-title"
                className="border-t border-border/70 pt-5"
              >
                <div className="mb-3 flex items-center gap-2">
                  <h3
                    id="controlled-planets-title"
                    className="font-display text-xs font-semibold uppercase tracking-[0.16em] text-foreground"
                  >
                    Planets controlled
                  </h3>
                  {controlledIds.size > 0 ? (
                    <span className="ml-auto text-xs tabular-nums text-muted-foreground">
                      {controlledIds.size}
                    </span>
                  ) : null}
                </div>
                <PlanetControl
                  enabledContent={enabledContent}
                  controlledIds={controlledIds}
                  onToggle={onTogglePlanet}
                />
              </section>
            </div>
          ) : null}
        </aside>
      </m.div>
    </>,
    document.body,
  );
}
