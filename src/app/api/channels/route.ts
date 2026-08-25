import { NextResponse } from "next/server";
import { query } from "@/lib/db";

type Channel = {
  id: string;
  name: string;
  type: "whatsapp" | "web" | "other";
  status: "connected" | "disconnected" | "pending";
  community_id: string;
};

export async function GET() {
  try {
    const result = await query<Channel>(
      `
        SELECT
          id,
          name,
          type,
          status,
          community_id
        FROM channels
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
        error: "No se pudieron cargar los canales.",
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

    const type =
      body.type === "whatsapp" ||
      body.type === "web" ||
      body.type === "other"
        ? body.type
        : "other";

    const status =
      body.status === "connected" ||
      body.status === "disconnected" ||
      body.status === "pending"
        ? body.status
        : "pending";

    if (!name || !communityId) {
      return NextResponse.json(
        {
          ok: false,
          error: "El nombre y la comunidad son obligatorios.",
        },
        { status: 400 },
      );
    }

    const result = await query<Channel>(
      `
        INSERT INTO channels (
          name,
          type,
          status,
          community_id
        )
        VALUES ($1, $2, $3, $4)
        RETURNING
          id,
          name,
          type,
          status,
          community_id
      `,
      [name, type, status, communityId],
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
        error: "No se pudo crear el canal.",
      },
      { status: 500 },
    );
  }
}
