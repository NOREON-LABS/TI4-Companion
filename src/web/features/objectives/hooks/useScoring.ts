import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  addPlayer,
  addVpAdjustment,
  removePlayer,
  removeVpAdjustment,
  saveRevealedObjectives,
  saveVictoryTarget,
  toggleScore,
  updatePlayer,
  type GameState,
  type PlayerInput,
} from '@web/lib/api';
import { GAME_KEY } from '@web/hooks/useGameState';

/**
 * Non-optimistic game mutation: server responds with the authoritative state (it assigns
 * player/adjustment ids and enforces the scoring rules), errors toast the server's message.
 */
function useGameMutation<TVars>(mutationFn: (vars: TVars) => Promise<GameState>) {
  const qc = useQueryClient();
  return useMutation<GameState, Error, TVars>({
    mutationFn,
    onError: (err) => toast.error(err.message),
    onSuccess: (game) => qc.setQueryData(GAME_KEY, game),
  });
}

export function useAddPlayer() {
  return useGameMutation((player: PlayerInput) => addPlayer(player));
}

export function useUpdatePlayer() {
  return useGameMutation(({ id, patch }: { id: number; patch: Partial<PlayerInput> }) =>
    updatePlayer(id, patch),
  );
}

export function useRemovePlayer() {
  return useGameMutation((id: number) => removePlayer(id));
}

/** Replace the revealed publics; `ids` order is the reveal order. */
export function useRevealObjectives() {
  return useGameMutation((ids: string[]) => saveRevealedObjectives(ids));
}

export function useAddAdjustment() {
  return useGameMutation(
    ({ playerId, label, points }: { playerId: number; label: string; points: number }) =>
      addVpAdjustment(playerId, label, points),
  );
}

export function useRemoveAdjustment() {
  return useGameMutation((id: number) => removeVpAdjustment(id));
}

export function useSetVictoryTarget() {
  return useGameMutation((victoryTarget: 10 | 14) => saveVictoryTarget(victoryTarget));
}

/**
 * Optimistic score toggle so the matrix responds instantly to taps; the server re-checks
 * the rules (409 message rolls the cell back with a toast).
 */
export function useToggleScore() {
  const qc = useQueryClient();
  return useMutation<
    GameState,
    Error,
    { playerId: number; objectiveId: string },
    { prev: GameState | undefined }
  >({
    mutationFn: ({ playerId, objectiveId }) => toggleScore(playerId, objectiveId),
    onMutate: async ({ playerId, objectiveId }) => {
      await qc.cancelQueries({ queryKey: GAME_KEY });
      const prev = qc.getQueryData<GameState>(GAME_KEY);
      if (prev) {
        const has = prev.scores.some(
          (s) => s.playerId === playerId && s.objectiveId === objectiveId,
        );
        const scores = has
          ? prev.scores.filter(
              (s) => !(s.playerId === playerId && s.objectiveId === objectiveId),
            )
          : [...prev.scores, { playerId, objectiveId }];
        qc.setQueryData<GameState>(GAME_KEY, { ...prev, scores });
      }
      return { prev };
    },
    onError: (err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(GAME_KEY, ctx.prev);
      toast.error(err.message);
    },
    onSuccess: (game) => qc.setQueryData(GAME_KEY, game),
  });
}
