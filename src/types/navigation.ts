export type AppPath =
  | "/"
  | "/communities"
  | "/bots"
  | "/channels"
  | "/automations"
  | "/settings";

export type NavIconName =
  | "dashboard"
  | "communities"
  | "bots"
  | "channels"
  | "automations"
  | "settings";

export interface NavItem {
  id: NavIconName;
  href: AppPath;
  label: string;
}
