import { auth } from "@/auth";
import { ApiError } from "@/lib/api";

export async function requireSession() {
  const session = await auth();

  if (!session?.user?.id || !session.user.role) {
    throw new ApiError(401, "No autenticado.");
  }

  return session;
}

export async function requireAdmin() {
  const session = await requireSession();

  if (session.user.role !== "admin") {
    throw new ApiError(
      403,
      "No tienes permisos para modificar recursos.",
    );
  }

  return session;
}

/**
 * The current schema has no community membership relation. Admins are the
 * only role with a safely expressible community-wide scope until Phase 2.
 */
export async function requireCommunityAdmin() {
  return requireAdmin();
}
