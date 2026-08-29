import { query } from "./db";
import type { PoolClient } from "pg";

export type AuditEventType =
  | "community_created"
  | "community_updated"
  | "community_deleted"
  | "channel_created"
  | "channel_updated"
  | "channel_deleted"
  | "bot_created"
  | "bot_updated"
  | "bot_deleted"
  | "automation_created"
  | "automation_updated"
  | "automation_deleted"
  | "user_created"
  | "user_updated"
  | "user_deleted"
  | "membership_created"
  | "membership_updated"
  | "membership_deleted"
  | "bot_started"
  | "bot_stopped"
  | "bot_restarted"
  | "bot_error"
  | "bot_operation_created"
  | "bot_channel_attached"
  | "bot_channel_detached";

/**
 * Records an event in the audit_logs table.
 * Standalone audit failures are reported without changing the business result.
 * Transactional callers receive the error so the enclosing operation can roll back.
 */
export async function recordAuditLog(
  eventType: AuditEventType,
  details: string,
  communityId?: string,
  options: {
    userId?: string;
    entityType?: string;
    entityId?: string;
    client?: PoolClient;
  } = {},
) {
  const execute: (
    text: string,
    values: unknown[],
  ) => Promise<unknown> = options.client
    ? (text, values) => options.client!.query(text, values)
    : (text, values) => query(text, values);

  try {
    await execute(
      `
      INSERT INTO audit_logs (
        event_type,
        details,
        community_id,
        user_id,
        entity_type,
        entity_id
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      `,
      [
        eventType,
        details,
        communityId || null,
        options.userId || null,
        options.entityType || null,
        options.entityId || null,
      ],
    );
  } catch (error) {
    if (options.client) throw error;
    console.error("Failed to record audit log:", error);
  }
}
