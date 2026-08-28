import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { recordAuditLog } from "@/lib/audit";
import {
  ApiError, apiErrorResponse, readJsonBody, requireEnum, requireUuid,
} from "@/lib/api";
import { requireCommunityAccess, requireCommunityAdmin } from "@/lib/authorization";

type Params = { params: Promise<{ id: string }> };
type Membership = {
  id: string; community_id: string; user_id: string; role: "admin" | "member";
  created_at: string; updated_at: string; name: string; email: string;
};

export async function GET(_request: Request, { params }: Params) {
  try {
    const { id } = await params;
    requireUuid(id, "El ID de la comunidad");
    await requireCommunityAccess(id);
    const result = await query<Membership>(
      `SELECT cm.id, cm.community_id, cm.user_id, cm.role, cm.created_at, cm.updated_at,
              u.name, u.email
       FROM community_memberships cm JOIN users u ON u.id = cm.user_id
       WHERE cm.community_id = $1 ORDER BY cm.created_at ASC`,
      [id],
    );
    return NextResponse.json({ ok: true, data: result.rows });
  } catch (error) {
    return apiErrorResponse(error, "No se pudieron cargar las membresías.");
  }
}

export async function POST(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    requireUuid(id, "El ID de la comunidad");
    const session = await requireCommunityAdmin(id);
    const body = await readJsonBody<{ userId: unknown; role?: unknown }>(request);
    const userId = requireUuid(body.userId, "El ID del usuario");
    const role = body.role === undefined
      ? "member"
      : requireEnum(body.role, "El rol", ["admin", "member"] as const);
    const user = await query<{ id: string; name: string; email: string }>(
      "SELECT id, name, email FROM users WHERE id = $1", [userId],
    );
    if (!user.rows[0]) throw new ApiError(404, "El usuario no existe.");
    const result = await query<Membership>(
      `INSERT INTO community_memberships (community_id, user_id, role)
       VALUES ($1, $2, $3)
       RETURNING id, community_id, user_id, role, created_at, updated_at`,
      [id, userId, role],
    );
    await recordAuditLog("membership_created", `Se añadió a "${user.rows[0].email}"`, id, {
      userId: session.userId, entityType: "community_membership", entityId: result.rows[0].id,
    });
    return NextResponse.json({ ok: true, data: { ...result.rows[0], ...user.rows[0] } }, { status: 201 });
  } catch (error) {
    return apiErrorResponse(error, "No se pudo crear la membresía.");
  }
}
