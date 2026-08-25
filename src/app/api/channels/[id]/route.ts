import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { recordAuditLog } from "@/lib/audit";

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

    const communityId =
      typeof body.communityId === "string"
        ? body.communityId.trim()
        : "";

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

    if (!id || !name || !communityId || !type || !status) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "El nombre, comunidad, tipo y estado del canal son obligatorios.",
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
          community_id = $4,
          updated_at = now()
        WHERE id = $5
        RETURNING
          id,
          name,
          type,
          status,
          community_id
      `,
      [name, type, status, communityId, id],
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

    const channel = result.rows[0];

    await recordAuditLog(
      "channel_updated",
      `Se actualizó el canal "${channel.name}"`,
      channel.community_id,
    );

    return NextResponse.json({
      ok: true,
      data: channel,
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

    // Get info before deleting for the log
    const channelResult = await query<Channel>(
      "SELECT name, community_id FROM channels WHERE id = $1",
      [id],
    );

    const channelInfo = channelResult.rows[0];

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

    if (channelInfo) {
      await recordAuditLog(
        "channel_deleted",
        `Se eliminó el canal "${channelInfo.name}"`,
        channelInfo.community_id,
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
