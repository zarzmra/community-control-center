import { query, withTransaction } from "../lib/db";
import type { BotOperation } from "../types/models";

export interface OperationClaimStore {
  claimNext(workerId: string): Promise<BotOperation | null>;
}

export async function claimNextOperation(workerId: string): Promise<BotOperation | null> {
  return withTransaction(async (client) => {
    const selected = await client.query<BotOperation>(`
      SELECT *
      FROM bot_operations
      WHERE status = 'pending'
      ORDER BY created_at ASC
      LIMIT 1
      FOR UPDATE SKIP LOCKED
    `);

    const operation = selected.rows[0];
    if (!operation) {
      return null;
    }

    const updated = await client.query<BotOperation>(`
      UPDATE bot_operations
      SET status = 'claimed',
          claimed_by = $1,
          claimed_at = now(),
          attempt_count = attempt_count + 1,
          updated_at = now()
      WHERE id = $2 AND status = 'pending'
      RETURNING *
    `, [workerId, operation.id]);

    if (!updated.rows[0]) {
      return null;
    }

    return updated.rows[0];
  });
}

export class PostgresOperationClaimStore implements OperationClaimStore {
  async claimNext(workerId: string): Promise<BotOperation | null> {
    return claimNextOperation(workerId);
  }
}

/**
 * Testing/local fallback only. This is not durable and must not be used as a
 * production replacement for PostgreSQL-backed claim semantics.
 */
export class InMemoryOperationClaimStore implements OperationClaimStore {
  private readonly queue: BotOperation[] = [];

  constructor(initialQueue: BotOperation[] = []) {
    this.queue.push(...initialQueue);
  }

  async claimNext(workerId: string): Promise<BotOperation | null> {
    const current = this.queue.shift();
    if (!current) {
      return null;
    }

    return {
      ...current,
      status: "claimed",
      claimed_by: workerId,
      claimed_at: new Date().toISOString(),
      attempt_count: current.attempt_count + 1,
      updated_at: new Date().toISOString(),
    };
  }
}

export async function claimNextOperationWithRepository(
  store: OperationClaimStore,
  workerId: string,
): Promise<BotOperation | null> {
  return store.claimNext(workerId);
}

export async function fetchBotOperationById(id: string): Promise<BotOperation | null> {
  const result = await query<BotOperation>("SELECT * FROM bot_operations WHERE id = $1 LIMIT 1", [id]);
  return result.rows[0] ?? null;
}
