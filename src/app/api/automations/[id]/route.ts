import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { recordAuditLog } from "@/lib/audit";

type Automation = {
  id: string;
  name: string;
  community_id: string;
  status: "active" | "paused" | "draft";
  trigger: string;
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
    const body = await request.json();

    const name =
      typeof body.name === "string" ? body.name.trim() : "";

    const communityId =
      typeof body.communityId === "string"
        ? body.communityId.trim()
        : "";

    const trigger =
      typeof body.trigger === "string"
        ? body.trigger.trim()
        : "";

    const status =
      body.status === "active" ||
      body.status === "paused" ||
      body.status === "draft"
        ? body.status
        : null;

    if (!id || !name || !communityId || !status) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "El nombre, comunidad y estado de la automatización son obligatorios.",
        },
        { status: 400 },
      );
    }

    const result = await query<Automation>(
      `
        UPDATE automations
        SET
          name = $1,
          community_id = $2,
          trigger = $3,
          status = $4,
          updated_at = now()
        WHERE id = $5
        RETURNING
          id,
          name,
          community_id,
          status,
          trigger
      `,
      [name, communityId, trigger, status, id],
    );

    if (result.rowCount === 0) {
      return NextResponse.json(
        {
          ok: false,
          error: "La automatización no existe.",
        },
        { status: 404 },
      );
    }

    const automation = result.rows[0];

    await recordAuditLog(
      "automation_updated",
      `Se actualizó la automatización "${automation.name}"`,
      automation.community_id,
    );

    return NextResponse.json({
      ok: true,
      data: automation,
    });
  } catch {
    return NextResponse.json(
      {
        ok: false,
        error: "No se pudo actualizar la automatización.",
      },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: RouteContext,
) {
  try {
    const { id } = await params;

    // Get info before deleting for the log
    const automationResult = await query<Automation>(
      "SELECT name, community_id FROM automations WHERE id = $1",
      [id],
    );

    const automationInfo = automationResult.rows[0];

    const result = await query(
      `
        DELETE FROM automations
        WHERE id = $1
      `,
      [id],
    );

    if (result.rowCount === 0) {
      return NextResponse.json(
        {
          ok: false,
          error: "La automatización no existe.",
        },
        { status: 404 },
      );
    }

    if (automationInfo) {
      await recordAuditLog(
        "automation_deleted",
        `Se eliminó la automatización "${automationInfo.name}"`,
        automationInfo.community_id,
      );
    }

    return NextResponse.json({
      ok: true,
      data: { id },
    });
  } catch {
    return NextResponse.json(
      {
        ok: false,
        error: "No se pudo eliminar la automatización.",
      },
      { status: 500 },
    );
  }
}
