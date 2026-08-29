import { NextResponse } from "next/server";
import { query, withTransaction } from "@/lib/db";
import { recordAuditLog } from "@/lib/audit";
import {
  ApiError,
  apiErrorResponse,
  readJsonBody,
  requireEnum,
  requireAllowedKeys,
  requireJsonObject,
  requireString,
  requireUuid,
} from "@/lib/api";
import { requireCommunityAccess, requireCommunityAdmin } from "@/lib/authorization";
import type { BotDesiredStatus, BotStatus } from "@/lib/bot-lifecycle";

type Bot = {
  id: string;
  name: string;
  community_id: string;
  channel_id: string | null;
  description: string;
  command_prefix: string;
  config: Record<string, unknown>;
  status: BotStatus;
  desired_status: BotDesiredStatus;
  last_error: string | null;
  last_error_at: string | null;
  last_activity_at: string | null;
  created_at: string;
  updated_at: string;
};
type RouteContext = { params: Promise<{ id: string }> };

const statuses = ["draft", "stopped", "starting", "running", "stopping", "error"] as const;

async function findBot(id: string) {
  const result = await query<Bot>(
    `SELECT id, name, community_id, channel_id, description, command_prefix,
            config, status, desired_status, last_error, last_error_at, last_activity_at,
            created_at, updated_at
     FROM bots WHERE id = $1`,
    [id],
  );
  const bot = result.rows[0];
  if (!bot) throw new ApiError(404, "El bot no existe.");
  return bot;
}

async function validateChannel(channelId: string, communityId: string) {
  const result = await query<{ community_id: string }>(
    "SELECT community_id FROM channels WHERE id = $1",
    [channelId],
  );
  if (!result.rows[0]) throw new ApiError(404, "El canal no existe.");
  if (result.rows[0].community_id !== communityId) {
    throw new ApiError(403, "El canal no pertenece a la comunidad.");
  }
}

export async function GET(_request: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    requireUuid(id, "El ID del bot");
    const bot = await findBot(id);
    await requireCommunityAccess(bot.community_id);
    return NextResponse.json({ ok: true, data: bot });
  } catch (error) {
    return apiErrorResponse(error, "No se pudo cargar el bot.");
  }
}

export async function PUT(request: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    requireUuid(id, "El ID del bot");
    const bot = await findBot(id);
    const session = await requireCommunityAdmin(bot.community_id);
    const body = requireJsonObject(await readJsonBody<unknown>(request), "El cuerpo", 20_000);
    requireAllowedKeys(body, [
      "name", "communityId", "channelId", "description",
      "commandPrefix", "config", "status",
    ]);
    const input = body as {
      name?: unknown;
      communityId?: unknown;
      channelId?: unknown;
      description?: unknown;
      commandPrefix?: unknown;
      config?: unknown;
      status?: unknown;
    };
    const name = input.name === undefined ? bot.name : requireString(input.name, "El nombre", { max: 200 });
    const communityId = input.communityId === undefined
      ? bot.community_id
      : requireUuid(input.communityId, "El ID de la comunidad");
    await requireCommunityAdmin(communityId);
    const channelId =
      input.channelId === undefined ? bot.channel_id :
        input.channelId === null || input.channelId === "" ? null :
          requireUuid(input.channelId, "El ID del canal");
    if (channelId) await validateChannel(channelId, communityId);
    const description = input.description === undefined ? bot.description :
      requireString(input.description, "La descripción", { min: 0, max: 5000 });
    const commandPrefix = input.commandPrefix === undefined ? bot.command_prefix :
      requireString(input.commandPrefix, "El prefijo", { min: 1, max: 20 });
    const config = input.config === undefined ? bot.config :
      requireJsonObject(input.config, "La configuración");
    const status = input.status === undefined ? bot.status :
      requireEnum(input.status, "El estado", statuses);
    if (status !== bot.status) {
      throw new ApiError(409, "Usa los endpoints de ciclo de vida para cambiar el estado del bot.");
    }
    const updated = await withTransaction(async (client) => {
      const result = await client.query<Bot>(
        `UPDATE bots
         SET name = $1, community_id = $2, channel_id = $3, description = $4,
             command_prefix = $5, config = $6::jsonb, updated_at = now()
         WHERE id = $7 AND community_id = $8
         RETURNING id, name, community_id, channel_id, description, command_prefix,
                   config, status, desired_status, last_error, last_error_at, last_activity_at,
                   created_at, updated_at`,
        [name, communityId, channelId, description, commandPrefix, JSON.stringify(config), id, bot.community_id],
      );
      if (!result.rows[0]) {
        throw new ApiError(409, "El bot cambió mientras se actualizaba; inténtalo de nuevo.");
      }
      const changed = result.rows[0];
      await recordAuditLog("bot_updated", `Se actualizó el bot "${changed.name}"`, changed.community_id, {
        userId: session.userId, entityType: "bot", entityId: id, client,
      });
      if (!bot.channel_id && changed.channel_id) {
        await recordAuditLog("bot_channel_attached", `Se asoció el bot "${changed.name}" a un canal`, changed.community_id, {
          userId: session.userId, entityType: "bot", entityId: id, client,
        });
      } else if (bot.channel_id && !changed.channel_id) {
        await recordAuditLog("bot_channel_detached", `Se desvinculó el bot "${changed.name}" de un canal`, bot.community_id, {
          userId: session.userId, entityType: "bot", entityId: id, client,
        });
      } else if (bot.channel_id && changed.channel_id && bot.channel_id !== changed.channel_id) {
        await recordAuditLog("bot_channel_detached", `Se desvinculó el bot "${changed.name}" de un canal`, bot.community_id, {
          userId: session.userId, entityType: "bot", entityId: id, client,
        });
        await recordAuditLog("bot_channel_attached", `Se asoció el bot "${changed.name}" a un canal`, changed.community_id, {
          userId: session.userId, entityType: "bot", entityId: id, client,
        });
      }
      return changed;
    });
    return NextResponse.json({ ok: true, data: updated });
  } catch (error) {
    return apiErrorResponse(error, "No se pudo actualizar el bot.");
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  return PUT(request, context);
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    requireUuid(id, "El ID del bot");
    const bot = await findBot(id);
    const session = await requireCommunityAdmin(bot.community_id);
    await withTransaction(async (client) => {
      await client.query("DELETE FROM bots WHERE id = $1", [id]);
      await recordAuditLog("bot_deleted", `Se eliminó el bot "${bot.name}"`, bot.community_id, {
        userId: session.userId, entityType: "bot", entityId: id, client,
      });
    });
    return NextResponse.json({ ok: true, data: { id } });
  } catch (error) {
    return apiErrorResponse(error, "No se pudo eliminar el bot.");
  }
}
