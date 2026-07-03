import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  fetchGame,
  saveControlledPlanets,
  saveFaction,
  saveOwnedTechs,
  savePins,
  saveQueue,
  type GameState,
} from '@web/lib/api';

export const GAME_KEY = ['game'] as const;

export function useGame() {
  return useQuery({ queryKey: GAME_KEY, queryFn: fetchGame });
}

type IdField = 'ownedTechIds' | 'controlledPlanetIds' | 'pinnedTechIds' | 'queuedTechIds';

/**
 * Optimistic mutation for a list field on the game. Updates the cache immediately so rapid
 * taps build on each other (rather than each computing from a stale base and racing), rolls
 * back with a toast on error, and reconciles with the authoritative server response.
 */
function useGameListMutation(field: IdField, save: (ids: string[]) => Promise<GameState>) {
  const qc = useQueryClient();
  return useMutation<GameState, Error, string[], { prev: GameState | undefined }>({
    mutationFn: save,
    onMutate: async (ids) => {
      await qc.cancelQueries({ queryKey: GAME_KEY });
      const prev = qc.getQueryData<GameState>(GAME_KEY);
      if (prev) qc.setQueryData<GameState>(GAME_KEY, { ...prev, [field]: ids });
      return { prev };
    },
    onError: (_err, _ids, ctx) => {
      if (ctx?.prev) qc.setQueryData(GAME_KEY, ctx.prev);
      toast.error('Couldn’t save your change — reverted.');
    },
    onSuccess: (game) => qc.setQueryData(GAME_KEY, game),
  });
}

export function useUpdateTechs() {
  return useGameListMutation('ownedTechIds', saveOwnedTechs);
}

export function useUpdatePlanets() {
  return useGameListMutation('controlledPlanetIds', saveControlledPlanets);
}

export function useUpdatePins() {
  return useGameListMutation('pinnedTechIds', savePins);
}

export function useUpdateQueue() {
  return useGameListMutation('queuedTechIds', saveQueue);
}

export function useSetFaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (factionId: string) => saveFaction(factionId),
    onError: () => toast.error('Couldn’t set faction.'),
    onSuccess: (game: GameState) => qc.setQueryData(GAME_KEY, game),
  });
}
