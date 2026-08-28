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

type Automation = {
  id: string;
  name: string;
  community_id: string;
  status: "active" | "paused" | "draft";
  trigger: string;
};

type RouteContext = { params: Promise<{ id: string }> };

export async function PUT(request: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    const session = await requireAdmin();
    requireUuid(id, "El ID de la automatización");
    const body = await readJsonBody<{
      name: unknown;
      communityId: unknown;
      trigger: unknown;
      status: unknown;
    }>(request);
    const name = requireString(body.name, "El nombre", { max: 200 });
    const communityId = requireUuid(body.communityId, "El ID de la comunidad");
    const trigger = requireString(body.trigger, "El trigger", {
      min: 0,
      max: 1000,
    });
    const status = requireEnum(body.status, "El estado", [
      "active",
      "paused",
      "draft",
    ] as const);
    const communityResult = await query(
      "SELECT id FROM communities WHERE id = $1",
      [communityId],
    );
    if (communityResult.rowCount === 0) {
      throw new ApiError(404, "La comunidad especificada no existe.");
    }

    const result = await query<Automation>(
      `UPDATE automations
       SET name = $1, community_id = $2, trigger = $3, status = $4, updated_at = now()
       WHERE id = $5
       RETURNING id, name, community_id, status, trigger`,
      [name, communityId, trigger, status, id],
    );

    if (result.rowCount === 0) {
      throw new ApiError(404, "La automatización no existe.");
    }
    const automation = result.rows[0];
    await recordAuditLog(
      "automation_updated",
      `Se actualizó la automatización "${automation.name}"`,
      automation.community_id,
      { userId: session.user.id, entityType: "automation", entityId: automation.id },
    );
    return NextResponse.json({ ok: true, data: automation });
  } catch (error) {
    return apiErrorResponse(error, "No se pudo actualizar la automatización.");
  }
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    const session = await requireAdmin();
    requireUuid(id, "El ID de la automatización");
    const automationResult = await query<{ name: string; community_id: string }>(
      "SELECT name, community_id FROM automations WHERE id = $1",
      [id],
    );
    const automationInfo = automationResult.rows[0];
    const result = await query("DELETE FROM automations WHERE id = $1", [id]);
    if (result.rowCount === 0) {
      throw new ApiError(404, "La automatización no existe.");
    }
    if (automationInfo) {
      await recordAuditLog(
        "automation_deleted",
        `Se eliminó la automatización "${automationInfo.name}"`,
        automationInfo.community_id,
        { userId: session.user.id, entityType: "automation", entityId: id },
      );
    }
    return NextResponse.json({ ok: true, data: { id } });
  } catch (error) {
    return apiErrorResponse(error, "No se pudo eliminar la automatización.");
  }
}
