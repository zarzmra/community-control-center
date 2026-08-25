import { NextResponse } from "next/server";
import { query } from "@/lib/db";

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

    if (!id || !name || !status) {
      return NextResponse.json(
        {
          ok: false,
          error: "Los datos de la automatización son obligatorios.",
        },
        { status: 400 },
      );
    }

    const result = await query<Automation>(
      `
        UPDATE automations
        SET
          name = $1,
          trigger = $2,
          status = $3,
          updated_at = now()
        WHERE id = $4
        RETURNING
          id,
          name,
          community_id,
          status,
          trigger
      `,
      [name, trigger, status, id],
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

    return NextResponse.json({
      ok: true,
      data: result.rows[0],
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
