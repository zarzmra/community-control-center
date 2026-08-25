import { NextResponse } from "next/server";
import { query } from "@/lib/db";

type Automation = {
  id: string;
  name: string;
  community_id: string;
  status: "active" | "paused" | "draft";
  trigger: string;
};

export async function GET() {
  try {
    const result = await query<Automation>(
      `
        SELECT
          id,
          name,
          community_id,
          status,
          trigger
        FROM automations
        ORDER BY created_at DESC
      `,
    );

    return NextResponse.json({
      ok: true,
      data: result.rows,
    });
  } catch {
    return NextResponse.json(
      {
        ok: false,
        error: "No se pudieron cargar las automatizaciones.",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
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
        : "draft";

    if (!name || !communityId) {
      return NextResponse.json(
        {
          ok: false,
          error: "El nombre y la comunidad son obligatorios.",
        },
        { status: 400 },
      );
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

    return NextResponse.json(
      {
        ok: true,
        data: result.rows[0],
      },
      { status: 201 },
    );
  } catch {
    return NextResponse.json(
      {
        ok: false,
        error: "No se pudo crear la automatización.",
      },
      { status: 500 },
    );
  }
}
