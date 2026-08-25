import { NextResponse } from "next/server";
import { query } from "@/lib/db";

type RecentCommunity = {
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
    const statsResult = await query<{
      communities: number;
      active_bots: number;
      automations: number;
    }>(`
      SELECT
        (SELECT COUNT(*)::int FROM communities) AS communities,
        (SELECT COUNT(*)::int FROM bots WHERE status = 'online') AS active_bots,
        (SELECT COUNT(*)::int FROM automations WHERE status = 'active') AS automations
    `);

    const communitiesResult = await query<RecentCommunity>(`
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
      LIMIT 5
    `);

    const stats = statsResult.rows[0];

    return NextResponse.json({
      ok: true,
      data: {
        communities: stats.communities,
        activeBots: stats.active_bots,
        users: null,
        messages: null,
        automations: stats.automations,
        recentCommunities: communitiesResult.rows,
      },
      services: [
        {
          id: "app",
          name: "App",
          health: "operational",
          message: "Interfaz disponible.",
        },
        {
          id: "postgres",
          name: "PostgreSQL",
          health: "operational",
          message: "Base de datos conectada.",
        },
        {
          id: "redis",
          name: "Redis",
          health: "unconfigured",
          message: "Pendiente de conexión.",
        },
      ],
    });
  } catch {
    return NextResponse.json(
      {
        ok: false,
        error: "No se pudieron cargar las estadísticas del Dashboard.",
      },
      { status: 500 },
    );
  }
}
