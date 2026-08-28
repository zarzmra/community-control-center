import { NextResponse } from "next/server";
import { query, withTransaction } from "@/lib/db";
import { recordAuditLog } from "@/lib/audit";
import {
  apiErrorResponse,
  readJsonBody,
  requireEnum,
  requireString,
  requireUuid,
  ApiError,
} from "@/lib/api";
import { requireCommunityAccess, requireCommunityAdmin } from "@/lib/authorization";

type Community = {
  id: string;
  name: string;
  description: string;
  status: "active" | "inactive";
  members: number;
  bots: number;
  channels: number;
};

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(
  _request: Request,
  { params }: RouteContext,
) {
  try {
    const { id } = await params;
    requireUuid(id, "El ID de la comunidad");
    await requireCommunityAccess(id);

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
        LEFT JOIN bots b
          ON b.community_id = c.id
        LEFT JOIN channels ch
          ON ch.community_id = c.id
        WHERE c.id = $1
        GROUP BY
          c.id,
          c.name,
          c.description,
          c.status,
          c.members
        LIMIT 1
      `,
      [id],
    );

    if (result.rowCount === 0) {
      throw new ApiError(404, "La comunidad no existe.");
    }

    return NextResponse.json({
      ok: true,
      data: result.rows[0],
    });
  } catch (error) {
    return apiErrorResponse(error, "No se pudo cargar la comunidad.");
  }
}

export async function PUT(
  request: Request,
  { params }: RouteContext,
) {
  try {
    const { id } = await params;
    requireUuid(id, "El ID de la comunidad");
    const session = await requireCommunityAdmin(id);
    const body = await readJsonBody<{
      name: unknown;
      description?: unknown;
      status?: unknown;
    }>(request);
    const name = requireString(body.name, "El nombre", { max: 200 });
    const description =
      typeof body.description === "undefined"
        ? ""
        : requireString(body.description, "La descripción", { min: 0, max: 5000 });
    const status =
      body.status === undefined
        ? null
        : requireEnum(body.status, "El estado", ["active", "inactive"] as const);

    let result;

    if (status) {
      result = await query<Community>(
        `
          UPDATE communities
          SET
            name = $1,
            description = $2,
            status = $3,
            updated_at = now()
          WHERE id = $4
          RETURNING
            id,
            name,
            description,
            status,
            members,
            (SELECT COUNT(*)::int FROM bots WHERE community_id = communities.id) AS bots,
            (SELECT COUNT(*)::int FROM channels WHERE community_id = communities.id) AS channels
        `,
        [name, description, status, id],
      );
    } else {
      result = await query<Community>(
        `
          UPDATE communities
          SET
            name = $1,
            description = $2,
            updated_at = now()
          WHERE id = $3
          RETURNING
            id,
            name,
            description,
            status,
            members,
            (SELECT COUNT(*)::int FROM bots WHERE community_id = communities.id) AS bots,
            (SELECT COUNT(*)::int FROM channels WHERE community_id = communities.id) AS channels
        `,
        [name, description, id],
      );
    }

    if (result.rowCount === 0) {
      return NextResponse.json(
        {
          ok: false,
          error: "La comunidad no existe.",
        },
        { status: 404 },
      );
    }

    const updatedCommunity = result.rows[0];

    await recordAuditLog(
      "community_updated",
      `Se actualizó la comunidad "${updatedCommunity.name}"`,
      updatedCommunity.id,
      { userId: session.userId, entityType: "community", entityId: updatedCommunity.id },
    );

    return NextResponse.json({
      ok: true,
      data: updatedCommunity,
    });
  } catch (error) {
    return apiErrorResponse(error, "No se pudo actualizar la comunidad.");
  }
}

export async function DELETE(
  _request: Request,
  { params }: RouteContext,
) {
  try {
    const { id } = await params;
    requireUuid(id, "El ID de la comunidad");
    const session = await requireCommunityAdmin(id);

    await withTransaction(async (client) => {
      const nameResult = await client.query<{ name: string }>(
        "SELECT name FROM communities WHERE id = $1 FOR UPDATE",
        [id],
      );
      if (nameResult.rowCount === 0) {
        throw new ApiError(404, "La comunidad no existe.");
      }

      await client.query("DELETE FROM communities WHERE id = $1", [id]);
      await recordAuditLog(
        "community_deleted",
        `Se eliminó la comunidad "${nameResult.rows[0].name}"`,
        undefined,
        {
          userId: session.userId,
          entityType: "community",
          entityId: id,
          client,
        },
      );
    });

    return NextResponse.json({
      ok: true,
      data: { id },
    });
  } catch (error) {
    return apiErrorResponse(error, "No se pudo eliminar la comunidad.");
  }
}
