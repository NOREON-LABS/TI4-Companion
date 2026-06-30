import { useMemo, useState, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Globe, ListOrdered, Pin } from 'lucide-react';
import {
  activeEntities,
  availablePrerequisites,
  FACTIONS,
  PLANETS,
  researchableTechs,
  TECHS,
  type Tech,
  type TechCategory,
} from '@domain';
import { Card, CardContent, CardHeader, CardTitle } from '@web/components/ui/card';
import type { GameState } from '@web/lib/api';
import { cn } from '@web/lib/utils';
import { AvailabilityBar } from './components/AvailabilityBar';
import { FactionSelector } from './components/FactionSelector';
import { FilterBar, type TechFilters } from './components/FilterBar';
import { PinnedTray } from './components/PinnedTray';
import { PlanetControl } from './components/PlanetControl';
import { ResearchQueue, type QueueItem } from './components/ResearchQueue';
import { StartingTechChoice } from './components/StartingTechChoice';
import { TechItem } from './components/TechItem';
import { CATEGORY_ACCENT, CATEGORY_LABEL, CATEGORY_ORDER } from './colors';
import type { TechStatus } from './status';
import {
  GAME_KEY,
  useGame,
  useSetFaction,
  useUpdatePins,
  useUpdatePlanets,
  useUpdateQueue,
  useUpdateTechs,
} from './hooks/useGameState';

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
  const updateQueue = useUpdateQueue();
  const qc = useQueryClient();

  const [filters, setFilters] = useState<TechFilters>(() => ({
    statuses: new Set<TechStatus>(['available', 'owned', 'locked']),
    categories: new Set<TechCategory>(CATEGORY_ORDER),
    hideOtherFactionTechs: false,
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
    const techById = new Map(techs.map((t) => [t.id, t]));

    return { ownedIds, controlledIds, available, researchableIds, byCategory, techById };
  }, [game]);

  if (isLoading) return <CenteredNote>Loading game…</CenteredNote>;
  if (isError || !game || !view) {
    return <CenteredNote>Couldn’t load the game. Is the API running?</CenteredNote>;
  }

  const { techById } = view;
  const pinnedIds = new Set(game.pinnedTechIds);
  const queuedIds = new Set(game.queuedTechIds);
  const currentFaction = game.factionId
    ? (FACTIONS.find((f) => f.id === game.factionId) ?? null)
    : null;

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
  const toggleQueue = (id: string) => {
    const queued = liveGame().queuedTechIds;
    updateQueue.mutate(queued.includes(id) ? queued.filter((x) => x !== id) : [...queued, id]);
  };
  const removeFromQueue = (id: string) =>
    updateQueue.mutate(liveGame().queuedTechIds.filter((x) => x !== id));

  const resolve = (ids: readonly string[]): Tech[] =>
    ids.map((id) => techById.get(id)).filter((t): t is Tech => Boolean(t));
  const pinnedTechs = resolve(game.pinnedTechIds);
  const queueItems: QueueItem[] = resolve(game.queuedTechIds).map((tech) => ({
    tech,
    status: statusOf(tech),
  }));

  // Apply the filter bar to the catalog (status / type / hide other factions' techs).
  const visibleByCategory = new Map<TechCategory, Tech[]>();
  for (const category of CATEGORY_ORDER) {
    if (!filters.categories.has(category)) continue;
    const techs = (view.byCategory.get(category) ?? []).filter((t) => {
      if (!filters.statuses.has(statusOf(t))) return false;
      if (filters.hideOtherFactionTechs && t.factionId && t.factionId !== game.factionId) return false;
      return true;
    });
    if (techs.length > 0) visibleByCategory.set(category, techs);
  }
  const anyVisible = visibleByCategory.size > 0;

  return (
    <>
      {/* Available prerequisites + faction picker share a row. */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Available prerequisites
          </h2>
          <AvailabilityBar available={view.available} />
        </div>
        <FactionSelector
          enabledContent={game.enabledContent}
          currentFactionId={game.factionId}
          onSelect={(id) => setFaction.mutate(id)}
        />
      </div>

      {currentFaction ? (
        <StartingTechChoice
          faction={currentFaction}
          ownedIds={view.ownedIds}
          techById={techById}
          onToggleTech={toggleOwned}
        />
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        {/* Single-column + roomy through tablet (iPad is the primary device); the right rail
            and multi-column tech grid only kick in on a true desktop (xl, >=1280px). */}
        <aside className="grid gap-4 sm:grid-cols-2 sm:items-start xl:sticky xl:top-6 xl:col-start-2 xl:row-start-1 xl:flex xl:flex-col xl:self-start">
          <Card>
            <CardHeader className="p-4 pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <ListOrdered className="h-4 w-4 text-primary" />
                Research queue
                {queueItems.length > 0 ? (
                  <span className="ml-auto text-xs font-normal tabular-nums text-muted-foreground">
                    {queueItems.length}
                  </span>
                ) : null}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <ResearchQueue
                items={queueItems}
                onReorder={(ids) => updateQueue.mutate(ids)}
                onRemove={removeFromQueue}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="p-4 pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Pin className="h-4 w-4 text-primary" />
                Pinned
                {pinnedTechs.length > 0 ? (
                  <span className="ml-auto text-xs font-normal tabular-nums text-muted-foreground">
                    {pinnedTechs.length}
                  </span>
                ) : null}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <PinnedTray techs={pinnedTechs} onUnpin={togglePin} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="p-4 pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Globe className="h-4 w-4 text-primary" />
                Planets controlled
                {view.controlledIds.size > 0 ? (
                  <span className="ml-auto text-xs font-normal tabular-nums text-muted-foreground">
                    {view.controlledIds.size}
                  </span>
                ) : null}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <PlanetControl
                enabledContent={game.enabledContent}
                controlledIds={view.controlledIds}
                onToggle={togglePlanet}
              />
            </CardContent>
          </Card>
        </aside>

        {/* Tech catalog */}
        <main className="flex flex-col gap-4 xl:col-start-1 xl:row-start-1">
          <FilterBar filters={filters} onChange={setFilters} />

          {anyVisible ? (
            // Single column on phone + iPad portrait (roomy rows); two columns from iPad
            // landscape up, where there's width for ~490px columns.
            <div className="grid gap-4 lg:grid-cols-2">
              {CATEGORY_ORDER.map((category) => {
                const techs = visibleByCategory.get(category);
                if (!techs) return null;
                return (
                  <Card key={category}>
                    <CardHeader className="p-4 pb-2">
                      <CardTitle className="flex items-center gap-2 text-sm">
                        <span
                          className={cn('h-2.5 w-2.5 rounded-full', CATEGORY_ACCENT[category].dot)}
                        />
                        {CATEGORY_LABEL[category]}
                        <span className="ml-auto text-xs font-normal tabular-nums text-muted-foreground">
                          {techs.length}
                        </span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-2 p-4 pt-0">
                      {techs.map((tech) => (
                        <TechItem
                          key={tech.id}
                          tech={tech}
                          status={statusOf(tech)}
                          isPinned={pinnedIds.has(tech.id)}
                          isQueued={queuedIds.has(tech.id)}
                          onToggleOwned={() => toggleOwned(tech.id)}
                          onTogglePin={() => togglePin(tech.id)}
                          onToggleQueue={() => toggleQueue(tech.id)}
                        />
                      ))}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <p className="rounded-lg border bg-card/40 p-6 text-center text-sm text-muted-foreground">
              No techs match your filters.
            </p>
          )}
        </main>
      </div>
    </>
  );
}

function CenteredNote({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-[50vh] items-center justify-center px-4 text-center text-sm text-muted-foreground">
      {children}
    </div>
  );
}
