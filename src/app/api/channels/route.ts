import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { recordAuditLog } from "@/lib/audit";
import {
  ApiError,
  apiErrorResponse,
  parsePagination,
  readJsonBody,
  requireEnum,
  requireString,
  requireUuid,
} from "@/lib/api";
import { requireCommunityAdmin, requireSession } from "@/lib/authorization";

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

export async function GET(request: Request) {
  try {
    const context = await requireSession();
    const { limit, offset, page } = parsePagination(request);
    const communityId = new URL(request.url).searchParams.get("communityId");
    if (communityId) requireUuid(communityId, "El ID de la comunidad");
    const result = await query<Channel>(
      `
        SELECT
          id,
          name,
          type,
          status,
          connection_status,
          community_id
        FROM channels
        WHERE ($3::uuid IS NULL OR community_id = $3)
          AND ($4 = 'admin' OR EXISTS (
            SELECT 1 FROM community_memberships cm
            WHERE cm.community_id = channels.community_id AND cm.user_id = $5
          ))
        ORDER BY created_at DESC
        LIMIT $1 OFFSET $2
      `,
      [limit, offset, communityId, context.role, context.userId],
    );

    return NextResponse.json({
      ok: true,
      data: result.rows,
      meta: { page, limit, hasMore: result.rows.length === limit },
    });
  } catch (error) {
    return apiErrorResponse(error, "No se pudieron cargar los canales.");
  }
}

export async function POST(request: Request) {
  try {
    const body = await readJsonBody<{
      name: unknown;
      communityId: unknown;
      type?: unknown;
      status?: unknown;
      connectionStatus?: unknown;
    }>(request);
    const name = requireString(body.name, "El nombre", { max: 200 });
    const communityId = requireUuid(body.communityId, "El ID de la comunidad");
    const session = await requireCommunityAdmin(communityId);
    const type =
      body.type === undefined
        ? "other"
        : requireEnum(body.type, "El tipo", ["whatsapp", "web", "other"] as const);
    const status =
      body.status === undefined
        ? "pending"
        : requireEnum(body.status, "El estado", ["connected", "disconnected", "pending"] as const);
    const connectionStatus =
      body.connectionStatus === undefined
        ? status
        : requireEnum(body.connectionStatus, "El estado de conexión", [
            "configured",
            "pending",
            "connected",
            "disconnected",
            "error",
          ] as const);

    const communityResult = await query(
      "SELECT id FROM communities WHERE id = $1",
      [communityId],
    );
    if (communityResult.rowCount === 0) {
      throw new ApiError(404, "La comunidad especificada no existe.");
    }

    const result = await query<Channel>(
      `
        INSERT INTO channels (
          name,
          type,
          status,
          connection_status,
          community_id
        )
        VALUES ($1, $2, $3, $4, $5)
        RETURNING
          id,
          name,
          type,
          status,
          connection_status,
          community_id
      `,
      [name, type, status, connectionStatus, communityId],
    );

    const channel = result.rows[0];

    await recordAuditLog(
      "channel_created",
      `Se creó el canal "${channel.name}"`,
      channel.community_id,
      { userId: session.userId, entityType: "channel", entityId: channel.id },
    );

    return NextResponse.json(
      {
        ok: true,
        data: channel,
      },
      { status: 201 },
    );
  } catch (error) {
    return apiErrorResponse(error, "No se pudo crear el canal.");
  }
}
