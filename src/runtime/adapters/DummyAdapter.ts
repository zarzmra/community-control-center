import type { BotAdapter, BotAdapterHealth, BotAdapterResult, BotRuntimeState } from "../types";

export class DummyAdapter implements BotAdapter {
  private readonly states = new Map<string, BotRuntimeState>();

  private readonly now = () => new Date().toISOString();

  private getState(botId: string): BotRuntimeState {
    return this.states.get(botId) ?? "stopped";
  }

  async start(botId: string, _communityId: string, _config?: Record<string, unknown>): Promise<BotAdapterResult> {
    this.states.set(botId, "running");
    return {
      ok: true,
      state: "running",
      message: `Bot ${botId} arrancado por DummyAdapter`,
      startedAt: this.now(),
    };
  }

  async stop(botId: string, _communityId: string, _config?: Record<string, unknown>): Promise<BotAdapterResult> {
    this.states.set(botId, "stopped");
    return {
      ok: true,
      state: "stopped",
      message: `Bot ${botId} detenido por DummyAdapter`,
      stoppedAt: this.now(),
    };
  }

  async restart(botId: string, communityId: string, config?: Record<string, unknown>): Promise<BotAdapterResult> {
    this.states.set(botId, "stopped");
    const stopResult = await this.stop(botId, communityId, config);
    if (!stopResult.ok) {
      return stopResult;
    }
    const startResult = await this.start(botId, communityId, config);
    return {
      ok: startResult.ok,
      state: startResult.state,
      message: `Bot ${botId} reiniciado por DummyAdapter`,
      startedAt: startResult.startedAt,
      stoppedAt: stopResult.stoppedAt,
    };
  }

  async health(botId: string, _communityId: string): Promise<BotAdapterHealth> {
    const state = this.getState(botId);
    return {
      state,
      healthy: state === "running",
      message: state === "running"
        ? `Bot ${botId} operativo`
        : `Bot ${botId} en estado ${state}`,
    };
  }
}
