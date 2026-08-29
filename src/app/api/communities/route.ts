import { NextResponse } from "next/server";
import { query, withTransaction } from "@/lib/db";
import { recordAuditLog } from "@/lib/audit";
import {
  ApiError,
  apiErrorResponse,
  parsePagination,
  readJsonBody,
  requireString,
  requireUuid,
} from "@/lib/api";
import { requireAdmin, requireCommunityAdmin, requireSession } from "@/lib/authorization";

type Community = {
  id: string;
  name: string;
  description: string;
  status: "active" | "inactive";
  members: number;
  bots: number;
  channels: number;
};

export async function GET(request: Request) {
  try {
    const context = await requireSession();
    const { limit, offset, page } = parsePagination(request);
    const result = await query<Community>(
      `
        SELECT
          c.id,
          c.name,
          c.description,
          c.status,
          c.members,
          COUNT(DISTINCT b.id)::int AS bots,
          COUNT(DISTINCT ch.id)::int AS channels
        FROM communities c
        LEFT JOIN bots b ON b.community_id = c.id
        LEFT JOIN channels ch ON ch.community_id = c.id
        WHERE $3 = 'admin'
           OR EXISTS (
             SELECT 1 FROM community_memberships cm
             WHERE cm.community_id = c.id AND cm.user_id = $4
           )
        GROUP BY c.id, c.name, c.description, c.status, c.members, c.created_at
        ORDER BY c.created_at DESC
        LIMIT $1 OFFSET $2
      `,
      [limit, offset, context.role, context.userId],
    );

    return NextResponse.json({
      ok: true,
      data: result.rows,
      meta: { page, limit, hasMore: result.rows.length === limit },
    });
  } catch (error) {
    return apiErrorResponse(error, "No se pudieron cargar las comunidades.");
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireAdmin();
    const body = await readJsonBody<{ name: unknown; description?: unknown }>(request);
    const name = requireString(body.name, "El nombre", { max: 200 });
    const description =
      typeof body.description === "undefined"
        ? ""
        : requireString(body.description, "La descripción", { min: 0, max: 5000 });

    const result = await query<Community>(
      `
        INSERT INTO communities (
          id,
          name,
          description,
          status,
          members
        )
        VALUES (
          gen_random_uuid(),
          $1,
          $2,
          'active',
          0
        )
        RETURNING
          id,
          name,
          description,
          status,
          members,
          0::int AS bots,
          0::int AS channels
      `,
      [name, description],
    );

    const community = result.rows[0];

    await recordAuditLog(
      "community_created",
      `Se creó la comunidad "${community.name}"`,
      community.id,
      { userId: session.userId, entityType: "community", entityId: community.id },
    );

    return NextResponse.json(
      {
        ok: true,
        data: community,
      },
      { status: 201 },
    );
  } catch (error) {
    return apiErrorResponse(error, "No se pudo crear la comunidad.");
  }
}

export async function DELETE(request: Request) {
  try {
    const body = await readJsonBody<{ id: unknown }>(request);
    const id = requireUuid(body.id, "El ID de la comunidad");
    const session = await requireCommunityAdmin(id);

    // Get name before deleting for the log
    await withTransaction(async (client) => {
      const nameResult = await client.query<{ name: string }>(
        "SELECT name FROM communities WHERE id = $1 FOR UPDATE",
        [id],
      );
      if (nameResult.rowCount === 0) {
        throw new ApiError(404, "La comunidad no existe.");
      }


      const communityName = nameResult.rows[0].name;
      await client.query("DELETE FROM communities WHERE id = $1", [id]);
      await recordAuditLog(
        "community_deleted",
        `Se eliminó la comunidad "${communityName}"`,
        undefined,
        { userId: session.userId, entityType: "community", entityId: id, client },
      );
    });

    return NextResponse.json({
      ok: true,
      data: {
        id,
      },
    });
  } catch (error) {
    return apiErrorResponse(error, "No se pudo eliminar la comunidad.");
  }
}
