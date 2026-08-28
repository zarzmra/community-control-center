import { hash } from "bcryptjs";
import { NextResponse } from "next/server";
import { query, withTransaction } from "@/lib/db";
import { recordAuditLog } from "@/lib/audit";
import {
  ApiError, apiErrorResponse, readJsonBody, requireEnum, requireString, requireUuid,
} from "@/lib/api";
import { requireAdmin } from "@/lib/authorization";

type UserRow = {
  id: string; name: string; email: string; role: "admin" | "member";
  created_at: string; updated_at: string;
};
type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteContext) {
  try {
    await requireAdmin();
    const { id } = await params;
    requireUuid(id, "El ID del usuario");
    const result = await query<UserRow>(
      `SELECT id, name, email, role, created_at, updated_at FROM users WHERE id = $1`,
      [id],
    );
    if (!result.rows[0]) throw new ApiError(404, "El usuario no existe.");
    return NextResponse.json({ ok: true, data: result.rows[0] });
  } catch (error) {
    return apiErrorResponse(error, "No se pudo cargar el usuario.");
  }
}

export async function PATCH(request: Request, { params }: RouteContext) {
  try {
    const session = await requireAdmin();
    const { id } = await params;
    requireUuid(id, "El ID del usuario");
    const body = await readJsonBody<{
      name?: unknown; email?: unknown; password?: unknown; role?: unknown;
    }>(request);
    const current = await query<UserRow>("SELECT id, name, email, role, created_at, updated_at FROM users WHERE id = $1", [id]);
    if (!current.rows[0]) throw new ApiError(404, "El usuario no existe.");
    const name = body.name === undefined ? current.rows[0].name : requireString(body.name, "El nombre", { max: 200 });
    const email = body.email === undefined
      ? current.rows[0].email
      : requireString(body.email, "El correo", { max: 320 }).toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new ApiError(400, "El correo no es válido.");
    const role = body.role === undefined ? current.rows[0].role : requireEnum(body.role, "El rol", ["admin", "member"] as const);
    if (id === session.userId && role !== "admin") throw new ApiError(409, "No puedes quitarte tu propio acceso de administrador.");
    let result;
    if (body.password === undefined) {
      result = await query<UserRow>(
        `UPDATE users SET name = $1, email = $2, role = $3, updated_at = now()
         WHERE id = $4 RETURNING id, name, email, role, created_at, updated_at`,
        [name, email, role, id],
      );
    } else {
      const passwordHash = await hash(requireString(body.password, "La contraseña", { min: 12, max: 200 }), 12);
      result = await query<UserRow>(
        `UPDATE users SET name = $1, email = $2, password_hash = $3, role = $4, updated_at = now()
         WHERE id = $5 RETURNING id, name, email, role, created_at, updated_at`,
        [name, email, passwordHash, role, id],
      );
    }
    const user = result.rows[0];
    await recordAuditLog("user_updated", `Se actualizó el usuario "${user.email}"`, undefined, {
      userId: session.userId, entityType: "user", entityId: user.id,
    });
    return NextResponse.json({ ok: true, data: user });
  } catch (error) {
    return apiErrorResponse(error, "No se pudo actualizar el usuario.");
  }
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  try {
    const session = await requireAdmin();
    const { id } = await params;
    requireUuid(id, "El ID del usuario");
    if (id === session.userId) throw new ApiError(409, "No puedes eliminar tu propio usuario.");
    await withTransaction(async (client) => {
      const result = await client.query<UserRow>("DELETE FROM users WHERE id = $1 RETURNING id, email", [id]);
      if (!result.rows[0]) throw new ApiError(404, "El usuario no existe.");
      await recordAuditLog("user_deleted", `Se eliminó el usuario "${result.rows[0].email}"`, undefined, {
        userId: session.userId, entityType: "user", entityId: id, client,
      });
    });
    return NextResponse.json({ ok: true, data: { id } });
  } catch (error) {
    return apiErrorResponse(error, "No se pudo eliminar el usuario.");
  }
}
