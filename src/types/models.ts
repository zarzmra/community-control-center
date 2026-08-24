export type CommunityStatus = "active" | "paused" | "archived";

export interface Community {
  id: string;
  name: string;
  slug: string;
  status: CommunityStatus;
  memberCount: number;
  createdAt: string;
}

export type BotStatus = "online" | "offline" | "error";

export interface Bot {
  id: string;
  name: string;
  communityId: string;
  status: BotStatus;
  createdAt: string;
}

export type ChannelType = "whatsapp" | "web" | "other";
export type ChannelStatus = "connected" | "disconnected" | "pending";

export interface Channel {
  id: string;
  name: string;
  type: ChannelType;
  status: ChannelStatus;
  communityId: string;
}

export type AutomationStatus = "active" | "paused" | "draft";

export interface Automation {
  id: string;
  name: string;
  communityId: string;
  status: AutomationStatus;
  trigger: string;
}

export interface DashboardMetric {
  id: string;
  label: string;
  value: number | null;
  isDemo: boolean;
}

export type ServiceHealth =
  | "operational"
  | "degraded"
  | "down"
  | "unconfigured";

export interface ServiceStatus {
  id: string;
  name: string;
  health: ServiceHealth;
  message: string;
}
