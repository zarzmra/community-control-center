import type { DashboardMetric, ServiceStatus } from "@/types";

export type RecentCommunity = {
  id: string;
  name: string;
  description: string;
  status: "active" | "inactive";
  members: number;
  bots: number;
  channels: number;
};

export type AuditLog = {
  id: string;
  event_type: string;
  details: string;
  community_id: string | null;
  created_at: string;
};

export type DashboardData = {
  metrics: readonly DashboardMetric[];
  services: readonly ServiceStatus[];
  recentCommunities: readonly RecentCommunity[];
  recentActivity: readonly AuditLog[];
};

export type DashboardApiResponse = {
  ok: boolean;
  data: {
    communities: number | null;
    activeBots: number | null;
    users: number | null;
    messages: number | null;
    automations: number | null;
    recentCommunities: readonly RecentCommunity[];
    recentActivity: readonly AuditLog[];
  };
  services: readonly ServiceStatus[];
};
