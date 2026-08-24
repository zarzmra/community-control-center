import { cx } from "@/lib/cx";
import styles from "./Card.module.css";

type CardProps = {
  children: React.ReactNode;
  className?: string;
  as?: "section" | "article" | "div";
  ariaLabel?: string;
};

export function Card({
  children,
  className,
  as: Component = "section",
  ariaLabel,
}: CardProps) {
  return (
    <Component className={cx(styles.card, className)} aria-label={ariaLabel}>
      {children}
    </Component>
  );
}

type CardHeaderProps = {
  title: string;
  description?: string;
};

export function CardHeader({ title, description }: CardHeaderProps) {
  return (
    <header className={styles.header}>
      <h2 className={styles.title}>{title}</h2>
      {description ? <p className={styles.description}>{description}</p> : null}
    </header>
  );
}
