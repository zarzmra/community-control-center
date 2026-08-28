import { hash } from "bcryptjs";
import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { recordAuditLog } from "@/lib/audit";
import {
  ApiError,
  apiErrorResponse,
  parsePagination,
  readJsonBody,
  requireEnum,
  requireString,
} from "@/lib/api";
import { requireAdmin } from "@/lib/authorization";

type UserRow = {
  id: string;
  name: string;
  email: string;
  role: "admin" | "member";
  created_at: string;
  updated_at: string;
};

export async function GET(request: Request) {
  try {
    await requireAdmin();
    const { limit, offset, page } = parsePagination(request);
    const result = await query<UserRow>(
      `SELECT id, name, email, role, created_at, updated_at
       FROM users ORDER BY created_at DESC LIMIT $1 OFFSET $2`,
      [limit, offset],
    );
    return NextResponse.json({
      ok: true,
      data: result.rows,
      meta: { page, limit, hasMore: result.rows.length === limit },
    });
  } catch (error) {
    return apiErrorResponse(error, "No se pudieron cargar los usuarios.");
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireAdmin();
    const body = await readJsonBody<{
      name: unknown; email: unknown; password: unknown; role?: unknown;
    }>(request);
    const name = requireString(body.name, "El nombre", { max: 200 });
    const email = requireString(body.email, "El correo", { max: 320 }).toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new ApiError(400, "El correo no es válido.");
    }
    const password = requireString(body.password, "La contraseña", { min: 12, max: 200 });
    const role = body.role === undefined
      ? "member"
      : requireEnum(body.role, "El rol", ["admin", "member"] as const);
    const passwordHash = await hash(password, 12);
    const result = await query<UserRow>(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, email, role, created_at, updated_at`,
      [name, email, passwordHash, role],
    );
    const user = result.rows[0];
    await recordAuditLog("user_created", `Se creó el usuario "${user.email}"`, undefined, {
      userId: session.userId, entityType: "user", entityId: user.id,
    });
    return NextResponse.json({ ok: true, data: user }, { status: 201 });
  } catch (error) {
    return apiErrorResponse(error, "No se pudo crear el usuario.");
  }
}
