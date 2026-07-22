import { simulateCombat, type CombatResult, type CombatScenario } from '@domain';

interface CombatWorkerRequest {
  readonly requestId: number;
  readonly scenario: CombatScenario;
}

interface CombatWorkerResponse {
  readonly requestId: number;
  readonly result: CombatResult;
  readonly complete: boolean;
}

interface CombatWorkerScope {
  onmessage: ((event: MessageEvent<CombatWorkerRequest>) => void) | null;
  postMessage(message: CombatWorkerResponse): void;
}

const workerScope = self as unknown as CombatWorkerScope;

workerScope.onmessage = ({ data }) => {
  const checkpoints = [800, 2_500, 6_000] as const;
  for (const iterations of checkpoints) {
    workerScope.postMessage({
      requestId: data.requestId,
      // A shared deterministic dice stream keeps mechanically equivalent
      // scenarios stable. Inactive UI state must not change the forecast.
      result: simulateCombat(data.scenario, iterations),
      complete: iterations === checkpoints[checkpoints.length - 1],
    });
  }
};
