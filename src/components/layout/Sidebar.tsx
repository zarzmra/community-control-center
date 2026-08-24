import Link from "next/link";
import {
  AutomationsIcon,
  BotsIcon,
  ChannelsIcon,
  CloseIcon,
  CommunitiesIcon,
  DashboardIcon,
  SettingsIcon,
} from "@/components/ui/icons";
import { cx } from "@/lib/cx";
import { isNavItemActive, NAV_ITEMS } from "@/lib/navigation";
import type { NavIconName } from "@/types";
import styles from "./Sidebar.module.css";

const ICONS: Record<NavIconName, typeof DashboardIcon> = {
  dashboard: DashboardIcon,
  communities: CommunitiesIcon,
  bots: BotsIcon,
  channels: ChannelsIcon,
  automations: AutomationsIcon,
  settings: SettingsIcon,
};

type SidebarProps = {
  open: boolean;
  pathname: string;
  onClose: () => void;
  closeButtonRef: React.RefObject<HTMLButtonElement | null>;
  sidebarRef: React.RefObject<HTMLElement | null>;
};

export function Sidebar({
  open,
  pathname,
  onClose,
  closeButtonRef,
  sidebarRef,
}: SidebarProps) {
  return (
    <>
      {open ? (
        <button
          type="button"
          className={styles.overlay}
          aria-label="Cerrar menú"
          onClick={onClose}
        />
      ) : null}

      <aside
        ref={sidebarRef}
        id="navegacion-principal"
        className={cx(styles.sidebar, open && styles.open)}
        aria-label="Barra lateral"
      >
        <div className={styles.headerRow}>
          <div className={styles.brand}>
            <span className={styles.brandMark}>CCC</span>
            <span className={styles.brandName}>Community Control Center</span>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            className={styles.closeButton}
            aria-label="Cerrar menú"
            onClick={onClose}
          >
            <CloseIcon />
          </button>
        </div>

        <nav className={styles.nav} aria-label="Principal">
          {NAV_ITEMS.map((item) => {
            const Icon = ICONS[item.id];
            const active = isNavItemActive(pathname, item.href);

            return (
              <Link
                key={item.id}
                href={item.href}
                className={cx(styles.link, active && styles.linkActive)}
                aria-current={active ? "page" : undefined}
                onClick={onClose}
              >
                <Icon className={styles.icon} />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
