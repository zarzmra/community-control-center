import { NextResponse } from "next/server";
import { query } from "@/lib/db";

type Channel = {
  id: string;
  name: string;
  type: "whatsapp" | "web" | "other";
  status: "connected" | "disconnected" | "pending";
  community_id: string;
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

    const type =
      body.type === "whatsapp" ||
      body.type === "web" ||
      body.type === "other"
        ? body.type
        : null;

    const status =
      body.status === "connected" ||
      body.status === "disconnected" ||
      body.status === "pending"
        ? body.status
        : null;

    if (!id || !name || !type || !status) {
      return NextResponse.json(
        {
          ok: false,
          error: "Los datos del canal son obligatorios.",
        },
        { status: 400 },
      );
    }

    const result = await query<Channel>(
      `
        UPDATE channels
        SET
          name = $1,
          type = $2,
          status = $3,
          updated_at = now()
        WHERE id = $4
        RETURNING
          id,
          name,
          type,
          status,
          community_id
      `,
      [name, type, status, id],
    );

    if (result.rowCount === 0) {
      return NextResponse.json(
        {
          ok: false,
          error: "El canal no existe.",
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
        error: "No se pudo actualizar el canal.",
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
        DELETE FROM channels
        WHERE id = $1
      `,
      [id],
    );

    if (result.rowCount === 0) {
      return NextResponse.json(
        {
          ok: false,
          error: "El canal no existe.",
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
        error: "No se pudo eliminar el canal.",
      },
      { status: 500 },
    );
  }
}
