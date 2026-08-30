import { query } from "../lib/db";
import { recordAuditLog } from "../lib/audit";
import type { Bot, BotOperation, BotStatus } from "../types/models";
import type { BotAdapter, BotAdapterResult, RuntimeExecutionSummary } from "./types";

export interface RuntimeManagerDependencies {
  query?: typeof query;
  audit?: typeof recordAuditLog;
}

export class RuntimeManager {
  private readonly dbQuery: typeof query;
  private readonly audit: typeof recordAuditLog;

  constructor(
    private readonly adapter: BotAdapter,
    dependencies: RuntimeManagerDependencies = {},
  ) {
    this.dbQuery = dependencies.query ?? query;
    this.audit = dependencies.audit ?? recordAuditLog;
  }

  async processClaimedOperation(operation: BotOperation): Promise<RuntimeExecutionSummary> {
    const botId = operation.bot_id;
    const communityId = operation.community_id;

    try {
      await this.audit(
        "bot_operation_started",
        `Operación de bot iniciada: ${operation.operation_type} | operation_id=${operation.id}`,
        communityId,
        {
          entityType: "bot",
          entityId: botId,
        },
      );

      await this.setOperationPhase(operation.id, operation.operation_type === "start" ? "starting" : "stopping");
      await this.setOperationRunning(operation.id);

      if (operation.operation_type === "start") {
        const result = await this.adapter.start(botId, communityId, {});
        if (!result.ok) {
          throw new Error(result.message ?? "start failed");
        }
        await this.updateBotStatus(botId, "running");
        await this.completeOperation(operation.id, result);
        await this.audit(
          "bot_operation_completed",
          `Operación de bot completada: ${operation.operation_type} | operation_id=${operation.id}`,
          communityId,
          {
            entityType: "bot",
            entityId: botId,
          },
        );
        return { ok: true, operationId: operation.id, botId, status: "completed", finalState: "running" };
      }

      if (operation.operation_type === "stop") {
        const result = await this.adapter.stop(botId, communityId, {});
        if (!result.ok) {
          throw new Error(result.message ?? "stop failed");
        }
        await this.updateBotStatus(botId, "stopped");
        await this.completeOperation(operation.id, result);
        await this.audit(
          "bot_operation_completed",
          `Operación de bot completada: ${operation.operation_type} | operation_id=${operation.id}`,
          communityId,
          {
            entityType: "bot",
            entityId: botId,
          },
        );
        return { ok: true, operationId: operation.id, botId, status: "completed", finalState: "stopped" };
      }

      if (operation.operation_type === "restart") {
        await this.setOperationPhase(operation.id, "stopping");
        const stopResult = await this.adapter.stop(botId, communityId, {});
        if (!stopResult.ok) {
          throw new Error(stopResult.message ?? "restart stop failed");
        }
        await this.updateBotStatus(botId, "stopped");

        await this.setOperationPhase(operation.id, "starting");
        const startResult = await this.adapter.start(botId, communityId, {});
        if (!startResult.ok) {
          throw new Error(startResult.message ?? "restart start failed");
        }
        await this.updateBotStatus(botId, "running");
        await this.completeOperation(operation.id, startResult);
        await this.audit(
          "bot_operation_completed",
          `Operación de bot completada: ${operation.operation_type} | operation_id=${operation.id}`,
          communityId,
          {
            entityType: "bot",
            entityId: botId,
          },
        );
        return { ok: true, operationId: operation.id, botId, status: "completed", finalState: "running" };
      }

      throw new Error(`Operación no soportada: ${operation.operation_type}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "runtime execution failed";
      await this.failOperation(operation.id, message);
      await this.updateBotStatus(operation.bot_id, "error");
      await this.audit(
        "bot_operation_failed",
        `Operación de bot fallida: ${operation.operation_type} | operation_id=${operation.id} | error=${message}`,
        operation.community_id,
        {
          entityType: "bot",
          entityId: operation.bot_id,
        },
      );
      return { ok: false, operationId: operation.id, botId: operation.bot_id, status: "failed" };
    }
  }

  private async setOperationRunning(operationId: string) {
    await this.dbQuery(
      `UPDATE bot_operations
       SET status = 'running',
           started_at = COALESCE(started_at, now()),
           updated_at = now()
       WHERE id = $1`,
      [operationId],
    );
  }

  private async setOperationPhase(operationId: string, phase: "starting" | "stopping") {
    await this.dbQuery(
      `UPDATE bot_operations
       SET phase = $1,
           updated_at = now()
       WHERE id = $2`,
      [phase, operationId],
    );
  }

  // bot_operations.status tracks the lifecycle of the operation itself.
  // bots.status is the observed runtime state, and desired_status remains the admin intent.
  private async updateBotStatus(botId: string, status: BotStatus) {
    await this.dbQuery(
      `UPDATE bots
       SET status = $1,
           updated_at = now()
       WHERE id = $2`,
      [status, botId],
    );
  }

  private async completeOperation(operationId: string, _result: BotAdapterResult) {
    await this.dbQuery(
      `UPDATE bot_operations
       SET status = 'completed',
           phase = 'none',
           completed_at = now(),
           last_error = NULL,
           updated_at = now()
       WHERE id = $1`,
      [operationId],
    );

    await this.dbQuery(
      `UPDATE bots
       SET last_activity_at = now(),
           last_error = NULL,
           last_error_at = NULL,
           updated_at = now()
       WHERE id = (
         SELECT bot_id FROM bot_operations WHERE id = $1
       )`,
      [operationId],
    );
  }

  private async failOperation(operationId: string, message: string) {
    await this.dbQuery(
      `UPDATE bot_operations
       SET status = 'failed',
           phase = 'none',
           completed_at = NULL,
           last_error = $1,
           updated_at = now()
       WHERE id = $2`,
      [message, operationId],
    );

    await this.dbQuery(
      `UPDATE bots
       SET last_error = $1,
           last_error_at = now(),
           updated_at = now()
       WHERE id = (
         SELECT bot_id FROM bot_operations WHERE id = $2
       )`,
      [message, operationId],
    );
  }
}

export async function processBotOperation(
  operation: BotOperation,
  adapter: BotAdapter,
): Promise<RuntimeExecutionSummary> {
  const runtime = new RuntimeManager(adapter);
  return runtime.processClaimedOperation(operation);
}

export async function readBotRow(botId: string): Promise<Bot | null> {
  const result = await query<Bot>(
    `SELECT * FROM bots WHERE id = $1 LIMIT 1`,
    [botId],
  );
  return result.rows[0] ?? null;
}
