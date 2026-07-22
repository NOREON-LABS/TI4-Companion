import type { Prerequisites, Tech } from '@domain';
import type { TechStatus } from '../status';
import { TechCard } from './TechCard';

interface UnitUpgradeGridProps {
  techs: readonly Tech[];
  statusOf: (tech: Tech) => TechStatus;
  pinnedIds: ReadonlySet<string>;
  available: Prerequisites;
  onToggleOwned: (id: string) => void;
  onTogglePin: (id: string) => void;
}

/** A fleet-board presentation independent of the color technology tier matrix. */
export function UnitUpgradeGrid({
  techs,
  statusOf,
  pinnedIds,
  available,
  onToggleOwned,
  onTogglePin,
}: UnitUpgradeGridProps) {
  if (techs.length === 0) return null;

  return (
    <section aria-labelledby="unit-upgrades-title">
      <h2
        id="unit-upgrades-title"
        className="mb-3 font-display text-[13px] font-semibold uppercase tracking-[0.15em] text-foreground"
      >
        Unit upgrades
      </h2>

      <div className="relative overflow-hidden rounded-2xl border border-white/[0.09] bg-[#050a14]/70 p-3.5">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-[0.16]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(125,211,252,0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(125,211,252,0.12) 1px, transparent 1px)',
            backgroundSize: '28px 28px',
            maskImage: 'linear-gradient(to bottom, black, transparent 82%)',
            WebkitMaskImage: 'linear-gradient(to bottom, black, transparent 82%)',
          }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-cyan-300/[0.035] to-transparent"
        />

        <div className="relative flex flex-wrap justify-center gap-3">
          {techs.map((tech) => (
            <div
              key={tech.id}
              className="flex min-w-[270px] flex-[1_1_280px] lg:max-w-[calc(33.333%-0.5rem)] xl:max-w-[calc(25%-0.5625rem)]"
            >
              <TechCard
                tech={tech}
                status={statusOf(tech)}
                isPinned={pinnedIds.has(tech.id)}
                available={available}
                variant="unit"
                onToggleOwned={() => onToggleOwned(tech.id)}
                onTogglePin={() => onTogglePin(tech.id)}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
