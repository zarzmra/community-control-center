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
import { requireCommunityAdmin } from "@/lib/authorization";

type Bot = {
  id: string;
  name: string;
  community_id: string;
  status: "online" | "offline" | "error";
  created_at: string;
};

type RouteContext = { params: Promise<{ id: string }> };

export async function PUT(request: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    requireUuid(id, "El ID del bot");
    const existing = await query<{ community_id: string }>(
      "SELECT community_id FROM bots WHERE id = $1",
      [id],
    );
    if (!existing.rows[0]) throw new ApiError(404, "El bot no existe.");
    const session = await requireCommunityAdmin(existing.rows[0].community_id);
    const body = await readJsonBody<{ name: unknown; status: unknown }>(request);
    const name = requireString(body.name, "El nombre", { max: 200 });
    const status = requireEnum(body.status, "El estado", [
      "online",
      "offline",
      "error",
    ] as const);

    const result = await query<Bot>(
      `UPDATE bots
       SET name = $1, status = $2, updated_at = now()
       WHERE id = $3
       RETURNING id, name, community_id, status, created_at`,
      [name, status, id],
    );
    if (result.rowCount === 0) {
      throw new ApiError(404, "El bot no existe.");
    }
    const bot = result.rows[0];
    await recordAuditLog(
      "bot_updated",
      `Se actualizó el bot "${bot.name}"`,
      bot.community_id,
      { userId: session.userId, entityType: "bot", entityId: bot.id },
    );
    return NextResponse.json({ ok: true, data: bot });
  } catch (error) {
    return apiErrorResponse(error, "No se pudo actualizar el bot.");
  }
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    requireUuid(id, "El ID del bot");
    const botResult = await query<{ name: string; community_id: string }>(
      "SELECT name, community_id FROM bots WHERE id = $1",
      [id],
    );
    const botInfo = botResult.rows[0];
    if (!botInfo) throw new ApiError(404, "El bot no existe.");
    const authorized = await requireCommunityAdmin(botInfo.community_id);
    const result = await query("DELETE FROM bots WHERE id = $1", [id]);
    if (result.rowCount === 0) {
      return NextResponse.json(
        { ok: false, error: "El bot no existe." },
        { status: 404 },
      );
    }
    await recordAuditLog(
        "bot_deleted",
        `Se eliminó el bot "${botInfo.name}"`,
        botInfo.community_id,
        { userId: authorized.userId, entityType: "bot", entityId: id },
    );
    return NextResponse.json({ ok: true, data: { id } });
  } catch (error) {
    return apiErrorResponse(error, "No se pudo eliminar el bot.");
  }
}
