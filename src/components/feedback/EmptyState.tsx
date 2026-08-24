import { Button } from "@/components/ui/Button";
import type { AppPath } from "@/types";
import styles from "./EmptyState.module.css";

type EmptyStateProps = {
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: AppPath;
};

export function EmptyState({
  title,
  description,
  actionLabel,
  actionHref,
}: EmptyStateProps) {
  return (
    <div className={styles.state}>
      <h3 className={styles.title}>{title}</h3>
      <p className={styles.description}>{description}</p>
      {actionLabel && actionHref ? (
        <Button href={actionHref} variant="secondary">
          {actionLabel}
        </Button>
      ) : null}
    </div>
  );
}
