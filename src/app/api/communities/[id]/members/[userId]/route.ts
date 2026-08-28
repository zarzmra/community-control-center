import { NextResponse } from "next/server";
import { query, withTransaction } from "@/lib/db";
import { recordAuditLog } from "@/lib/audit";
import { ApiError, apiErrorResponse, readJsonBody, requireEnum, requireUuid } from "@/lib/api";
import { requireCommunityAdmin } from "@/lib/authorization";

type Params = { params: Promise<{ id: string; userId: string }> };

export async function PATCH(request: Request, { params }: Params) {
  try {
    const { id, userId } = await params;
    requireUuid(id, "El ID de la comunidad");
    requireUuid(userId, "El ID del usuario");
    const session = await requireCommunityAdmin(id);
    const body = await readJsonBody<{ role: unknown }>(request);
    const role = requireEnum(body.role, "El rol", ["admin", "member"] as const);
    const result = await query(
      `UPDATE community_memberships SET role = $1, updated_at = now()
       WHERE community_id = $2 AND user_id = $3 RETURNING id, community_id, user_id, role, created_at, updated_at`,
      [role, id, userId],
    );
    if (!result.rows[0]) throw new ApiError(404, "La membresía no existe.");
    await recordAuditLog("membership_updated", `Se actualizó una membresía`, id, {
      userId: session.userId, entityType: "community_membership", entityId: result.rows[0].id,
    });
    return NextResponse.json({ ok: true, data: result.rows[0] });
  } catch (error) {
    return apiErrorResponse(error, "No se pudo actualizar la membresía.");
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    const { id, userId } = await params;
    requireUuid(id, "El ID de la comunidad");
    requireUuid(userId, "El ID del usuario");
    const session = await requireCommunityAdmin(id);
    await withTransaction(async (client) => {
      const result = await client.query<{ id: string }>(
        `DELETE FROM community_memberships
         WHERE community_id = $1 AND user_id = $2 RETURNING id`,
        [id, userId],
      );
      if (!result.rows[0]) throw new ApiError(404, "La membresía no existe.");
      await recordAuditLog("membership_deleted", "Se eliminó una membresía", id, {
        userId: session.userId, entityType: "community_membership", entityId: result.rows[0].id, client,
      });
    });
    return NextResponse.json({ ok: true, data: { communityId: id, userId } });
  } catch (error) {
    return apiErrorResponse(error, "No se pudo eliminar la membresía.");
  }
}
