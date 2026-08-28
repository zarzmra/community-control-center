import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { recordAuditLog } from "@/lib/audit";
import {
  ApiError,
  apiErrorResponse,
  readJsonBody,
  requireEnum,
  requireString,
  requireUuid,
} from "@/lib/api";
import { requireAdmin } from "@/lib/authorization";

type Channel = {
  id: string;
  name: string;
  type: "whatsapp" | "web" | "other";
  status: "connected" | "disconnected" | "pending";
  community_id: string;
};

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PUT(
  request: Request,
  { params }: RouteContext,
) {
  try {
    const { id } = await params;
    const session = await requireAdmin();
    requireUuid(id, "El ID del canal");
    const body = await readJsonBody<{ name: unknown; communityId: unknown; type: unknown; status: unknown }>(request);
    const name = requireString(body.name, "El nombre", { max: 200 });
    const communityId = requireUuid(body.communityId, "El ID de la comunidad");
    const type = requireEnum(body.type, "El tipo", ["whatsapp", "web", "other"] as const);
    const status = requireEnum(body.status, "El estado", ["connected", "disconnected", "pending"] as const);

    const communityResult = await query("SELECT id FROM communities WHERE id = $1", [communityId]);
    if (communityResult.rowCount === 0) {
      throw new ApiError(404, "La comunidad especificada no existe.");
    }

    const result = await query<Channel>(
      `
        UPDATE channels
        SET
          name = $1,
          type = $2,
          status = $3,
          community_id = $4,
          updated_at = now()
        WHERE id = $5
        RETURNING
          id,
          name,
          type,
          status,
          community_id
      `,
      [name, type, status, communityId, id],
    );

    if (result.rowCount === 0) {
      return NextResponse.json(
        {
          ok: false,
          error: "El canal no existe.",
        },
        { status: 404 },
      );
    }

    const channel = result.rows[0];

    await recordAuditLog(
      "channel_updated",
      `Se actualizó el canal "${channel.name}"`,
      channel.community_id,
      { userId: session.user.id, entityType: "channel", entityId: channel.id },
    );

    return NextResponse.json({
      ok: true,
      data: channel,
    });
  } catch (error) {
    return apiErrorResponse(error, "No se pudo actualizar el canal.");
  }
}

export async function DELETE(
  _request: Request,
  { params }: RouteContext,
) {
  try {
    const { id } = await params;
    const session = await requireAdmin();
    requireUuid(id, "El ID del canal");

    // Get info before deleting for the log
    const channelResult = await query<Channel>(
      "SELECT name, community_id FROM channels WHERE id = $1",
      [id],
    );

    const channelInfo = channelResult.rows[0];

    const result = await query(
      `
        DELETE FROM channels
        WHERE id = $1
      `,
      [id],
    );

    if (result.rowCount === 0) {
      return NextResponse.json(
        {
          ok: false,
          error: "El canal no existe.",
        },
        { status: 404 },
      );
    }

    if (channelInfo) {
      await recordAuditLog(
        "channel_deleted",
        `Se eliminó el canal "${channelInfo.name}"`,
        channelInfo.community_id,
        { userId: session.user.id, entityType: "channel", entityId: id },
      );
    }

    return NextResponse.json({
      ok: true,
      data: { id },
    });
  } catch (error) {
    return apiErrorResponse(error, "No se pudo eliminar el canal.");
  }
}
