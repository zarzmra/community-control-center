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
import { requireAdmin } from "@/lib/authorization";

type Automation = {
  id: string;
  name: string;
  community_id: string;
  status: "active" | "paused" | "draft";
  trigger: string;
};

export async function GET(request: Request) {
  try {
    await requireAdmin();
    const { limit, offset, page } = parsePagination(request);
    const communityId = new URL(request.url).searchParams.get("communityId");
    if (communityId) requireUuid(communityId, "El ID de la comunidad");
    const result = await query<Automation>(
      `
        SELECT
          id,
          name,
          community_id,
          status,
          trigger
        FROM automations
        WHERE ($3::uuid IS NULL OR community_id = $3)
        ORDER BY created_at DESC
        LIMIT $1 OFFSET $2
      `,
      [limit, offset, communityId],
    );

    return NextResponse.json({
      ok: true,
      data: result.rows,
      meta: { page, limit, hasMore: result.rows.length === limit },
    });
  } catch (error) {
    return apiErrorResponse(error, "No se pudieron cargar las automatizaciones.");
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireAdmin();
    const body = await readJsonBody<{
      name: unknown;
      communityId: unknown;
      trigger?: unknown;
      status?: unknown;
    }>(request);
    const name = requireString(body.name, "El nombre", { max: 200 });
    const communityId = requireUuid(body.communityId, "El ID de la comunidad");
    const trigger =
      body.trigger === undefined
        ? ""
        : requireString(body.trigger, "El trigger", { min: 0, max: 1000 });
    const status =
      body.status === undefined
        ? "draft"
        : requireEnum(body.status, "El estado", ["active", "paused", "draft"] as const);

    const communityResult = await query(
      "SELECT id FROM communities WHERE id = $1",
      [communityId],
    );
    if (communityResult.rowCount === 0) {
      throw new ApiError(404, "La comunidad especificada no existe.");
    }

    const result = await query<Automation>(
      `
        INSERT INTO automations (
          name,
          community_id,
          status,
          trigger
        )
        VALUES ($1, $2, $3, $4)
        RETURNING
          id,
          name,
          community_id,
          status,
          trigger
      `,
      [name, communityId, status, trigger],
    );

    const automation = result.rows[0];

    await recordAuditLog(
      "automation_created",
      `Se creó la automatización "${automation.name}"`,
      automation.community_id,
      { userId: session.user.id, entityType: "automation", entityId: automation.id },
    );

    return NextResponse.json(
      {
        ok: true,
        data: automation,
      },
      { status: 201 },
    );
  } catch (error) {
    return apiErrorResponse(error, "No se pudo crear la automatización.");
  }
}
