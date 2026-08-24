import type { DashboardMetric, ServiceStatus } from "@/types";

export const DASHBOARD_METRICS: readonly DashboardMetric[] = [
  { id: "communities", label: "Comunidades", value: null, isDemo: true },
  { id: "active-bots", label: "Bots activos", value: null, isDemo: true },
  { id: "users", label: "Usuarios", value: null, isDemo: true },
  { id: "messages", label: "Mensajes", value: null, isDemo: true },
  { id: "automations", label: "Automatizaciones", value: null, isDemo: true },
];

export const SERVICE_STATUSES: readonly ServiceStatus[] = [
  {
    id: "app",
    name: "App",
    health: "operational",
    message: "Interfaz disponible. Backend no conectado.",
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
];
