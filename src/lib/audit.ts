import { query } from "./db";

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
  | "automation_deleted";

/**
 * Records an event in the audit_logs table.
 * Failure to log does not throw to avoid breaking the main operation.
 */
export async function recordAuditLog(
  eventType: AuditEventType,
  details: string,
  communityId?: string,
) {
  try {
    await query(
      `
      INSERT INTO audit_logs (event_type, details, community_id)
      VALUES ($1, $2, $3)
      `,
      [eventType, details, communityId || null],
    );
  } catch (error) {
    // We log to console but don't throw to prevent interrupting the main transaction
    console.error("Failed to record audit log:", error);
  }
}
