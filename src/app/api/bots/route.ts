import { NextResponse } from "next/server";
import { query } from "@/lib/db";

type Bot = {
  id: string;
  name: string;
  community_id: string;
  status: "online" | "offline" | "error";
  created_at: string;
};

export async function GET() {
  try {
    const result = await query<Bot>(
      `
        SELECT
          id,
          name,
          community_id,
          status,
          created_at
        FROM bots
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
        error: "No se pudieron cargar los bots.",
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

    const status =
      body.status === "online" ||
      body.status === "offline" ||
      body.status === "error"
        ? body.status
        : "offline";

    if (!name || !communityId) {
      return NextResponse.json(
        {
          ok: false,
          error: "El nombre y la comunidad son obligatorios.",
        },
        { status: 400 },
      );
    }

    const result = await query<Bot>(
      `
        INSERT INTO bots (
          name,
          community_id,
          status
        )
        VALUES ($1, $2, $3)
        RETURNING
          id,
          name,
          community_id,
          status,
          created_at
      `,
      [name, communityId, status],
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
        error: "No se pudo crear el bot.",
      },
      { status: 500 },
    );
  }
}
