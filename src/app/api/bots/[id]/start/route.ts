import { NextResponse } from "next/server";
import { query, withTransaction } from "@/lib/db";
import { recordAuditLog } from "@/lib/audit";
import { ApiError, apiErrorResponse, requireUuid } from "@/lib/api";
import { requireCommunityAdmin } from "@/lib/authorization";
import {
  requestedDesiredStatus,
  requestedLifecycleTransition,
  type BotDesiredStatus,
  type BotOperationType,
  type BotStatus,
} from "@/lib/bot-lifecycle";
import type { Bot, BotOperation } from "@/types/models";

type Context = { params: Promise<{ id: string }> };

type BotRow = Bot & { desired_status: BotDesiredStatus };

function getCorrelationId(request: Request) {
  const value = request.headers.get("x-correlation-id")?.trim();
  return value && value.length > 0 ? value : crypto.randomUUID();
}

export async function POST(request: Request, { params }: Context) {
  try {
    const { id } = await params;
    requireUuid(id, "El ID del bot");
    const correlationId = getCorrelationId(request);

    const result = await query<{ name: string; community_id: string; status: BotStatus; desired_status: BotDesiredStatus }>(
      "SELECT name, community_id, status, desired_status FROM bots WHERE id = $1",
      [id],
    );
    const bot = result.rows[0];
    if (!bot) throw new ApiError(404, "El bot no existe.");

    const session = await requireCommunityAdmin(bot.community_id);
    const nextStatus = requestedLifecycleTransition("start", bot.status);
    const desiredStatus = requestedDesiredStatus("start");

    const operation = await withTransaction(async (client) => {
      const locked = await client.query<BotRow>(
        `SELECT id, name, community_id, channel_id, description, command_prefix,
                config, status, desired_status, last_error, last_error_at,
                last_activity_at, created_at, updated_at
         FROM bots WHERE id = $1 FOR UPDATE`,
        [id],
      );
      const current = locked.rows[0];
      if (!current) throw new ApiError(404, "El bot no existe.");
      if (current.status !== bot.status) {
        throw new ApiError(409, "El estado del bot cambió; inténtalo de nuevo.");
      }

      const existing = await client.query<BotOperation>(
        `SELECT * FROM bot_operations
         WHERE bot_id = $1 AND correlation_id = $2
         LIMIT 1`,
        [id, correlationId],
      );
      if (existing.rows[0]) {
        return existing.rows[0];
      }

      const active = await client.query<{ id: string }>(
        `SELECT id FROM bot_operations
         WHERE bot_id = $1 AND status IN ('pending', 'claimed', 'running')
         LIMIT 1`,
        [id],
      );
      if (active.rows[0]) {
        throw new ApiError(409, "Ya existe una operación activa para este bot.");
      }

      const inserted = await client.query<BotOperation>(
        `INSERT INTO bot_operations (
          bot_id,
          community_id,
          operation_type,
          phase,
          status,
          requested_by,
          requested_at,
          correlation_id,
          created_at,
          updated_at
        ) VALUES ($1, $2, $3, 'none', 'pending', $4, now(), $5, now(), now())
        RETURNING *`,
        [id, current.community_id, "start" as BotOperationType, session.userId, correlationId],
      );
      const operationRow = inserted.rows[0];

      const updated = await client.query<BotRow>(
        `UPDATE bots
         SET desired_status = $1,
             status = $2,
             updated_at = now()
         WHERE id = $3
         RETURNING id, name, community_id, channel_id, description, command_prefix,
                   config, status, desired_status, last_error, last_error_at,
                   last_activity_at, created_at, updated_at`,
        [desiredStatus, nextStatus, id],
      );

      await recordAuditLog(
        "bot_operation_created",
        `Se registró la operación start para el bot "${current.name}"; correlation_id=${correlationId}; desired_status=${desiredStatus}`,
        current.community_id,
        {
          userId: session.userId,
          entityType: "bot",
          entityId: id,
          client,
        },
      );

      if (!updated.rows[0]) {
        throw new ApiError(409, "El bot cambió mientras se registraba la operación.");
      }

      return operationRow;
    });

    const currentBot = await query<BotRow>(
      `SELECT id, name, community_id, channel_id, description, command_prefix,
              config, status, desired_status, last_error, last_error_at,
              last_activity_at, created_at, updated_at
       FROM bots WHERE id = $1`,
      [id],
    );

    return NextResponse.json({
      ok: true,
      data: {
        bot: currentBot.rows[0],
        operation,
        correlationId,
      },
      message: "La operación de inicio quedó registrada y pendiente de ejecución por un runtime.",
    });
  } catch (error) {
    return apiErrorResponse(error, "No se pudo iniciar el bot.");
  }
}
