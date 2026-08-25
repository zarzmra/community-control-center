import { NextResponse } from "next/server";
import { query } from "@/lib/db";

type Bot = {
  id: string;
  name: string;
  community_id: string;
  status: "online" | "offline" | "error";
  created_at: string;
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

    const status =
      body.status === "online" ||
      body.status === "offline" ||
      body.status === "error"
        ? body.status
        : null;

    if (!id || !name || !status) {
      return NextResponse.json(
        {
          ok: false,
          error: "Los datos del bot son obligatorios.",
        },
        { status: 400 },
      );
    }

    const result = await query<Bot>(
      `
        UPDATE bots
        SET
          name = $1,
          status = $2,
          updated_at = now()
        WHERE id = $3
        RETURNING
          id,
          name,
          community_id,
          status,
          created_at
      `,
      [name, status, id],
    );

    if (result.rowCount === 0) {
      return NextResponse.json(
        {
          ok: false,
          error: "El bot no existe.",
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
        error: "No se pudo actualizar el bot.",
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
        DELETE FROM bots
        WHERE id = $1
      `,
      [id],
    );

    if (result.rowCount === 0) {
      return NextResponse.json(
        {
          ok: false,
          error: "El bot no existe.",
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
        error: "No se pudo eliminar el bot.",
      },
      { status: 500 },
    );
  }
}
