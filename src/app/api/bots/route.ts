import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { recordAuditLog } from "@/lib/audit";

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

    // Verificar que la comunidad exista
    const communityResult = await query(
      "SELECT id FROM communities WHERE id = $1",
      [communityId]
    );

    if (communityResult.rowCount === 0) {
      return NextResponse.json(
        {
          ok: false,
          error: "La comunidad especificada no existe.",
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

    const bot = result.rows[0];

    await recordAuditLog(
      "bot_created",
      `Se creó el bot "${bot.name}"`,
      bot.community_id,
    );

    return NextResponse.json(
      {
        ok: true,
        data: bot,
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

export async function PUT(request: Request) {
  try {
    const body = await request.json();

    const id = typeof body.id === "string" ? body.id.trim() : "";
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const communityId =
      typeof body.communityId === "string" ? body.communityId.trim() : "";
    const status =
      body.status === "online" ||
      body.status === "offline" ||
      body.status === "error"
        ? body.status
        : null;

    if (!id || !name || !communityId) {
      return NextResponse.json(
        {
          ok: false,
          error: "El ID, nombre y comunidad son obligatorios.",
        },
        { status: 400 },
      );
    }

    // Verificar que la comunidad exista
    const communityResult = await query(
      "SELECT id FROM communities WHERE id = $1",
      [communityId]
    );

    if (communityResult.rowCount === 0) {
      return NextResponse.json(
        {
          ok: false,
          error: "La comunidad especificada no existe.",
        },
        { status: 400 },
      );
    }

    let result;

    if (status) {
      result = await query<Bot>(
        `
          UPDATE bots
          SET
            name = $1,
            community_id = $2,
            status = $3,
            updated_at = now()
          WHERE id = $4
          RETURNING
            id,
            name,
            community_id,
            status,
            created_at
        `,
        [name, communityId, status, id],
      );
    } else {
      result = await query<Bot>(
        `
          UPDATE bots
          SET
            name = $1,
            community_id = $2,
            updated_at = now()
          WHERE id = $3
          RETURNING
            id,
            name,
            community_id,
            status,
            created_at
        `,
        [name, communityId, id],
      );
    }

    if (result.rowCount === 0) {
      return NextResponse.json(
        {
          ok: false,
          error: "El bot no existe.",
        },
        { status: 404 },
      );
    }

    const updatedBot = result.rows[0];

    await recordAuditLog(
      "bot_updated",
      `Se actualizó el bot "${updatedBot.name}"`,
      updatedBot.community_id,
    );

    return NextResponse.json({
      ok: true,
      data: updatedBot,
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

export async function DELETE(request: Request) {
  try {
    const body = await request.json();

    const id = typeof body.id === "string" ? body.id.trim() : "";

    if (!id) {
      return NextResponse.json(
        {
          ok: false,
          error: "El ID del bot es obligatorio.",
        },
        { status: 400 },
      );
    }

    // Get name and community_id before deleting for the log
    const botResult = await query<{ name: string; community_id: string }>(
      "SELECT name, community_id FROM bots WHERE id = $1",
      [id],
    );

    if (botResult.rowCount === 0) {
      return NextResponse.json(
        {
          ok: false,
          error: "El bot no existe.",
        },
        { status: 404 },
      );
    }

    const { name: botName, community_id: communityId } = botResult.rows[0];

    const result = await query(
      `
        DELETE FROM bots
        WHERE id = $1
      `,
      [id],
    );

    await recordAuditLog(
      "bot_deleted",
      `Se eliminó el bot "${botName}"`,
      communityId,
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
        error: "No se pudo eliminar el bot.",
      },
      { status: 500 },
    );
  }
}
