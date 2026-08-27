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
      {metric.isDemo ? (
        <div className={styles.meta}>
          <Badge variant="demo">Demo</Badge>
        </div>
      ) : null}
    </Card>
  );
}
