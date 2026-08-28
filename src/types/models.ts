export type CommunityStatus = "active" | "inactive";
export type GlobalRole = "admin" | "member";
export type CommunityRole = "admin" | "member";

export interface User {
  id: string;
  name: string;
  email: string;
  role: GlobalRole;
  created_at: string;
  updated_at: string;
}

export interface CommunityMembership {
  id: string;
  community_id: string;
  user_id: string;
  role: CommunityRole;
  created_at: string;
  updated_at: string;
}

export interface Community {
  id: string;
  name: string;
  description: string;
  status: CommunityStatus;
  members: number;
  bots: number;
  channels: number;
  created_at: string;
}

export type BotStatus = "online" | "offline" | "error";

export interface Bot {
  id: string;
  name: string;
  community_id: string;
  status: BotStatus;
  created_at: string;
}

export type ChannelType = "whatsapp" | "web" | "other";
export type ChannelStatus = "connected" | "disconnected" | "pending";

export interface Channel {
  id: string;
  name: string;
  type: ChannelType;
  status: ChannelStatus;
  community_id: string;
  created_at: string;
}

export type AutomationStatus = "active" | "paused" | "draft";

export interface Automation {
  id: string;
  name: string;
  community_id: string;
  status: AutomationStatus;
  trigger: string;
  created_at: string;
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
