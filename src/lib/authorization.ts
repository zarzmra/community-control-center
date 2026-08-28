import { auth } from "@/auth";
import { ApiError } from "@/lib/api";
import { query } from "@/lib/db";
import type { Session } from "next-auth";

export type GlobalRole = "admin" | "member";
export type CommunityRole = "admin" | "member";

export type AuthorizationContext = {
  session: Session;
  userId: string;
  role: GlobalRole;
};

export async function requireSession(): Promise<AuthorizationContext> {
  const session = await auth();

  if (!session?.user?.id) {
    throw new ApiError(401, "No autenticado.");
  }

  const result = await query<{ id: string; role: GlobalRole }>(
    "SELECT id, role FROM users WHERE id = $1 LIMIT 1",
    [session.user.id],
  );
  const user = result.rows[0];

  if (!user) {
    throw new ApiError(401, "La sesión ya no es válida.");
  }

  return { session, userId: user.id, role: user.role };
}

export async function requireAdmin() {
  const context = await requireSession();

  if (context.role !== "admin") {
    throw new ApiError(
      403,
      "No tienes permisos para modificar recursos.",
    );
  }

  return context;
}

export async function requireCommunityAccess(communityId: string) {
  const context = await requireSession();

  if (context.role === "admin") return { ...context, communityRole: "admin" as const };

  const result = await query<{ role: CommunityRole }>(
    `SELECT role FROM community_memberships
     WHERE community_id = $1 AND user_id = $2
     LIMIT 1`,
    [communityId, context.userId],
  );

  if (!result.rows[0]) {
    throw new ApiError(404, "La comunidad no existe o no está disponible.");
  }

  return { ...context, communityRole: result.rows[0].role };
}

export async function requireCommunityAdmin(communityId: string) {
  const context = await requireCommunityAccess(communityId);

  if (context.role !== "admin" && context.communityRole !== "admin") {
    throw new ApiError(403, "No tienes permisos para administrar esta comunidad.");
  }

  return context;
}
