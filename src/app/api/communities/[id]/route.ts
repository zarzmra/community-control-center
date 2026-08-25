import { NextResponse } from "next/server";
import { query } from "@/lib/db";

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

    if (!id) {
      return NextResponse.json(
        {
          ok: false,
          error: "El ID de la comunidad es obligatorio.",
        },
        { status: 400 },
      );
    }

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
      return NextResponse.json(
        {
          ok: false,
          error: "La comunidad no existe.",
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
        error: "No se pudo cargar la comunidad.",
      },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: Request,
  { params }: RouteContext,
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const name =
      typeof body.name === "string"
        ? body.name.trim()
        : "";

    const description =
      typeof body.description === "string"
        ? body.description.trim()
        : "";

    const status =
      body.status === "active" ||
      body.status === "inactive"
        ? body.status
        : null;

    if (!id || !name) {
      return NextResponse.json(
        {
          ok: false,
          error: "El ID y nombre de la comunidad son obligatorios.",
        },
        { status: 400 },
      );
    }

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
            bots,
            channels
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
            bots,
            channels
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

    return NextResponse.json({
      ok: true,
      data: result.rows[0],
    });
  } catch {
    return NextResponse.json(
      {
        ok: false,
        error: "No se pudo actualizar la comunidad.",
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

    if (!id) {
      return NextResponse.json(
        {
          ok: false,
          error: "El ID de la comunidad es obligatorio.",
        },
        { status: 400 },
      );
    }

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

    return NextResponse.json({
      ok: true,
      data: { id },
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
