import { NextResponse } from "next/server";
import { query, withTransaction } from "@/lib/db";
import { recordAuditLog } from "@/lib/audit";
import {
  ApiError,
  apiErrorResponse,
  readJsonBody,
  requireEnum,
  requireString,
  requireUuid,
} from "@/lib/api";
import {
  requireCommunityAccess,
  requireCommunityAdmin,
} from "@/lib/authorization";

type Channel = {
  id: string;
  name: string;
  type: "whatsapp" | "web" | "other";
  status: "connected" | "disconnected" | "pending";
  connection_status:
    | "configured"
    | "pending"
    | "connected"
    | "disconnected"
    | "error";
  community_id: string;
};

type RouteContext = {
  params: Promise<{ id: string }>;
};

const connectionStatuses = [
  "configured",
  "pending",
  "connected",
  "disconnected",
  "error",
] as const;

export async function GET(_request: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    requireUuid(id, "El ID del canal");
    const result = await query<Channel>(
      `SELECT id, name, type, status, connection_status, community_id
       FROM channels
       WHERE id = $1`,
      [id],
    );
    const channel = result.rows[0];
    if (!channel) throw new ApiError(404, "El canal no existe.");
    await requireCommunityAccess(channel.community_id);
    return NextResponse.json({ ok: true, data: channel });
  } catch (error) {
    return apiErrorResponse(error, "No se pudo cargar el canal.");
  }
}

export async function PUT(request: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    requireUuid(id, "El ID del canal");
    const existing = await query<{ community_id: string }>(
      "SELECT community_id FROM channels WHERE id = $1",
      [id],
    );
    if (!existing.rows[0]) throw new ApiError(404, "El canal no existe.");
    const session = await requireCommunityAdmin(existing.rows[0].community_id);
    const body = await readJsonBody<{
      name: unknown;
      communityId: unknown;
      type: unknown;
      status: unknown;
      connectionStatus?: unknown;
    }>(request);
    const name = requireString(body.name, "El nombre", { max: 200 });
    const communityId = requireUuid(body.communityId, "El ID de la comunidad");
    await requireCommunityAdmin(communityId);
    const type = requireEnum(body.type, "El tipo", [
      "whatsapp",
      "web",
      "other",
    ] as const);
    const status = requireEnum(body.status, "El estado", [
      "connected",
      "disconnected",
      "pending",
    ] as const);
    const connectionStatus =
      body.connectionStatus === undefined
        ? status
        : requireEnum(
            body.connectionStatus,
            "El estado de conexión",
            connectionStatuses,
          );

    const result = await query<Channel>(
      `UPDATE channels
       SET name = $1, type = $2, status = $3, connection_status = $4,
           community_id = $5, updated_at = now()
       WHERE id = $6
       RETURNING id, name, type, status, connection_status, community_id`,
      [name, type, status, connectionStatus, communityId, id],
    );
    if (!result.rows[0]) throw new ApiError(404, "El canal no existe.");
    const channel = result.rows[0];
    await recordAuditLog(
      "channel_updated",
      `Se actualizó el canal "${channel.name}"`,
      channel.community_id,
      { userId: session.userId, entityType: "channel", entityId: channel.id },
    );
    return NextResponse.json({ ok: true, data: channel });
  } catch (error) {
    return apiErrorResponse(error, "No se pudo actualizar el canal.");
  }
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    requireUuid(id, "El ID del canal");
    await withTransaction(async (client) => {
      const channel = await client.query<{
        name: string;
        community_id: string;
      }>("SELECT name, community_id FROM channels WHERE id = $1 FOR UPDATE", [
        id,
      ]);
      if (!channel.rows[0]) throw new ApiError(404, "El canal no existe.");
      const session = await requireCommunityAdmin(channel.rows[0].community_id);
      await client.query("DELETE FROM channels WHERE id = $1", [id]);
      await recordAuditLog(
        "channel_deleted",
        `Se eliminó el canal "${channel.rows[0].name}"`,
        channel.rows[0].community_id,
        { userId: session.userId, entityType: "channel", entityId: id, client },
      );
    });
    return NextResponse.json({ ok: true, data: { id } });
  } catch (error) {
    return apiErrorResponse(error, "No se pudo eliminar el canal.");
  }
}

export const PATCH = PUT;
