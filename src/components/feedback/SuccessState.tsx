import styles from "./SuccessState.module.css";

type SuccessStateProps = {
  title?: string;
  description?: string;
};

export function SuccessState({
  title = "Operación completada",
  description = "Los cambios se han aplicado correctamente.",
}: SuccessStateProps) {
  return (
    <div className={styles.state} role="status">
      <h3 className={styles.title}>{title}</h3>
      {description ? <p className={styles.description}>{description}</p> : null}
    </div>
  );
}
