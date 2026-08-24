import type { AppPath, NavItem } from "@/types";

export const NAV_ITEMS: readonly NavItem[] = [
  { id: "dashboard", href: "/", label: "Dashboard" },
  { id: "communities", href: "/communities", label: "Comunidades" },
  { id: "bots", href: "/bots", label: "Bots" },
  { id: "channels", href: "/channels", label: "Canales" },
  { id: "automations", href: "/automations", label: "Automatizaciones" },
  { id: "settings", href: "/settings", label: "Configuración" },
] as const;

export function isNavItemActive(pathname: string, href: AppPath): boolean {
  if (href === "/") {
    return pathname === "/";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function getActiveNavItem(pathname: string): NavItem {
  const match = NAV_ITEMS.find((item) => isNavItemActive(pathname, item.href));
  return match ?? NAV_ITEMS[0];
}
