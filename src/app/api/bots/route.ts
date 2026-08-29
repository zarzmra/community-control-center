import { NextResponse } from "next/server";
import { query, withTransaction } from "@/lib/db";
import { recordAuditLog } from "@/lib/audit";
import {
  ApiError,
  apiErrorResponse,
  parsePagination,
  readJsonBody,
  requireEnum,
  requireAllowedKeys,
  requireJsonObject,
  requireString,
  requireUuid,
} from "@/lib/api";
import {
  requireCommunityAccess,
  requireCommunityAdmin,
  requireSession,
} from "@/lib/authorization";
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

const botStatuses = ["draft", "stopped", "starting", "running", "stopping", "error"] as const;

async function validateChannel(channelId: string, communityId: string) {
  const result = await query<{ id: string; community_id: string }>(
    "SELECT id, community_id FROM channels WHERE id = $1",
    [channelId],
  );
  const channel = result.rows[0];
  if (!channel) throw new ApiError(404, "El canal no existe.");
  if (channel.community_id !== communityId) {
    throw new ApiError(403, "El canal no pertenece a la comunidad.");
  }
}

export async function GET(request: Request) {
  try {
    const context = await requireSession();
    const { limit, offset, page } = parsePagination(request);
    const communityId = new URL(request.url).searchParams.get("communityId");
    if (communityId) {
      requireUuid(communityId, "El ID de la comunidad");
      if (context.role !== "admin") {
        await requireCommunityAccess(communityId);
      }
    }
    const result = await query<Bot>(
      `SELECT id, name, community_id, channel_id, description, command_prefix,
              config, status, desired_status, last_error, last_error_at, last_activity_at,
              created_at, updated_at
       FROM bots
       WHERE ($3::uuid IS NULL OR community_id = $3)
         AND ($4 = 'admin' OR EXISTS (
           SELECT 1 FROM community_memberships cm
           WHERE cm.community_id = bots.community_id AND cm.user_id = $5
         ))
       ORDER BY created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset, communityId, context.role, context.userId],
    );
    return NextResponse.json({
      ok: true,
      data: result.rows,
      meta: { page, limit, hasMore: result.rows.length === limit },
    });
  } catch (error) {
    return apiErrorResponse(error, "No se pudieron cargar los bots.");
  }
}

export async function POST(request: Request) {
  try {
    const body = requireJsonObject(await readJsonBody<unknown>(request), "El cuerpo", 20_000);
    requireAllowedKeys(body, [
      "name", "communityId", "channelId", "description",
      "commandPrefix", "config", "status",
    ]);
    const input = body as {
      name: unknown;
      communityId: unknown;
      channelId?: unknown;
      description?: unknown;
      commandPrefix?: unknown;
      config?: unknown;
      status?: unknown;
    };
    const name = requireString(input.name, "El nombre", { max: 200 });
    const communityId = requireUuid(input.communityId, "El ID de la comunidad");
    const session = await requireCommunityAdmin(communityId);
    const channelId =
      input.channelId === undefined || input.channelId === null || input.channelId === ""
        ? null
        : requireUuid(input.channelId, "El ID del canal");
    if (channelId) await validateChannel(channelId, communityId);
    const description = input.description === undefined
      ? ""
      : requireString(input.description, "La descripción", { min: 0, max: 5000 });
    const commandPrefix = input.commandPrefix === undefined
      ? "!"
      : requireString(input.commandPrefix, "El prefijo", { min: 1, max: 20 });
    const config = input.config === undefined
      ? {}
      : requireJsonObject(input.config, "La configuración");
    const status = input.status === undefined
      ? "draft"
      : requireEnum(input.status, "El estado", botStatuses);
    if (status === "running" || status === "starting" || status === "stopping") {
      throw new ApiError(400, "Un bot nuevo debe crearse en estado draft o stopped.");
    }
    const bot = await withTransaction(async (client) => {
      const result = await client.query<Bot>(
        `INSERT INTO bots
          (name, community_id, channel_id, description, command_prefix, config, status, desired_status)
         VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7, $8)
         RETURNING id, name, community_id, channel_id, description, command_prefix,
                   config, status, desired_status, last_error, last_error_at, last_activity_at,
                   created_at, updated_at`,
        [name, communityId, channelId, description, commandPrefix, JSON.stringify(config), status, status === "draft" ? "stopped" : "stopped"],
      );
      const created = result.rows[0];
      await recordAuditLog("bot_created", `Se creó el bot "${created.name}"`, communityId, {
        userId: session.userId, entityType: "bot", entityId: created.id, client,
      });
      if (channelId) {
        await recordAuditLog("bot_channel_attached", `Se asoció el bot "${created.name}" a un canal`, communityId, {
          userId: session.userId, entityType: "bot", entityId: created.id, client,
        });
      }
      return created;
    });
    return NextResponse.json({ ok: true, data: bot }, { status: 201 });
  } catch (error) {
    return apiErrorResponse(error, "No se pudo crear el bot.");
  }
}
