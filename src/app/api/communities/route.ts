import { NextResponse } from "next/server";
import { db } from "@/lib/db";

type Community = {
  id: string;
  name: string;
  description: string;
  status: "active" | "inactive";
  members: number;
  bots: number;
  channels: number;
};

type CommunityRow = {
  id: string;
  name: string;
  description: string;
  status: "active" | "inactive";
  members: number;
  bots: number;
  channels: number;
};

function mapCommunity(row: CommunityRow): Community {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    status: row.status,
    members: row.members,
    bots: row.bots,
    channels: row.channels,
  };
}

export async function GET() {
  try {
    const result = await db.query<CommunityRow>(
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
      data: result.rows.map(mapCommunity),
    });
  } catch (error) {
    console.error("Error al obtener comunidades:", error);

    return NextResponse.json(
      {
        ok: false,
        error: "No se pudieron obtener las comunidades.",
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

    const id = crypto.randomUUID();

    const result = await db.query<CommunityRow>(
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
        VALUES ($1, $2, $3, 'active', 0, 0, 0)
        RETURNING
          id,
          name,
          description,
          status,
          members,
          bots,
          channels
      `,
      [id, name, description],
    );

    const community = mapCommunity(result.rows[0]);

    return NextResponse.json(
      {
        ok: true,
        data: community,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error al crear comunidad:", error);

    return NextResponse.json(
      {
        ok: false,
        error: "No se pudo crear la comunidad.",
      },
      { status: 500 },
    );
  }
}
