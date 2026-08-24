import { Button } from "@/components/ui/Button";
import styles from "./ErrorState.module.css";

type ErrorStateProps = {
  title?: string;
  description?: string;
  onRetry?: () => void;
};

export function ErrorState({
  title = "No se pudo completar la operación",
  description = "Ha ocurrido un error. Inténtalo de nuevo más tarde.",
  onRetry,
}: ErrorStateProps) {
  return (
    <div className={styles.state} role="alert">
      <h3 className={styles.title}>{title}</h3>
      <p className={styles.description}>{description}</p>
      {onRetry ? (
        <Button variant="secondary" onClick={onRetry}>
          Reintentar
        </Button>
      ) : null}
    </div>
  );
}
