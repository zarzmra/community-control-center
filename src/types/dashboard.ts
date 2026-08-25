import type { DashboardMetric, ServiceStatus } from "@/types";

export type DashboardData = {
  metrics: readonly DashboardMetric[];
  services: readonly ServiceStatus[];
};

export type DashboardApiResponse = {
  ok: boolean;
  data: {
    communities: number | null;
    activeBots: number | null;
    users: number | null;
    messages: number | null;
    automations: number | null;
  };
  services: readonly ServiceStatus[];
};
