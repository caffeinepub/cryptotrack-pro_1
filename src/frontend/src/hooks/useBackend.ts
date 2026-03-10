import { useActor } from "./useActor";

export function useBackend() {
  const { actor } = useActor();
  if (!actor) throw new Error("Actor not ready");
  return actor;
}

export function useBackendSafe() {
  const { actor } = useActor();
  return actor;
}
