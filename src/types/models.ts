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

export type BotStatus =
  | "draft"
  | "stopped"
  | "starting"
  | "running"
  | "stopping"
  | "error";

export type BotDesiredStatus = "stopped" | "running";

export type BotOperationType = "start" | "stop" | "restart";

export type BotOperationPhase = "none" | "starting" | "stopping";

export type BotOperationStatus =
  | "pending"
  | "claimed"
  | "running"
  | "completed"
  | "failed"
  | "cancelled"
  | "expired";

export interface Bot {
  id: string;
  name: string;
  community_id: string;
  channel_id: string | null;
  description: string;
  command_prefix: string;
  config: Record<string, unknown>;
  status: BotStatus;
  desired_status: BotDesiredStatus;
  last_error: string | null;
  last_error_at: string | null;
  last_activity_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface BotOperation {
  id: string;
  bot_id: string;
  community_id: string;
  operation_type: BotOperationType;
  phase: BotOperationPhase;
  status: BotOperationStatus;
  requested_by: string | null;
  requested_at: string;
  claimed_by: string | null;
  claimed_at: string | null;
  started_at: string | null;
  completed_at: string | null;
  attempt_count: number;
  last_error: string | null;
  correlation_id: string;
  created_at: string;
  updated_at: string;
}

export type ChannelType = "whatsapp" | "web" | "other";
export type ChannelStatus = "connected" | "disconnected" | "pending";
export type ChannelConnectionStatus =
  | "configured"
  | "pending"
  | "connected"
  | "disconnected"
  | "error";

export interface Channel {
  id: string;
  name: string;
  type: ChannelType;
  status: ChannelStatus;
  connection_status: ChannelConnectionStatus;
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
