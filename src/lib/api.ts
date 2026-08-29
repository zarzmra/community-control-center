import { NextResponse } from "next/server";

export class ApiError extends Error {
  constructor(
    public readonly status: 400 | 401 | 403 | 404 | 409 | 422 | 500,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function apiErrorResponse(error: unknown, fallback: string) {
  if (error instanceof ApiError) {
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: error.status },
    );
  }

  console.error(fallback, error);
  return NextResponse.json(
    { ok: false, error: fallback },
    { status: 500 },
  );
}

export async function readJsonBody<T>(request: Request): Promise<T> {
  try {
    return (await request.json()) as T;
  } catch {
    throw new ApiError(400, "El cuerpo de la solicitud debe ser JSON válido.");
  }
}

export function parsePagination(request: Request) {
  const params = new URL(request.url).searchParams;
  const page = parsePositiveInteger(params.get("page"), 1);
  const limit = parsePositiveInteger(params.get("limit"), 50);

  if (page > 100_000) {
    throw new ApiError(400, "El parámetro page no es válido.");
  }

  return {
    page,
    limit: Math.min(limit, 100),
    offset: (page - 1) * Math.min(limit, 100),
  };
}

function parsePositiveInteger(value: string | null, fallback: number) {
  if (value === null) return fallback;
  if (!/^[1-9]\d*$/.test(value)) {
    throw new ApiError(400, "Los parámetros page y limit deben ser enteros positivos.");
  }

  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed)) {
    throw new ApiError(400, "Los parámetros page y limit no son válidos.");
  }

  return parsed;
}

export function requireUuid(value: unknown, field: string) {
  if (
    typeof value !== "string" ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value,
    )
  ) {
    throw new ApiError(400, `${field} no es un UUID válido.`);
  }

  return value;
}

export function requireString(
  value: unknown,
  field: string,
  options: { min?: number; max?: number } = {},
) {
  const text = typeof value === "string" ? value.trim() : "";
  const min = options.min ?? 1;
  const max = options.max ?? 500;

  if (text.length < min || text.length > max) {
    throw new ApiError(
      400,
      `${field} debe tener entre ${min} y ${max} caracteres.`,
    );
  }

  return text;
}

export function optionalString(
  value: unknown,
  field: string,
  max = 5000,
) {
  if (value === undefined || value === null) return "";
  return requireString(value, field, { min: 0, max });
}

export function requireEnum<T extends string>(
  value: unknown,
  field: string,
  allowed: readonly T[],
) {
  if (typeof value !== "string" || !allowed.includes(value as T)) {
    throw new ApiError(400, `${field} no es válido.`);
  }

  return value as T;
}

export function requireJsonObject(
  value: unknown,
  field: string,
  maxBytes = 10_000,
) {
  if (
    value === null ||
    typeof value !== "object" ||
    Array.isArray(value)
  ) {
    throw new ApiError(400, `${field} debe ser un objeto JSON.`);
  }

  let serialized: string;
  try {
    serialized = JSON.stringify(value);
  } catch {
    throw new ApiError(400, `${field} no es válido.`);
  }

  if (serialized.length > maxBytes) {
    throw new ApiError(400, `${field} excede el tamaño permitido.`);
  }

  const sensitiveKey = /(token|secret|password|cookie|api[_-]?key|credential|session|qr)/i;
  const inspect = (item: unknown): void => {
    if (!item || typeof item !== "object") return;
    for (const [key, child] of Object.entries(item)) {
      if (sensitiveKey.test(key)) {
        throw new ApiError(400, `${field} contiene una clave no permitida.`);
      }
      inspect(child);
    }
  };
  inspect(value);

  return value as Record<string, unknown>;
}

export function requireAllowedKeys(
  value: Record<string, unknown>,
  allowed: readonly string[],
) {
  const allowedSet = new Set(allowed);
  const unknownKey = Object.keys(value).find((key) => !allowedSet.has(key));
  if (unknownKey) {
    throw new ApiError(400, `El campo "${unknownKey}" no está permitido.`);
  }
}
