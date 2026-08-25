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

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
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
          id,
          name,
          description,
          status,
          members,
          bots,
          channels
        FROM communities
        WHERE id = $1
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
