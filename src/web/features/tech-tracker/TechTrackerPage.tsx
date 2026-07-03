import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, Globe, Pin } from 'lucide-react';
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
import { StartingTechChoice } from './components/StartingTechChoice';
import { TechTreeGrid } from './components/TechTreeGrid';
import { CATEGORY_ORDER } from './colors';
import type { TechStatus } from './status';
import {
  GAME_KEY,
  useGame,
  useSetFaction,
  useUpdatePins,
  useUpdatePlanets,
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
  const qc = useQueryClient();
  const [focusedTechId, setFocusedTechId] = useState<string | null>(null);
  // On lg+ the setup panels are an overlay drawer that slides in over the full-width board
  // (rather than reflowing it); closed by default so the board owns the viewport on load.
  // Below lg the panels stack above the board in normal flow and this flag is inert.
  const [drawerOpen, setDrawerOpen] = useState(false);

  const [filters, setFilters] = useState<TechFilters>(() => ({
    statuses: new Set<TechStatus>(['available', 'owned', 'locked']),
    categories: new Set<TechCategory>(CATEGORY_ORDER),
    hideOtherFactionTechs: false,
  }));

  useEffect(() => {
    if (!focusedTechId) return;
    const frame = requestAnimationFrame(() => {
      const item = document.getElementById(`tech-${focusedTechId}`);
      if (!item) return;
      item.scrollIntoView({ behavior: 'smooth', block: 'center' });
      item.focus({ preventScroll: true });
      setFocusedTechId(null);
    });
    return () => cancelAnimationFrame(frame);
  }, [focusedTechId]);

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

  const resolve = (ids: readonly string[]): Tech[] =>
    ids.map((id) => techById.get(id)).filter((t): t is Tech => Boolean(t));
  const pinnedTechs = resolve(game.pinnedTechIds);

  const navigateToTech = (tech: Tech) => {
    setFilters((current) => {
      const statuses = new Set(current.statuses);
      const categories = new Set(current.categories);
      statuses.add(statusOf(tech));
      categories.add(tech.category);
      return {
        statuses,
        categories,
        hideOtherFactionTechs: tech.factionId ? false : current.hideOtherFactionTechs,
      };
    });
    setFocusedTechId(tech.id);
  };

  // Apply status / hide-other-factions filters to the catalog. Category selection does not
  // remove techs here — TechTreeGrid dims deselected lanes instead, so the grid keeps its shape.
  const filteredByCategory = new Map<TechCategory, Tech[]>();
  for (const category of CATEGORY_ORDER) {
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

  return (
    <>
      {/* Research spectrum + faction picker share the command strip. */}
      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0 flex-1">
          <h2 className="mb-2 font-display text-xs font-semibold uppercase tracking-[0.16em] text-foreground">
            Research spectrum
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

      <div className="grid gap-5">
        {/* Below lg the setup tools stack above the board in normal flow. At lg+ they detach
            into a fixed overlay drawer on the right edge that slides in over the (full-width)
            board without reflowing it. */}
        <aside
          className={cn(
            'grid gap-4 sm:grid-cols-2 sm:items-start',
            'lg:fixed lg:right-0 lg:top-[72px] lg:bottom-4 lg:z-40 lg:flex lg:w-[340px] lg:grid-cols-1 lg:flex-col lg:gap-4 lg:overflow-y-auto lg:rounded-l-xl lg:border lg:border-r-0 lg:border-border/70 lg:bg-background/95 lg:p-4 lg:shadow-2xl lg:backdrop-blur lg:transition-transform lg:duration-300',
            drawerOpen ? 'lg:translate-x-0' : 'lg:translate-x-[360px]',
          )}
        >
          <Card className="min-w-0 w-full">
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
              <PinnedTray techs={pinnedTechs} onNavigate={navigateToTech} onUnpin={togglePin} />
            </CardContent>
          </Card>

          <Card className="min-w-0 w-full">
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

        {/* Drawer handle: a fixed tab vertically centred on the right edge (lg+ only). It rides
            the drawer's left edge — chevron points into the screen to open, toward the edge to
            close. transition-[right] keeps it glued to the panel as it slides. */}
        <button
          type="button"
          onClick={() => setDrawerOpen((v) => !v)}
          aria-expanded={drawerOpen}
          aria-label={drawerOpen ? 'Hide panels' : 'Show panels'}
          title={drawerOpen ? 'Hide panels' : 'Show panels'}
          className={cn(
            'fixed top-1/2 z-50 hidden -translate-y-1/2 items-center rounded-l-md border border-r-0 border-border/70 bg-card/95 px-1 py-4 text-muted-foreground shadow-lg backdrop-blur transition-[right] duration-300 hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring lg:flex',
            drawerOpen ? 'right-[340px]' : 'right-0',
          )}
        >
          {drawerOpen ? (
            <ChevronRight className="h-5 w-5" />
          ) : (
            <ChevronLeft className="h-5 w-5" />
          )}
        </button>

        {/* Tech catalog — always full width; the drawer overlaps it rather than reflowing it. */}
        <main className="flex min-w-0 flex-col gap-4">
          <FilterBar filters={filters} onChange={setFilters} />

          {anyVisible ? (
            <div className="rounded-lg border border-border/70 bg-card/45 p-4 shadow-[0_18px_44px_-38px_black]">
              <TechTreeGrid
                byCategory={filteredByCategory}
                activeCategories={filters.categories}
                statusOf={statusOf}
                pinnedIds={pinnedIds}
                available={view.available}
                onToggleOwned={toggleOwned}
                onTogglePin={togglePin}
              />
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
