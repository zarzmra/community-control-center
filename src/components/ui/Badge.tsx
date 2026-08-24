import { cx } from "@/lib/cx";
import styles from "./Badge.module.css";

export type BadgeVariant =
  | "neutral"
  | "demo"
  | "success"
  | "warning"
  | "danger"
  | "unconfigured";

type BadgeProps = {
  children: React.ReactNode;
  variant?: BadgeVariant;
};

export function Badge({ children, variant = "neutral" }: BadgeProps) {
  return <span className={cx(styles.badge, styles[variant])}>{children}</span>;
}
