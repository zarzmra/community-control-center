import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { apiErrorResponse } from "@/lib/api";
import { requireAdmin } from "@/lib/authorization";

type RecentCommunity = {
  id: string;
  name: string;
  description: string;
  status: "active" | "inactive";
  members: number;
  bots: number;
  channels: number;
};

type AuditLog = {
  id: string;
  event_type: string;
  details: string;
  community_id: string | null;
  created_at: string;
};

export async function GET() {
  try {
    await requireAdmin();
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
        c.id,
        c.name,
        c.description,
        c.status,
        c.members,
        COUNT(DISTINCT b.id)::int AS bots,
        COUNT(DISTINCT ch.id)::int AS channels
      FROM communities c
      LEFT JOIN bots b ON b.community_id = c.id
      LEFT JOIN channels ch ON ch.community_id = c.id
      GROUP BY c.id, c.name, c.description, c.status, c.members, c.created_at
      ORDER BY c.created_at DESC
      LIMIT 5
    `);

    const logsResult = await query<AuditLog>(`
      SELECT
        id,
        event_type,
        details,
        community_id,
        created_at
      FROM audit_logs
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
        recentActivity: logsResult.rows,
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
          message: "Pendiente de configuración.",
        },
      ],
    });
  } catch (error) {
    return apiErrorResponse(
      error,
      "No se pudieron cargar las estadísticas del Dashboard.",
    );
  }
}
