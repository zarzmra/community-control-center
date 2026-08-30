import { pathToFileURL } from "node:url";
import { recordAuditLog } from "../lib/audit";
import { DummyAdapter } from "./adapters/DummyAdapter";
import { PostgresOperationClaimStore, type OperationClaimStore } from "./operation-claim";
import { processBotOperation } from "./runtime-manager";
import type { BotAdapter } from "./types";

export interface WorkerOptions {
  adapter?: BotAdapter;
  claimStore?: OperationClaimStore;
  workerId?: string;
  pollIntervalMs?: number;
}

export class BotWorker {
  private readonly adapter: BotAdapter;
  private readonly claimStore: OperationClaimStore;
  private readonly workerId: string;
  private readonly pollIntervalMs: number;
  private shutdownRequested = false;
  private timer: NodeJS.Timeout | null = null;

  constructor(options: WorkerOptions = {}) {
    this.adapter = options.adapter ?? new DummyAdapter();
    this.claimStore = options.claimStore ?? new PostgresOperationClaimStore();
    this.workerId = options.workerId ?? crypto.randomUUID();
    this.pollIntervalMs = options.pollIntervalMs ?? Number(process.env.BOT_WORKER_POLL_INTERVAL_MS ?? 2000);
  }

  start() {
    if (this.timer) {
      return this;
    }

    const handleShutdown = (signal: string) => {
      if (this.shutdownRequested) {
        return;
      }
      this.shutdownRequested = true;
      if (this.timer) {
        clearInterval(this.timer);
      }
      process.emitWarning(`Bot worker ${this.workerId} received ${signal}; no new operations will be claimed.`);
    };

    process.on("SIGINT", handleShutdown);
    process.on("SIGTERM", handleShutdown);

    void this.pollOnce();
    this.timer = setInterval(() => {
      if (this.shutdownRequested) {
        return;
      }
      void this.pollOnce();
    }, this.pollIntervalMs);

    return this;
  }

  stop() {
    this.shutdownRequested = true;
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  async pollOnce() {
    if (this.shutdownRequested) {
      return false;
    }

    const operation = await this.claimStore.claimNext(this.workerId);
    if (!operation) {
      return false;
    }

    await recordAuditLog(
      "bot_operation_claimed",
      `Operación reclamada por worker ${this.workerId}: ${operation.operation_type} | operation_id=${operation.id}`,
      operation.community_id,
      {
        entityType: "bot",
        entityId: operation.bot_id,
      },
    );

    try {
      await processBotOperation(operation, this.adapter);
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown worker error";
      await recordAuditLog(
        "bot_operation_failed",
        `Worker ${this.workerId} no pudo procesar la operación ${operation.id}: ${message}`,
        operation.community_id,
        {
          entityType: "bot",
          entityId: operation.bot_id,
        },
      );
      return false;
    }
  }
}

export async function runWorker(options: WorkerOptions = {}) {
  const worker = new BotWorker(options);
  worker.start();
  return worker;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const worker = new BotWorker();
  worker.start();
}
