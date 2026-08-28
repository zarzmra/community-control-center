import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { apiErrorResponse } from "@/lib/api";
import { requireSession } from "@/lib/authorization";

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
    const context = await requireSession();
    const statsResult = await query<{
      communities: number;
      active_bots: number;
      automations: number;
    }>(`
      SELECT
        (SELECT COUNT(*)::int FROM communities c
         WHERE $1 = 'admin' OR EXISTS (
           SELECT 1 FROM community_memberships cm
           WHERE cm.community_id = c.id AND cm.user_id = $2
         )) AS communities,
        (SELECT COUNT(*)::int FROM bots b
         WHERE b.status = 'online' AND ($1 = 'admin' OR EXISTS (
           SELECT 1 FROM community_memberships cm
           WHERE cm.community_id = b.community_id AND cm.user_id = $2
         ))) AS active_bots,
        (SELECT COUNT(*)::int FROM automations a
         WHERE a.status = 'active' AND ($1 = 'admin' OR EXISTS (
           SELECT 1 FROM community_memberships cm
           WHERE cm.community_id = a.community_id AND cm.user_id = $2
         ))) AS automations
    `, [context.role, context.userId]);

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
      WHERE $1 = 'admin' OR EXISTS (
        SELECT 1 FROM community_memberships cm
        WHERE cm.community_id = c.id AND cm.user_id = $2
      )
      GROUP BY c.id, c.name, c.description, c.status, c.members, c.created_at
      ORDER BY c.created_at DESC
      LIMIT 5
    `, [context.role, context.userId]);

    const logsResult = await query<AuditLog>(`
      SELECT
        id,
        event_type,
        details,
        community_id,
        created_at
      FROM audit_logs al
      WHERE al.community_id IS NOT NULL
        AND ($1 = 'admin' OR EXISTS (
          SELECT 1 FROM community_memberships cm
          WHERE cm.community_id = al.community_id AND cm.user_id = $2
        ))
      ORDER BY al.created_at DESC
      LIMIT 5
    `, [context.role, context.userId]);

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
