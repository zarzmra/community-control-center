import styles from "./LoadingState.module.css";

type LoadingStateProps = {
  label?: string;
};

export function LoadingState({ label = "Cargando…" }: LoadingStateProps) {
  return (
    <div className={styles.state} role="status" aria-live="polite">
      <span className={styles.dot} aria-hidden="true" />
      <p>{label}</p>
    </div>
  );
}
