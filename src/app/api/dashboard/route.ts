import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    ok: true,
    data: {
      communities: null,
      activeBots: null,
      users: null,
      messages: null,
      automations: null,
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
        health: "unconfigured",
        message: "Pendiente de conexión.",
      },
      {
        id: "redis",
        name: "Redis",
        health: "unconfigured",
        message: "Pendiente de conexión.",
      },
    ],
  });
}
