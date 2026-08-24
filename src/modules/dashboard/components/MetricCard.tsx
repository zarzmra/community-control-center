import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import type { DashboardMetric } from "@/types";
import styles from "./MetricCard.module.css";

type MetricCardProps = {
  metric: DashboardMetric;
};

export function MetricCard({ metric }: MetricCardProps) {
  const displayValue = metric.value === null ? "—" : String(metric.value);

  return (
    <Card className={styles.metric} as="article" ariaLabel={metric.label}>
      <p className={styles.label}>{metric.label}</p>
      <p className={styles.value}>{displayValue}</p>
      <div className={styles.meta}>
        <Badge variant="neutral">Sin datos</Badge>
        {metric.isDemo ? <Badge variant="demo">Demo</Badge> : null}
      </div>
    </Card>
  );
}
