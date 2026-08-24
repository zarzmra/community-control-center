import styles from "./SkipLink.module.css";

export function SkipLink() {
  return (
    <a className={styles.link} href="#contenido-principal">
      Saltar al contenido principal
    </a>
  );
}
