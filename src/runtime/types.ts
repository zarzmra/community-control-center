export type BotRuntimeState = "stopped" | "running" | "error";

export interface BotAdapterResult {
  ok: boolean;
  state: BotRuntimeState;
  message?: string;
  startedAt?: string;
  stoppedAt?: string;
}

export interface BotAdapterHealth {
  state: BotRuntimeState;
  healthy: boolean;
  message?: string;
}

export interface BotAdapter {
  start(botId: string, communityId: string, config?: Record<string, unknown>): Promise<BotAdapterResult>;
  stop(botId: string, communityId: string, config?: Record<string, unknown>): Promise<BotAdapterResult>;
  restart(botId: string, communityId: string, config?: Record<string, unknown>): Promise<BotAdapterResult>;
  health(botId: string, communityId: string): Promise<BotAdapterHealth>;
}

export interface RuntimeExecutionSummary {
  ok: boolean;
  operationId: string;
  botId: string;
  status: "completed" | "failed";
  finalState?: BotRuntimeState;
}
