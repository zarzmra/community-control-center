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

type Bot = {
  id: string;
  name: string;
  community_id: string;
  status: "online" | "offline" | "error";
  created_at: string;
};

export async function GET(request: Request) {
  try {
    await requireAdmin();
    const { limit, offset, page } = parsePagination(request);
    const communityId = new URL(request.url).searchParams.get("communityId");
    if (communityId) requireUuid(communityId, "El ID de la comunidad");

    const result = await query<Bot>(
      `SELECT id, name, community_id, status, created_at
       FROM bots
       WHERE ($3::uuid IS NULL OR community_id = $3)
       ORDER BY created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset, communityId],
    );

    return NextResponse.json({
      ok: true,
      data: result.rows,
      meta: { page, limit, hasMore: result.rows.length === limit },
    });
  } catch (error) {
    return apiErrorResponse(error, "No se pudieron cargar los bots.");
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireAdmin();
    const body = await readJsonBody<{
      name: unknown;
      communityId: unknown;
      status?: unknown;
    }>(request);
    const name = requireString(body.name, "El nombre", { max: 200 });
    const communityId = requireUuid(body.communityId, "El ID de la comunidad");
    const status =
      body.status === undefined
        ? "offline"
        : requireEnum(body.status, "El estado", [
            "online",
            "offline",
            "error",
          ] as const);

    const communityResult = await query(
      "SELECT id FROM communities WHERE id = $1",
      [communityId],
    );
    if (communityResult.rowCount === 0) {
      throw new ApiError(404, "La comunidad especificada no existe.");
    }

    const result = await query<Bot>(
      `INSERT INTO bots (name, community_id, status)
       VALUES ($1, $2, $3)
       RETURNING id, name, community_id, status, created_at`,
      [name, communityId, status],
    );
    const bot = result.rows[0];

    await recordAuditLog(
      "bot_created",
      `Se creó el bot "${bot.name}"`,
      bot.community_id,
      { userId: session.user.id, entityType: "bot", entityId: bot.id },
    );

    return NextResponse.json({ ok: true, data: bot }, { status: 201 });
  } catch (error) {
    return apiErrorResponse(error, "No se pudo crear el bot.");
  }
}
