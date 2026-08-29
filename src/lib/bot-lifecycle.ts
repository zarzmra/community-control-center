import { ApiError } from "@/lib/api";
import type {
  BotDesiredStatus,
  BotOperationType,
  BotStatus,
} from "@/types/models";

export type {
  BotDesiredStatus,
  BotOperationType,
  BotStatus,
} from "@/types/models";

const transitions: Record<BotStatus, readonly BotStatus[]> = {
  draft: ["stopped"],
  stopped: ["starting"],
  starting: ["running", "error"],
  running: ["stopping", "error"],
  stopping: ["stopped", "error"],
  error: ["starting", "stopped"],
};

export function transitionBotStatus(
  current: BotStatus,
  next: BotStatus,
) {
  if (!transitions[current]?.includes(next)) {
    throw new ApiError(409, `No se puede cambiar el bot de ${current} a ${next}.`);
  }
  return next;
}

export function requestedDesiredStatus(action: BotOperationType): BotDesiredStatus {
  if (action === "start") return "running";
  if (action === "stop") return "stopped";
  if (action === "restart") return "running";
  throw new ApiError(400, `Acción de ciclo de vida no soportada: ${action}`);
}

export function requestedLifecycleTransition(
  action: BotOperationType,
  current: BotStatus,
) {
  if (action === "start") {
    if (current === "draft") {
      return transitionBotStatus(current, "stopped");
    }
    return transitionBotStatus(current, "starting");
  }
  if (action === "stop") {
    return transitionBotStatus(current, "stopping");
  }
  if (action === "restart") {
    return transitionBotStatus(current, "stopping");
  }
  throw new ApiError(400, `Acción de ciclo de vida no soportada: ${action}`);
}
