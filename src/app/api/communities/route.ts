import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { recordAuditLog } from "@/lib/audit";

type Community = {
  id: string;
  name: string;
  description: string;
  status: "active" | "inactive";
  members: number;
  bots: number;
  channels: number;
};

export async function GET() {
  try {
    const result = await query<Community>(
      `
        SELECT
          id,
          name,
          description,
          status,
          members,
          bots,
          channels
        FROM communities
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
        error: "No se pudieron cargar las comunidades.",
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

    const description =
      typeof body.description === "string"
        ? body.description.trim()
        : "";

    if (!name) {
      return NextResponse.json(
        {
          ok: false,
          error: "El nombre de la comunidad es obligatorio.",
        },
        { status: 400 },
      );
    }

    const result = await query<Community>(
      `
        INSERT INTO communities (
          id,
          name,
          description,
          status,
          members,
          bots,
          channels
        )
        VALUES (
          gen_random_uuid(),
          $1,
          $2,
          'active',
          0,
          0,
          0
        )
        RETURNING
          id,
          name,
          description,
          status,
          members,
          bots,
          channels
      `,
      [name, description],
    );

    const community = result.rows[0];

    await recordAuditLog(
      "community_created",
      `Se creó la comunidad "${community.name}"`,
      community.id,
    );

    return NextResponse.json(
      {
        ok: true,
        data: community,
      },
      { status: 201 },
    );
  } catch {
    return NextResponse.json(
      {
        ok: false,
        error: "No se pudo crear la comunidad.",
      },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const body = await request.json();

    const id =
      typeof body.id === "string" ? body.id.trim() : "";

    if (!id) {
      return NextResponse.json(
        {
          ok: false,
          error: "El ID de la comunidad es obligatorio.",
        },
        { status: 400 },
      );
    }

    // Get name before deleting for the log
    const nameResult = await query<{ name: string }>(
      "SELECT name FROM communities WHERE id = $1",
      [id],
    );

    const communityName = nameResult.rows[0]?.name || id;

    const result = await query(
      `
        DELETE FROM communities
        WHERE id = $1
      `,
      [id],
    );

    if (result.rowCount === 0) {
      return NextResponse.json(
        {
          ok: false,
          error: "La comunidad no existe.",
        },
        { status: 404 },
      );
    }

    await recordAuditLog(
      "community_deleted",
      `Se eliminó la comunidad "${communityName}"`,
    );

    return NextResponse.json({
      ok: true,
      data: {
        id,
      },
    });
  } catch {
    return NextResponse.json(
      {
        ok: false,
        error: "No se pudo eliminar la comunidad.",
      },
      { status: 500 },
    );
  }
}
