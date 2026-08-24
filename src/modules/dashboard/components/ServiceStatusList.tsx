import { Badge } from "@/components/ui/Badge";
import type { BadgeVariant } from "@/components/ui/Badge";
import type { ServiceHealth, ServiceStatus } from "@/types";
import styles from "./ServiceStatusList.module.css";

const HEALTH_LABEL: Record<ServiceHealth, string> = {
  operational: "Operativo",
  degraded: "Degradado",
  down: "Caído",
  unconfigured: "Unconfigured",
};

const HEALTH_VARIANT: Record<ServiceHealth, BadgeVariant> = {
  operational: "success",
  degraded: "warning",
  down: "danger",
  unconfigured: "unconfigured",
};

type ServiceStatusListProps = {
  services: readonly ServiceStatus[];
};

export function ServiceStatusList({ services }: ServiceStatusListProps) {
  return (
    <ul className={styles.list}>
      {services.map((service) => (
        <li key={service.id} className={styles.item}>
          <p className={styles.name}>{service.name}</p>
          <Badge variant={HEALTH_VARIANT[service.health]}>
            {HEALTH_LABEL[service.health]}
          </Badge>
          <p className={styles.message}>{service.message}</p>
        </li>
      ))}
    </ul>
  );
}
