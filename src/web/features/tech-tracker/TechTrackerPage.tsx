import { useMemo, useState, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  activeEntities,
  availablePrerequisites,
  PLANETS,
  researchableTechs,
  TECHS,
  type Tech,
  type TechCategory,
} from '@domain';
import type { GameState } from '@web/lib/api';
import { AvailabilityBar } from './components/AvailabilityBar';
import type { TechFilters } from './components/FilterBar';
import { TechControlsDrawer } from './components/TechControlsDrawer';
import { TechTreeGrid } from './components/TechTreeGrid';
import { UnitUpgradeGrid } from './components/UnitUpgradeGrid';
import { CATEGORY_ORDER } from './colors';
import type { TechStatus } from './status';
import {
  GAME_KEY,
  useGame,
  useSetFaction,
  useUpdatePins,
  useUpdatePlanets,
  useUpdateTechs,
} from '@web/hooks/useGameState';

function toggleInSet(set: ReadonlySet<string>, id: string): string[] {
  const next = new Set(set);
  if (next.has(id)) next.delete(id);
  else next.add(id);
  return [...next];
}

export function TechTrackerPage() {
  const { data: game, isLoading, isError } = useGame();
  const updateTechs = useUpdateTechs();
  const updatePlanets = useUpdatePlanets();
  const setFaction = useSetFaction();
  const updatePins = useUpdatePins();
  const qc = useQueryClient();
  const [controlsOpen, setControlsOpen] = useState(false);
  const [filters, setFilters] = useState<TechFilters>(() => ({
    statuses: new Set<TechStatus>(['available', 'owned', 'locked']),
    categories: new Set<TechCategory>(CATEGORY_ORDER),
    hideOtherFactionTechs: true,
  }));

  const view = useMemo(() => {
    if (!game) return null;
    const enabled = game.enabledContent;
    const techs = activeEntities(TECHS, enabled); // filterByContent + resolveOmega
    const planets = activeEntities(PLANETS, enabled);
    const ownedIds = new Set(game.ownedTechIds);
    const controlledIds = new Set(game.controlledPlanetIds);
    const ownedTechs = techs.filter((t) => ownedIds.has(t.id));
    const controlledPlanets = planets.filter((p) => controlledIds.has(p.id));
    const available = availablePrerequisites(ownedTechs, controlledPlanets);
    const researchableIds = new Set(
      researchableTechs(techs, ownedTechs, controlledPlanets, {
        factionId: game.factionId ?? undefined,
      }).map((t) => t.id),
    );

    const byCategory = new Map<TechCategory, Tech[]>();
    for (const tech of techs) {
      const list = byCategory.get(tech.category) ?? [];
      list.push(tech);
      byCategory.set(tech.category, list);
    }
    return { ownedIds, controlledIds, available, researchableIds, byCategory };
  }, [game]);

  if (isLoading) return <CenteredNote>Loading game…</CenteredNote>;
  if (isError || !game || !view) {
    return <CenteredNote>Couldn’t load the game. Is the API running?</CenteredNote>;
  }

  const pinnedIds = new Set(game.pinnedTechIds);

  const statusOf = (tech: Tech): TechStatus => {
    if (view.ownedIds.has(tech.id)) return 'owned';
    if (view.researchableIds.has(tech.id)) return 'available';
    return 'locked';
  };

  // Compute toggles from the freshest cache (kept current by optimistic updates) so rapid
  // taps build on each other rather than each starting from a stale render snapshot.
  const liveGame = (): GameState => qc.getQueryData<GameState>(GAME_KEY) ?? game;

  const toggleOwned = (id: string) =>
    updateTechs.mutate(toggleInSet(new Set(liveGame().ownedTechIds), id));
  const togglePlanet = (id: string) =>
    updatePlanets.mutate(toggleInSet(new Set(liveGame().controlledPlanetIds), id));
  const togglePin = (id: string) =>
    updatePins.mutate(toggleInSet(new Set(liveGame().pinnedTechIds), id));

  // Apply every filter before layout so disabled tracks disappear instead of leaving dim rows.
  const filteredByCategory = new Map<TechCategory, Tech[]>();
  for (const category of CATEGORY_ORDER) {
    if (!filters.categories.has(category)) continue;
    const techs = (view.byCategory.get(category) ?? [])
      .filter((t) => {
        if (!filters.statuses.has(statusOf(t))) return false;
        if (filters.hideOtherFactionTechs && t.factionId && t.factionId !== game.factionId)
          return false;
        return true;
      })
      .sort((a, b) => a.name.localeCompare(b.name));
    if (techs.length > 0) filteredByCategory.set(category, techs);
  }
  const anyVisible = filteredByCategory.size > 0;
  const unitUpgrades = filteredByCategory.get('unit') ?? [];
  const matrixByCategory = new Map(filteredByCategory);
  matrixByCategory.delete('unit');
  const matrixVisible = matrixByCategory.size > 0;

  return (
      <div className="relative z-10">
        <div className="mb-5 min-w-0">
          <h2 className="mb-2 font-display text-[13px] font-semibold uppercase tracking-[0.15em] text-foreground">
            Research spectrum
          </h2>
          <AvailabilityBar available={view.available} />
        </div>

        <TechControlsDrawer
          open={controlsOpen}
          onOpenChange={setControlsOpen}
          enabledContent={game.enabledContent}
          currentFactionId={game.factionId}
          onSelectFaction={(id) => setFaction.mutate(id)}
          controlledIds={view.controlledIds}
          onTogglePlanet={togglePlanet}
          filters={filters}
          onFiltersChange={setFilters}
        />

        <main className="flex w-full min-w-0 max-w-full flex-col gap-8 overflow-hidden">
          {anyVisible ? (
            <>
              {matrixVisible ? (
                <section aria-labelledby="technology-matrix-title" className="min-w-0 max-w-full overflow-hidden">
                  <h2
                    id="technology-matrix-title"
                    className="mb-3 font-display text-[13px] font-semibold uppercase tracking-[0.15em] text-foreground"
                  >
                    Technology matrix
                  </h2>
                  <TechTreeGrid
                    byCategory={matrixByCategory}
                    statusOf={statusOf}
                    pinnedIds={pinnedIds}
                    available={view.available}
                    onToggleOwned={toggleOwned}
                    onTogglePin={togglePin}
                  />
                </section>
              ) : null}

              <UnitUpgradeGrid
                techs={unitUpgrades}
                statusOf={statusOf}
                pinnedIds={pinnedIds}
                available={view.available}
                onToggleOwned={toggleOwned}
                onTogglePin={togglePin}
              />
            </>
          ) : (
            <p className="rounded-lg border bg-card/40 p-6 text-center text-sm text-muted-foreground">
              No techs match your filters.
            </p>
          )}
        </main>
      </div>
  );
}

function CenteredNote({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-[50vh] items-center justify-center px-4 text-center text-sm text-muted-foreground">
      {children}
    </div>
  );
}
